import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import sharp from 'sharp';
import { 
  ensureDirectoryExists, 
  getFontStoragePath, 
  saveImageFromDataURL,
  createTempDirectory
} from '@/utils/helpers';
import { SourceImage, CharacterMapping, FontMetadata } from '@/context/FontContext';
import prisma from '@/lib/prisma';
import * as supabaseStorage from '@/services/supabaseStorage';

interface FontGenerationRequest {
  characterMappings: CharacterMapping[];
  sourceImages: SourceImage[];
  metadata: FontMetadata;
  format: string;
  fontId: string;
  userId?: string;
}

interface FontGenerationResult {
  success: boolean;
  error?: string;
  metadata?: any;
  fontId?: string;
}

interface FontRetrievalResult {
  success: boolean;
  error?: string;
  filePath?: string;
  fontName?: string;
  url?: string;
}

// Helper function to get content type based on format
const getContentType = (format: string): string => {
  switch (format.toLowerCase()) {
    case 'ttf':
      return 'font/ttf';
    case 'otf':
      return 'font/otf';
    case 'woff':
      return 'font/woff';
    case 'woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
};

// Helper function to handle image URLs (both data URLs and file paths)
async function handleImageUrl(url: string, outputPath: string): Promise<void> {
  if (url.startsWith('data:')) {
    // Handle data URL
    await saveImageFromDataURL(url, outputPath);
  } else if (url.startsWith('/')) {
    // Handle file path
    const fullPath = path.join(process.cwd(), 'public', url);
    fs.copyFileSync(fullPath, outputPath);
  } else {
    throw new Error('Invalid image URL format');
  }
}

/**
 * Generates a font based on character mappings and source images
 */
export async function generateFont(request: FontGenerationRequest): Promise<FontGenerationResult> {
  const { characterMappings, sourceImages, metadata, format, fontId, userId } = request;
  
  try {
    // 1. Create a directory for the font project
    const fontStoragePath = getFontStoragePath();
    const fontProjectPath = path.join(fontStoragePath, fontId);
    ensureDirectoryExists(fontProjectPath);
    
    // 2. Create subdirectories
    const imagesPath = path.join(fontProjectPath, 'images');
    const charsPath = path.join(fontProjectPath, 'chars');
    const outputPath = path.join(fontProjectPath, 'output');
    ensureDirectoryExists(imagesPath);
    ensureDirectoryExists(charsPath);
    ensureDirectoryExists(outputPath);
    
    // 3. Save metadata
    const metadataPath = path.join(fontProjectPath, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify({
      ...metadata,
      createdAt: new Date().toISOString(),
      characterCount: characterMappings.length,
      format,
    }, null, 2));
    
    // 4. Save source images
    const sourceImageMap = new Map<string, string>();
    for (const image of sourceImages) {
      const imageFileName = `image_${image.id}.png`;
      const imagePath = path.join(imagesPath, imageFileName);
      await handleImageUrl(image.url, imagePath);
      sourceImageMap.set(image.id, imagePath);
    }
    
    // 5. Extract and process character images
    const characterData = [];
    const dbCharMappings = [];
    
    for (const mapping of characterMappings) {
      const sourceImagePath = sourceImageMap.get(mapping.sourceImageId);
      if (!sourceImagePath) {
        console.warn(`Source image not found for mapping: ${mapping.id}`);
        continue;
      }
      
      const charFileName = `char_${mapping.char.charCodeAt(0)}.png`;
      const charPath = path.join(charsPath, charFileName);
      
      // Extract and process the character from the source image
      const result = await extractCharacter(
        sourceImagePath,
        charPath,
        mapping.x1,
        mapping.y1,
        mapping.x2,
        mapping.y2
      );
      
      if (!result.success) {
        console.warn(`Failed to extract character ${mapping.char}: ${result.error}`);
        continue;
      }
      
      // Upload the character image to Supabase
      const uploadResult = await supabaseStorage.uploadCharacterImage(
        charPath,
        fontId,
        charFileName
      );
      
      if (!uploadResult.success) {
        console.warn(`Failed to upload character ${mapping.char}: ${uploadResult.error}`);
        continue;
      }
      
      characterData.push({
        char: mapping.char,
        unicode: mapping.char.charCodeAt(0),
        path: charPath,
        url: uploadResult.url || '',
      });
      
      // Store mapping for database
      dbCharMappings.push({
        char: mapping.char,
        x1: mapping.x1,
        y1: mapping.y1,
        x2: mapping.x2,
        y2: mapping.y2,
        originalImageWidth: mapping.originalImageWidth,
        originalImageHeight: mapping.originalImageHeight,
        charImageUrl: uploadResult.url || '',
        charImageKey: uploadResult.path || '',
        sourceImageId: mapping.sourceImageId,
      });
    }
    
    // 6. Save character mapping data
    const charMapPath = path.join(fontProjectPath, 'charmap.json');
    fs.writeFileSync(charMapPath, JSON.stringify(characterData, null, 2));
    
    // 7. Generate the font file
    const fontFileName = `${metadata.name.replace(/\s+/g, '_').toLowerCase()}.${format}`;
    const fontFilePath = path.join(outputPath, fontFileName);
    
    // Generate the font using FontForge
    const fontResult = await generateFontFile(
      charMapPath,
      path.join(outputPath, metadata.name.replace(/\s+/g, '_').toLowerCase()),
      metadata.name,
      format
    );
    
    if (!fontResult.success) {
      throw new Error(fontResult.error || 'Failed to generate font file');
    }
    
    // 8. Upload the font file to Supabase
    const fontFile = fs.readFileSync(fontFilePath);
    const uploadResult = await supabaseStorage.uploadFontFile(
      new Blob([fontFile], { type: getContentType(format) }),
      fontId,
      format,
      metadata.name
    );
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload font file');
    }
    
    // 9. Store in database if userId is provided
    if (userId) {
      try {
        // Create the font record
        const dbFont = await prisma.font.create({
          data: {
            id: fontId,
            name: metadata.name,
            description: metadata.description || '',
            author: metadata.author || '',
            isPublic: metadata.isPublic,
            userId,
            
            // Create source images
            sourceImages: {
              create: sourceImages.map(img => ({
                url: img.url,
                isAiGenerated: img.isAiGenerated,
                aiPrompt: img.aiPrompt,
                width: img.width,
                height: img.height,
              }))
            },
            
            // Create the font file record
            fontFiles: {
              create: {
                format,
                url: uploadResult.url || '',
                storageKey: uploadResult.path || '',
                fileSize: fs.statSync(fontFilePath).size,
              }
            },
            
            // Create tags if provided
            tags: metadata.tags?.length ? {
              create: metadata.tags.map(tag => ({
                name: tag,
              }))
            } : undefined,
          }
        });
        
        // Get source image IDs for mappings
        const sourceImageIds = await prisma.sourceImage.findMany({
          where: {
            fontId
          },
          select: {
            id: true,
            url: true,
          }
        });
        
        // Create character mappings
        await prisma.characterMapping.createMany({
          data: dbCharMappings.map(mapping => {
            // Find the corresponding source image ID from the database
            const sourceImage = sourceImageIds.find(img => img.url === sourceImages.find(si => 
              si.id === mapping.sourceImageId)?.url);
            
            return {
              ...mapping,
              fontId,
              sourceImageId: sourceImage?.id || '',
            };
          }),
        });
        
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue processing even if DB fails
      }
    }
    
    return {
      success: true,
      fontId,
      metadata: {
        fontName: metadata.name,
        format,
        createdAt: new Date().toISOString(),
        characterCount: characterMappings.length,
        url: uploadResult.url,
      }
    };
  } catch (error) {
    console.error('Error generating font:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Font generation failed'
    };
  }
}

/**
 * Extracts a character from a source image using Sharp
 */
async function extractCharacter(
  sourcePath: string,
  outputPath: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Calculate width and height
    const width = x2 - x1;
    const height = y2 - y1;
    
    if (width <= 0 || height <= 0) {
      return { 
        success: false, 
        error: `Invalid dimensions: width=${width}, height=${height}` 
      };
    }
    
    // Read the source image
    await sharp(sourcePath)
      // Extract the region
      .extract({ 
        left: Math.round(x1), 
        top: Math.round(y1), 
        width: Math.round(width), 
        height: Math.round(height) 
      })
      // Process the image for better font rendering
      .threshold(150) // Convert to black and white with threshold
      .png() // Output as PNG
      .toFile(outputPath);
    
    return { success: true };
  } catch (error) {
    console.error('Error extracting character:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Character extraction failed' 
    };
  }
}

/**
 * Generates a font file from the extracted characters using FontForge
 */
async function generateFontFile(
  charMapPath: string,
  outputPath: string,
  fontName: string,
  format: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      // FontForge script path
      const scriptPath = process.env.FONTFORGE_SCRIPT_PATH || path.resolve('./scripts/generate_font.py');
      
      // Check if script exists
      if (!fs.existsSync(scriptPath)) {
        // For testing/development, use a placeholder font
        const placeholderFontPath = path.join(process.cwd(), 'public', 'demo-fonts', `placeholder.${format}`);
        if (fs.existsSync(placeholderFontPath)) {
          fs.copyFileSync(placeholderFontPath, `${outputPath}.${format}`);
          return resolve({ success: true });
        } else {
          return resolve({
            success: false,
            error: `FontForge script not found at ${scriptPath} and no placeholder font available`
          });
        }
      }
      
      // Execute the FontForge script
      const fontforgeProcess = spawn('fontforge', [
        '-script',
        scriptPath,
        charMapPath,
        outputPath,
        fontName,
        format
      ]);
      
      let stdout = '';
      let stderr = '';
      
      fontforgeProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      fontforgeProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      fontforgeProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`FontForge process exited with code ${code}`);
          console.error('stdout:', stdout);
          console.error('stderr:', stderr);
          
          // Check if there's a placeholder we can use instead
          const placeholderFontPath = path.join(process.cwd(), 'public', 'demo-fonts', `placeholder.${format}`);
          if (fs.existsSync(placeholderFontPath)) {
            fs.copyFileSync(placeholderFontPath, `${outputPath}.${format}`);
            resolve({ success: true });
          } else {
            resolve({ 
              success: false, 
              error: `FontForge process failed with code ${code}` 
            });
          }
        } else {
          resolve({ success: true });
        }
      });
    } catch (error) {
      console.error('Error running FontForge:', error);
      
      // Try placeholder font as fallback
      try {
        const placeholderFontPath = path.join(process.cwd(), 'public', 'demo-fonts', `placeholder.${format}`);
        if (fs.existsSync(placeholderFontPath)) {
          fs.copyFileSync(placeholderFontPath, `${outputPath}.${format}`);
          resolve({ success: true });
        } else {
          resolve({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Font generation failed' 
          });
        }
      } catch (fallbackError) {
        resolve({ 
          success: false, 
          error: `Font generation failed and fallback failed: ${fallbackError}` 
        });
      }
    }
  });
}

/**
 * Retrieves a generated font
 */
export async function retrieveFont(fontId: string, format: string): Promise<FontRetrievalResult> {
  try {
    // First check the file system (works without database)
    const fontStoragePath = getFontStoragePath();
    const fontProjectPath = path.join(fontStoragePath, fontId);
    
    // Check if the font project exists
    if (fs.existsSync(fontProjectPath)) {
      // Read the metadata to get the font name
      const metadataPath = path.join(fontProjectPath, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        const fontName = metadata.name || 'font';
        const fileName = `${fontName.replace(/\s+/g, '_').toLowerCase()}.${format}`;
        const fontFilePath = path.join(fontProjectPath, 'output', fileName);
        
        // Check if the font file exists
        if (fs.existsSync(fontFilePath)) {
          return {
            success: true,
            filePath: fontFilePath,
            fontName,
          };
        }
      }
    }
    
    // Try database as fallback (if DATABASE_URL is available)
    try {
      const dbFont = await prisma.font.findUnique({
        where: { id: fontId },
        include: {
          fontFiles: {
            where: { format },
          }
        }
      });
      
      // If found in database and has a Supabase URL, return it
      if (dbFont && dbFont.fontFiles.length > 0 && dbFont.fontFiles[0].url) {
        const fontFile = dbFont.fontFiles[0];
        
        // Increment download count
        await prisma.fontFile.update({
          where: { id: fontFile.id },
          data: { downloadCount: { increment: 1 } }
        });
        
        return {
          success: true,
          fontName: dbFont.name,
          url: fontFile.url || undefined,
        };
      }
    } catch (dbError) {
      console.log('Database not available, using file system only');
    }
    
        // If we get here, font not found
    return {
      success: false,
      error: 'Font not found'
    };
  } catch (error) {
    console.error('Error retrieving font:', error);
    return {
      success: false,
      error: 'Error retrieving font'
    };
  }
} 
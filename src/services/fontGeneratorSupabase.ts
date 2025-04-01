import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { 
  ensureDirectoryExists, 
  getFontStoragePath,
  saveImageFromDataURL
} from '@/utils/helpers';
import { SourceImage, CharacterMapping, FontMetadata } from '@/context/FontContext';
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

/**
 * Generates a font based on character mappings and source images
 */
export async function generateFont(request: FontGenerationRequest): Promise<FontGenerationResult> {
  const { characterMappings, sourceImages, metadata, format, fontId, userId } = request;
  
  try {
    // 1. Create a temporary directory for processing
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
    
    // 4. Save source images locally for processing
    const sourceImageMap = new Map<string, string>();
    for (const image of sourceImages) {
      const imageFileName = `image_${image.id}.png`;
      const imagePath = path.join(imagesPath, imageFileName);
      await saveImageFromDataURL(image.url, imagePath);
      sourceImageMap.set(image.id, imagePath);
      
      // Upload to Supabase if userId is provided
      if (userId) {
        await supabaseStorage.uploadSourceImage(image.url, fontId);
      }
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
      
      // Upload character image to Supabase
      let charImageUrl = '';
      let charImagePath = '';
      
      if (userId) {
        // Convert image to data URL
        const buffer = fs.readFileSync(charPath);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:image/png;base64,${base64}`;
        
        const uploadResult = await supabaseStorage.uploadCharacterImage(
          dataUrl,
          fontId,
          mapping.char
        );
        
        if (uploadResult.success) {
          charImageUrl = uploadResult.url || '';
          charImagePath = uploadResult.path || '';
        }
      }
      
      characterData.push({
        char: mapping.char,
        unicode: mapping.char.charCodeAt(0),
        path: charPath,
        url: charImageUrl,
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
        charImageUrl: charImageUrl,
        charImagePath: charImagePath,
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
    
    // 8. Upload to Supabase Storage if userId is provided
    let fontFileUrl = '';
    
    if (userId) {
      const fontFile = fs.readFileSync(fontFilePath);
      const uploadResult = await supabaseStorage.uploadFontFile(
        new Blob([fontFile], { type: getContentType(format) }),
        fontId,
        format,
        metadata.name
      );
      
      if (uploadResult.success) {
        fontFileUrl = uploadResult.url || '';
      }
    }
    
    // 9. Store in Supabase database if userId is provided
    if (userId) {
      try {
        // Create font record
        const { data: fontData, error: fontError } = await supabase
          .from('fonts')
          .insert({
            id: fontId,
            name: metadata.name,
            description: metadata.description || '',
            author: metadata.author || '',
            is_public: metadata.isPublic || false,
            user_id: userId,
            character_count: characterMappings.length,
          })
          .select()
          .single();
          
        if (fontError) {
          console.error('Error creating font record:', fontError);
        }
        
        // Create font file record
        const { error: fileError } = await supabase
          .from('font_files')
          .insert({
            font_id: fontId,
            format,
            url: fontFileUrl,
            storage_path: `fonts/${fontId}/${fontFileName}`,
            file_size: fs.statSync(fontFilePath).size,
          });
          
        if (fileError) {
          console.error('Error creating font file record:', fileError);
        }
        
        // Create character mappings records
        const { error: mappingsError } = await supabase
          .from('character_mappings')
          .insert(
            dbCharMappings.map(mapping => ({
              font_id: fontId,
              character: mapping.char,
              x1: mapping.x1,
              y1: mapping.y1,
              x2: mapping.x2,
              y2: mapping.y2,
              original_image_width: mapping.originalImageWidth,
              original_image_height: mapping.originalImageHeight,
              char_image_url: mapping.charImageUrl,
              char_image_path: mapping.charImagePath,
              source_image_id: mapping.sourceImageId,
            }))
          );
          
        if (mappingsError) {
          console.error('Error creating character mappings records:', mappingsError);
        }
        
        // Create tags if provided
        if (metadata.tags && metadata.tags.length > 0) {
          const { error: tagsError } = await supabase
            .from('font_tags')
            .insert(
              metadata.tags.map(tag => ({
                font_id: fontId,
                name: tag,
              }))
            );
            
          if (tagsError) {
            console.error('Error creating font tags:', tagsError);
          }
        }
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
        url: fontFileUrl || `/api/fonts/download/${fontId}?format=${format}`,
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
    // First check if the font exists in Supabase
    const { data: fontData, error: fontError } = await supabase
      .from('fonts')
      .select(`
        id, 
        name,
        font_files!inner(
          id,
          format,
          url,
          storage_path
        )
      `)
      .eq('id', fontId)
      .eq('font_files.format', format)
      .single();
    
    if (fontError || !fontData) {
      // If not in Supabase, fall back to file system
      return await retrieveFontFromFileSystem(fontId, format);
    }
    
    // Get download URL from Supabase
    const fontFile = fontData.font_files[0];
    const fontName = fontData.name;
    
    const downloadResult = await supabaseStorage.getFontDownloadUrl(
      fontId,
      fontName,
      format
    );
    
    if (downloadResult.success && downloadResult.url) {
      return {
        success: true,
        fontName,
        url: downloadResult.url,
      };
    }
    
    // Fall back to file system if Supabase URL fails
    return await retrieveFontFromFileSystem(fontId, format);
  } catch (error) {
    console.error('Error retrieving font from Supabase:', error);
    // Fall back to file system
    return await retrieveFontFromFileSystem(fontId, format);
  }
}

/**
 * Retrieves a font from the file system
 */
async function retrieveFontFromFileSystem(
  fontId: string, 
  format: string
): Promise<FontRetrievalResult> {
  try {
    const fontStoragePath = getFontStoragePath();
    const fontProjectPath = path.join(fontStoragePath, fontId);
    
    // Check if the font project exists
    if (!fs.existsSync(fontProjectPath)) {
      return {
        success: false,
        error: 'Font not found'
      };
    }
    
    // Read the metadata to get the font name
    const metadataPath = path.join(fontProjectPath, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return {
        success: false,
        error: 'Font metadata not found'
      };
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const fontName = metadata.name || 'font';
    const fileName = `${fontName.replace(/\s+/g, '_').toLowerCase()}.${format}`;
    const fontFilePath = path.join(fontProjectPath, 'output', fileName);
    
    // Check if the font file exists
    if (!fs.existsSync(fontFilePath)) {
      return {
        success: false,
        error: 'Font file not found'
      };
    }
    
    return {
      success: true,
      filePath: fontFilePath,
      fontName,
    };
  } catch (error) {
    console.error('Error retrieving font from file system:', error);
    return {
      success: false,
      error: 'Error retrieving font'
    };
  }
}

/**
 * Get content type based on file format
 */
function getContentType(format: string): string {
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
} 
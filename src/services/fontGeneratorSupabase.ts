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
import { SourceImage, CharacterMapping, FontMetadata, FontAdjustments } from '@/context/FontContext';
import * as supabaseStorage from '@/services/supabaseStorage';

interface FontGenerationRequest {
  characterMappings: CharacterMapping[];
  sourceImages: SourceImage[];
  metadata: FontMetadata;
  format: string;
  fontId: string;
  userId?: string;
  adjustments?: FontAdjustments;
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
  const { characterMappings, sourceImages, metadata, format, fontId, userId, adjustments } = request;
  
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
    
    // 4. Save font adjustments if provided
    let adjustmentsPath = '';
    if (adjustments) {
      adjustmentsPath = path.join(fontProjectPath, 'adjustments.json');
      fs.writeFileSync(adjustmentsPath, JSON.stringify(adjustments, null, 2));
    }
    
    // 5. Save source images locally for processing
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
    
    // 6. Extract and process character images
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
    
    // 7. Save character mapping data
    const charMapPath = path.join(fontProjectPath, 'charmap.json');
    fs.writeFileSync(charMapPath, JSON.stringify(characterData, null, 2));
    
    // 8. Generate the font file
    const fontFileName = `${metadata.name.replace(/\s+/g, '_').toLowerCase()}.${format}`;
    const fontFilePath = path.join(outputPath, fontFileName);
    
    // Generate the font using FontForge
    const fontResult = await generateFontFile(
      charMapPath,
      path.join(outputPath, metadata.name.replace(/\s+/g, '_').toLowerCase()),
      metadata.name,
      format,
      adjustmentsPath || undefined
    );
    
    if (!fontResult.success) {
      throw new Error(fontResult.error || 'Failed to generate font file');
    }
    
    // 9. Upload to Supabase Storage if userId is provided
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
    
    // 10. Store in Supabase database if userId is provided
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
              character_image_url: mapping.charImageUrl,
              character_image_path: mapping.charImagePath,
              source_image_id: mapping.sourceImageId,
            }))
          );
          
        if (mappingsError) {
          console.error('Error creating character mappings records:', mappingsError);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Don't fail the entire process if database operations fail
      }
    }
    
    return {
      success: true,
      metadata: {
        name: metadata.name,
        format,
        characters: characterMappings.length,
      },
      fontId,
    };
  } catch (error) {
    console.error('Error generating font:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Extract a character from a source image
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
    const width = Math.round(x2 - x1);
    const height = Math.round(y2 - y1);
    
    if (width <= 0 || height <= 0) {
      return {
        success: false,
        error: `Invalid dimensions: ${width}x${height}`,
      };
    }
    
    await sharp(sourcePath)
      .extract({
        left: Math.round(x1),
        top: Math.round(y1),
        width,
        height,
      })
      .toFile(outputPath);
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error extracting character',
    };
  }
}

/**
 * Generate a font file using FontForge
 */
async function generateFontFile(
  charMapPath: string,
  outputPath: string,
  fontName: string,
  format: string,
  adjustmentsPath?: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      const scriptPath = path.resolve('./scripts/generate_font.py');
      
      // Verify the script exists
      if (!fs.existsSync(scriptPath)) {
        return resolve({
          success: false,
          error: `Font generation script not found at ${scriptPath}`,
        });
      }
      
      console.log(`
==== FONT GENERATION REQUEST ====
Script path: ${scriptPath}
Char map: ${charMapPath}
Output path: ${outputPath}
Font name: ${fontName}
Format: ${format}
Adjustments path: ${adjustmentsPath || 'none'}
      `);
      
      // Verify the adjustments file exists if provided
      if (adjustmentsPath && !fs.existsSync(adjustmentsPath)) {
        console.warn(`Warning: Adjustments file not found at ${adjustmentsPath}`);
      }
      
      // Build arguments array
      const args = [
        '-script',
        scriptPath,
        charMapPath,
        outputPath,
        fontName,
        format,
      ];
      
      // Add adjustments path if provided
      if (adjustmentsPath) {
        args.push(adjustmentsPath);
        console.log(`Applying adjustments from: ${adjustmentsPath}`);
        try {
          const adjustmentsData = JSON.parse(fs.readFileSync(adjustmentsPath, 'utf8'));
          console.log('Adjustments data:', JSON.stringify(adjustmentsData, null, 2));
        } catch (e) {
          console.error('Error reading adjustments file:', e);
        }
      }
      
      console.log(`Executing command: fontforge ${args.join(' ')}`);
      
      // Spawn FontForge process
      const fontForgeProcess = spawn('fontforge', args);
      
      let stdout = '';
      let stderr = '';
      
      fontForgeProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`FontForge output: ${output}`);
      });
      
      fontForgeProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error(`FontForge error: ${output}`);
      });
      
      fontForgeProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`FontForge process exited with code ${code}`);
          console.error(`STDOUT: ${stdout}`);
          console.error(`STDERR: ${stderr}`);
          
          return resolve({
            success: false,
            error: `Font generation failed with code ${code}: ${stderr}`,
          });
        }
        
        console.log(`Font generation succeeded: ${stdout}`);
        
        // Verify the output file exists
        const outputFile = `${outputPath}.${format}`;
        if (fs.existsSync(outputFile)) {
          console.log(`Generated font file: ${outputFile} (${fs.statSync(outputFile).size} bytes)`);
          resolve({ success: true });
        } else {
          console.error(`Expected output file not found: ${outputFile}`);
          resolve({
            success: false,
            error: `Font file was not created at ${outputFile}`,
          });
        }
      });
    } catch (error) {
      console.error('Error generating font file:', error);
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating font file',
      });
    }
  });
}

/**
 * Retrieve a font from storage
 */
export async function retrieveFont(fontId: string, format: string): Promise<FontRetrievalResult> {
  try {
    // First try to retrieve from Supabase
    const { data, error } = await supabase
      .from('font_files')
      .select('url, storage_path')
      .eq('font_id', fontId)
      .eq('format', format)
      .single();
    
    if (error) {
      // If not found in Supabase, retrieve from filesystem
      return retrieveFontFromFileSystem(fontId, format);
    }
    
    // If found in Supabase
    return {
      success: true,
      url: data.url,
    };
  } catch (error) {
    console.error('Error retrieving font:', error);
    return {
      success: false,
      error: 'Failed to retrieve font',
    };
  }
}

/**
 * Retrieve a font from the local filesystem
 */
async function retrieveFontFromFileSystem(
  fontId: string, 
  format: string
): Promise<FontRetrievalResult> {
  try {
    const fontStoragePath = getFontStoragePath();
    const fontProjectPath = path.join(fontStoragePath, fontId);
    
    // Read metadata to get font name
    const metadataPath = path.join(fontProjectPath, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return {
        success: false,
        error: 'Font metadata not found',
      };
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const fontName = metadata.name || 'font';
    
    // Look for the font file
    const outputPath = path.join(fontProjectPath, 'output');
    const fontFileName = `${fontName.replace(/\s+/g, '_').toLowerCase()}.${format}`;
    const fontFilePath = path.join(outputPath, fontFileName);
    
    if (!fs.existsSync(fontFilePath)) {
      return {
        success: false,
        error: 'Font file not found',
      };
    }
    
    return {
      success: true,
      filePath: fontFilePath,
      fontName,
    };
  } catch (error) {
    console.error('Error retrieving font from filesystem:', error);
    return {
      success: false,
      error: 'Failed to retrieve font from filesystem',
    };
  }
}

/**
 * Get the appropriate content type for a font format
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
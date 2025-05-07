/**
 * Font Generator Service using OpenType.js
 * This service handles font generation using OpenType.js library
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import opentype from 'opentype.js';
import { promises as fsPromises } from 'fs';

interface CharacterMapping {
  char: string;
  path: string;
}

interface FontGenerationOptions {
  fontName: string;
  format?: 'ttf' | 'otf' | 'woff' | 'woff2';
  outputDir?: string;
}

/**
 * Generate a font file using OpenType.js from a set of character mappings
 */
export async function generateFont(
  characterMappings: CharacterMapping[],
  options: FontGenerationOptions
): Promise<string> {
  const {
    fontName,
    format = 'ttf',
    outputDir = './font-storage'
  } = options;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create a simple notdef glyph
  const notdefPath = new opentype.Path();
  notdefPath.moveTo(0, 0);
  notdefPath.lineTo(0, 500);
  notdefPath.lineTo(500, 500);
  notdefPath.lineTo(500, 0);
  notdefPath.close();

  // Initialize a new font with the notdef glyph
  const font = new opentype.Font({
    familyName: fontName,
    styleName: 'Regular',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs: [
      new opentype.Glyph({
        name: '.notdef',
        unicode: 0,
        advanceWidth: 500,
        path: notdefPath
      })
    ]
  });

  // Process each character mapping
  for (const mapping of characterMappings) {
    try {
      const char = mapping.char;
      const svgPath = mapping.path;
      const unicode = char.codePointAt(0) || 0;

      // Read the SVG file
      const svgContent = await fsPromises.readFile(svgPath, 'utf8');
      
      // Parse SVG to OpenType path
      const path = svgToPath(svgContent);
      
      // Create a glyph
      const glyph = new opentype.Glyph({
        name: `glyph${unicode}`,
        unicode: unicode,
        advanceWidth: 650,
        path: path
      });
      
      // Add the glyph to the font
      font.glyphs.push(glyph);
      
    } catch (error) {
      console.error(`Error processing character ${mapping.char}:`, error);
    }
  }

  // Generate a unique ID for this font
  const fontId = uuidv4();
  
  // Define output file path based on format
  const outputFileName = `font-${fontId}.${format}`;
  const outputFilePath = path.join(outputDir, outputFileName);
  
  // Write the font to file based on format
  try {
    // Get font data as an ArrayBuffer
    const arrayBuffer = font.toArrayBuffer();
    
    // Convert to a Node.js Buffer and write to file
    await fsPromises.writeFile(outputFilePath, Buffer.from(arrayBuffer));
    
    return outputFilePath;
  } catch (error) {
    console.error('Error writing font file:', error);
    throw error;
  }
}

/**
 * Convert SVG content to OpenType.js Path
 */
function svgToPath(svgContent: string): opentype.Path {
  // This is a simplified implementation
  // In a real implementation, you would parse the SVG and convert to OpenType.js Path commands
  // For now, we return a simple square as a placeholder
  const path = new opentype.Path();
  
  // Create a simple square path as a placeholder
  path.moveTo(0, 0);
  path.lineTo(0, 800);
  path.lineTo(800, 800);
  path.lineTo(800, 0);
  path.close();
  
  return path;
}

/**
 * Generate a simple test font with a single character
 */
export async function generateTestFont(
  character: string,
  svgPath: string,
  options: FontGenerationOptions
): Promise<string> {
  const charMapping: CharacterMapping = {
    char: character,
    path: svgPath
  };

  return generateFont([charMapping], options);
} 
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getFontStoragePath } from '@/utils/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { fontId: string } }
) {
  try {
    const fontId = await Promise.resolve(params.fontId);
    console.log(`Direct download requested for font: ${fontId}`);
    
    // Get the font file directly from storage
    const fontStoragePath = getFontStoragePath();
    const fontProjectPath = path.join(fontStoragePath, fontId);
    const outputPath = path.join(fontProjectPath, 'output');
    
    console.log(`Looking for font in: ${outputPath}`);
    
    // If output directory doesn't exist, return error
    if (!fs.existsSync(outputPath)) {
      console.error(`Output directory not found: ${outputPath}`);
      return new Response(JSON.stringify({ error: 'Font not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Try to find any TTF file in the output directory
    const files = fs.readdirSync(outputPath);
    let fontFiles = files.filter(file => file.endsWith('.ttf'));
    
    // If no TTF files found, try to find any font file
    if (fontFiles.length === 0) {
      fontFiles = files.filter(file => 
        file.endsWith('.ttf') || 
        file.endsWith('.otf') || 
        file.endsWith('.woff') || 
        file.endsWith('.woff2')
      );
    }
    
    // If still no font files found, return error
    if (fontFiles.length === 0) {
      console.error(`No font files found in: ${outputPath}`);
      
      // Try the placeholder as a last resort
      const placeholderPath = path.join(process.cwd(), 'public', 'demo-fonts', 'placeholder.ttf');
      
      if (fs.existsSync(placeholderPath)) {
        console.log(`Using placeholder font: ${placeholderPath}`);
        
        // Read the file
        const fontData = fs.readFileSync(placeholderPath);
        const stats = fs.statSync(placeholderPath);
        
        console.log(`Serving placeholder font: ${placeholderPath} (${stats.size} bytes)`);
        
        // Return the font as binary data
        return new Response(fontData, {
          headers: {
            'Content-Type': 'font/ttf',
            'Content-Length': String(stats.size),
            'Content-Disposition': 'attachment; filename="font.ttf"',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
      
      return new Response(JSON.stringify({ error: 'No font files found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Get the first font file (if multiple exist)
    const fontFilePath = path.join(outputPath, fontFiles[0]);
    const stats = fs.statSync(fontFilePath);
    
    console.log(`Found font file: ${fontFilePath} (${stats.size} bytes)`);
    
    // Check if file is empty
    if (stats.size === 0) {
      console.error(`Font file is empty: ${fontFilePath}`);
      return new Response(JSON.stringify({ error: 'Font file is empty' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Read the file
    const fontData = fs.readFileSync(fontFilePath);
    
    console.log(`Serving font file: ${fontFilePath} (${fontData.length} bytes)`);
    
    // Return the font as binary data
    return new Response(fontData, {
      headers: {
        'Content-Type': 'font/ttf',
        'Content-Length': String(fontData.length),
        'Content-Disposition': `attachment; filename="${fontFiles[0]}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error retrieving font:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 
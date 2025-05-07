import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { generateFont } from '@/services/fontGeneratorFontForge';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('Received JSON font generation request');
    
    // Authenticate the user (optional)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Parse the JSON data
    const body = await request.json();
    
    const { characterMappings, sourceImages, metadata, format = 'ttf' } = body;
    
    if (!characterMappings || !sourceImages || !metadata) {
      return NextResponse.json(
        { error: 'Missing required data: characterMappings, sourceImages, or metadata' },
        { status: 400 }
      );
    }
    
    if (Object.keys(characterMappings).length === 0) {
      return NextResponse.json(
        { error: 'No character mappings provided' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID for this font
    const fontId = uuidv4();
    
    // Create output directory
    const storageDir = path.join(process.cwd(), 'font-storage');
    const fontDir = path.join(storageDir, `font_${Date.now()}_${fontId.substring(0, 8)}`);
    const charsDir = path.join(fontDir, 'chars');
    const imagesDir = path.join(fontDir, 'images');
    const outputDir = path.join(fontDir, 'output');
    
    await fs.mkdir(fontDir, { recursive: true });
    await fs.mkdir(charsDir, { recursive: true });
    await fs.mkdir(imagesDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    
    // Process character mappings and save images
    const fontMappings = [];
    for (const char in characterMappings) {
      // Extract character image from source
      const mappingData = characterMappings[char];
      const sourceImageId = mappingData.sourceImageId || Object.keys(sourceImages)[0];
      const sourceImageUrl = sourceImages[sourceImageId];
      
      // Here we would extract and save the character image
      // For simplicity, we'll use a placeholder SVG for now
      const svgPath = path.join(charsDir, `char_${char.charCodeAt(0)}.svg`);
      
      // Create a simple rectangle SVG as a placeholder
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect x="10" y="10" width="80" height="80" fill="black" />
      </svg>`;
      
      await fs.writeFile(svgPath, svgContent);
      
      fontMappings.push({
        char,
        path: svgPath
      });
    }
    
    // Save metadata
    await fs.writeFile(
      path.join(fontDir, 'metadata.json'), 
      JSON.stringify(metadata, null, 2)
    );
    
    // Save character mappings
    await fs.writeFile(
      path.join(fontDir, 'charmap.json'),
      JSON.stringify(characterMappings, null, 2)
    );
    
    // Generate the font
    const fontPath = await generateFont(fontMappings, {
      fontName: metadata.name || 'CustomFont',
      format: format as 'ttf' | 'otf' | 'woff' | 'woff2',
      outputDir
    });
    
    // Get the filename
    const fontFilename = path.basename(fontPath);
    
    return NextResponse.json({
      success: true,
      fontId,
      downloadUrl: `/api/fonts/download/${fontId}?format=${format}`,
      metadata
    });
    
  } catch (error) {
    console.error('Error in font generation API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 
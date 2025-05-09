import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { generateFont } from '@/services/fontGenerator';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CharacterMapping, SourceImage } from '@/context/FontContext';

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
    
    // Convert character mappings to the expected format
    const formattedMappings: CharacterMapping[] = Object.entries(characterMappings).map(([char, data]: [string, any]) => ({
      id: uuidv4(),
      char,
      sourceImageId: data.sourceImageId || Object.keys(sourceImages)[0],
      x1: data.x1 || 0,
      y1: data.y1 || 0,
      x2: data.x2 || 100,
      y2: data.y2 || 100,
      originalImageWidth: data.originalImageWidth || 100,
      originalImageHeight: data.originalImageHeight || 100
    }));

    // Convert source images to the expected format
    const formattedSourceImages: SourceImage[] = Object.entries(sourceImages).map(([id, url]: [string, any]) => ({
      id,
      url,
      isAiGenerated: false
    }));

    // Generate the font
    const result = await generateFont({
      characterMappings: formattedMappings,
      sourceImages: formattedSourceImages,
      metadata,
      format,
      fontId,
      userId
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate font' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      fontId: result.fontId,
      downloadUrl: `/api/fonts/download/${result.fontId}?format=${format}`,
      metadata: result.metadata
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
import { NextRequest, NextResponse } from 'next/server';
import { generateFont } from '@/services/fontGeneratorSupabase';
import { generateFontId } from '@/utils/helpers';

export async function POST(request: NextRequest) {
  try {
    // No authentication for v4 version - completely removed NextAuth
    const userId = undefined;
    
    const body = await request.json();
    const { characterMappings, sourceImages, metadata, format = 'ttf', adjustments } = body;
    
    if (!characterMappings || !sourceImages || !metadata) {
      return NextResponse.json(
        { error: 'Missing required data: characterMappings, sourceImages, or metadata' },
        { status: 400 }
      );
    }
    
    if (characterMappings.length === 0) {
      return NextResponse.json(
        { error: 'No character mappings provided' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID for this font
    const fontId = generateFontId();
    
    // Process the adjustments if they exist
    const fontAdjustments = adjustments ? {
      letterSpacing: adjustments.letterSpacing ?? 0,
      baselineOffset: adjustments.baselineOffset ?? 0, 
      charWidth: adjustments.charWidth ?? 100,
      kerningPairs: adjustments.kerningPairs ?? {},
      charPositions: adjustments.charPositions ?? {},
    } : undefined;
    
    // Process the images and generate the font
    const result = await generateFont({
      characterMappings,
      sourceImages,
      metadata,
      format,
      fontId,
      userId, // This will be undefined for non-authenticated users
      adjustments: fontAdjustments,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Font generation failed' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      fontId,
      downloadUrl: `/api/fonts/download-supabase/${fontId}?format=${format}`,
      metadata: result.metadata,
      isAuthenticated: false, // Always false for v4
    });
  } catch (error) {
    console.error('Error generating font:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
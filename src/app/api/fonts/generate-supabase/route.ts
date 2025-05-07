import { NextRequest, NextResponse } from 'next/server';
import { generateFont } from '@/services/fontGeneratorSupabase';
import { generateFontId } from '@/utils/helpers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Authentication is now optional
    // if (!userId) {
    //   return NextResponse.json(
    //     { error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }
    
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
      isAuthenticated: !!userId, // Return auth state to the client
    });
  } catch (error) {
    console.error('Error generating font:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
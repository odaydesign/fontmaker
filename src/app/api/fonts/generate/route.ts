import { NextRequest, NextResponse } from 'next/server';
import { generateFont } from '@/services/fontGenerator';
import { generateFontId } from '@/utils/helpers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user (optional but recommended)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const body = await request.json();
    const { characterMappings, sourceImages, metadata, format = 'ttf' } = body;
    
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
    
    // Process the images and generate the font
    const result = await generateFont({
      characterMappings,
      sourceImages,
      metadata,
      format,
      fontId,
      userId: userId || undefined,
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
      downloadUrl: `/api/fonts/download/${fontId}?format=${format}`,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('Error generating font:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
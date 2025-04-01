import { NextRequest, NextResponse } from 'next/server';
import { generateFont } from '@/services/fontGeneratorSupabase';
import { generateFontId } from '@/utils/helpers';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    let userId: string | undefined = undefined;
    
    // Check for authenticated user with Supabase
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user) {
      userId = sessionData.session.user.id;
    }

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
    const fontId = generateFontId();
    
    // Process the images and generate the font
    const result = await generateFont({
      characterMappings,
      sourceImages,
      metadata,
      format,
      fontId,
      userId,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Font generation failed' },
        { status: 500 }
      );
    }
    
    // Return success response with download URL
    return NextResponse.json({
      success: true,
      fontId,
      downloadUrl: `/api/fonts/download-supabase/${fontId}?format=${format}`,
      metadata: result.metadata,
      isAuthenticated: !!userId,
    });
  } catch (error) {
    console.error('Error generating font:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { retrieveFont } from '@/services/fontGeneratorSupabase';
import fs from 'fs';
import * as supabaseStorage from '@/services/supabaseStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: { fontId: string } }
) {
  try {
    const fontId = params.fontId;
    const format = request.nextUrl.searchParams.get('format') || 'ttf';
    
    // Get the font file path or URL
    const result = await retrieveFont(fontId, format);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Font not found' },
        { status: 404 }
      );
    }
    
    // If URL is provided (from Supabase), redirect to it
    if (result.url) {
      return NextResponse.redirect(result.url);
    }
    
    // Otherwise, serve the file from the file system (fallback)
    const filePath = result.filePath;
    
    // Check if the file exists
    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Font file not found' },
        { status: 404 }
      );
    }
    
    // Read the file
    const fontData = fs.readFileSync(filePath);
    
    // Create the appropriate content type
    const contentType = getContentType(format);
    
    // Set header to force download
    const fileName = `${result.fontName || 'font'}.${format}`;
    
    // Return the font file
    return new NextResponse(fontData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error retrieving font:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get content type based on file format
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
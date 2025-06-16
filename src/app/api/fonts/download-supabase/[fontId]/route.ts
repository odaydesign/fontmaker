import { NextRequest, NextResponse } from 'next/server';
import { retrieveFont } from '@/services/fontGenerator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fontId: string }> }
) {
  try {
    const { fontId } = await params;
    const format = request.nextUrl.searchParams.get('format') || 'ttf';
    
    // Get the font file path or URL
    const result = await retrieveFont(fontId, format);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Font not found' },
        { status: 404 }
      );
    }
    
    // If we have a URL, redirect to it
    if (result.url) {
      return NextResponse.redirect(result.url);
    }
    
    // Otherwise, serve the file
    if (result.filePath) {
      const fs = require('fs');
      
      if (fs.existsSync(result.filePath)) {
        const buffer = fs.readFileSync(result.filePath);
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': getContentType(format),
            'Content-Disposition': `attachment; filename="${result.fontName || 'font'}.${format}"`,
          },
        });
      }
    }
    
    return NextResponse.json(
      { error: 'Font file not found' },
      { status: 404 }
    );
    
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
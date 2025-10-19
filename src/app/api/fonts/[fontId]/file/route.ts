import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { fontId: string } }
) {
  try {
    const { fontId } = params;

    // Fetch font metadata
    const font = await prisma.font.findUnique({
      where: { id: fontId },
      select: {
        id: true,
        fontFamily: true,
        filePath: true,
        isPublic: true,
      },
    });

    if (!font) {
      return NextResponse.json(
        { error: 'Font not found' },
        { status: 404 }
      );
    }

    // Check if font is public or if user owns it
    // For now, we'll allow download if it's public
    // TODO: Add ownership check for private fonts
    if (!font.isPublic) {
      return NextResponse.json(
        { error: 'This font is private' },
        { status: 403 }
      );
    }

    // Check if file exists
    const filePath = font.filePath || path.join(process.cwd(), 'fonts', `${font.fontFamily}.ttf`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Font file not found' },
        { status: 404 }
      );
    }

    // Read the font file
    const fileBuffer = fs.readFileSync(filePath);

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'font/ttf',
        'Content-Disposition': `attachment; filename="${font.fontFamily}.ttf"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Font file API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch font file',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

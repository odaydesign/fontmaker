import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { fontId: string } }
) {
  try {
    const { fontId } = params;

    // Check if font exists
    const font = await prisma.font.findUnique({
      where: { id: fontId },
    });

    if (!font) {
      return NextResponse.json(
        { error: 'Font not found' },
        { status: 404 }
      );
    }

    // Increment download count
    await prisma.font.update({
      where: { id: fontId },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      downloads: font.downloads + 1,
    });
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to record download',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

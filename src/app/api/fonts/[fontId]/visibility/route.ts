import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { fontId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { fontId } = params;
    const body = await request.json();
    const { isPublic } = body;

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid isPublic value' },
        { status: 400 }
      );
    }

    // Check if font exists and belongs to user
    const font = await prisma.font.findUnique({
      where: { id: fontId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!font) {
      return NextResponse.json(
        { error: 'Font not found' },
        { status: 404 }
      );
    }

    if (font.userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this font' },
        { status: 403 }
      );
    }

    // Update font visibility
    const updatedFont = await prisma.font.update({
      where: { id: fontId },
      data: { isPublic },
      select: {
        id: true,
        isPublic: true,
      },
    });

    return NextResponse.json({
      success: true,
      isPublic: updatedFont.isPublic,
    });
  } catch (error) {
    console.error('Visibility API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update font visibility',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

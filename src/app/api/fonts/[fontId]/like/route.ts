import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
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

    // Check if user already liked this font
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_fontId: {
          userId,
          fontId,
        },
      },
    });

    let liked = false;

    if (existingLike) {
      // Unlike: delete the like
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      liked = false;
    } else {
      // Like: create a new like
      await prisma.like.create({
        data: {
          userId,
          fontId,
        },
      });
      liked = true;
    }

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { fontId },
    });

    return NextResponse.json({
      liked,
      likeCount,
    });
  } catch (error) {
    console.error('Like API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process like',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

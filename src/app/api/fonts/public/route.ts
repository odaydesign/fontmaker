import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'recent';
    const search = searchParams.get('search') || '';

    // Get current user ID if authenticated (to check if they liked fonts)
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      isPublic: true,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fontFamily: { contains: search, mode: 'insensitive' } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Build orderBy clause
    let orderBy: any;
    switch (sortBy) {
      case 'popular':
        orderBy = { likes: { _count: 'desc' } };
        break;
      case 'downloads':
        orderBy = { downloads: 'desc' };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Fetch fonts with pagination
    const [fonts, totalCount] = await Promise.all([
      prisma.font.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          fontFamily: true,
          isPublic: true,
          downloads: true,
          createdAt: true,
          user: {
            select: {
              username: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
          likes: currentUserId
            ? {
                where: {
                  userId: currentUserId,
                },
                select: {
                  id: true,
                },
              }
            : false,
        },
      }),
      prisma.font.count({
        where: whereClause,
      }),
    ]);

    // Add isLiked property
    const fontsWithLikeStatus = fonts.map((font) => ({
      ...font,
      isLiked: currentUserId ? (font.likes as any[]).length > 0 : false,
      likes: undefined, // Remove the likes array from response
    }));

    const hasMore = skip + fonts.length < totalCount;

    return NextResponse.json({
      fonts: fontsWithLikeStatus,
      hasMore,
      total: totalCount,
      page,
      limit,
    });
  } catch (error) {
    console.error('Public fonts API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch public fonts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

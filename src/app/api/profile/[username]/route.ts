import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    // Get current user session
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const isOwnProfile = session?.user?.username === username;

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: isOwnProfile, // Only show email to profile owner
        createdAt: true,
        subscriptionTier: true,
        profile: {
          select: {
            bio: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user's fonts
    const fonts = await prisma.font.findMany({
      where: {
        userId: user.id,
        // If not own profile, only show public fonts
        ...(isOwnProfile ? {} : { isPublic: true }),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        fontFamily: true,
        isPublic: true,
        downloads: true,
        createdAt: true,
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
    });

    // Add isLiked property
    const fontsWithLikeStatus = fonts.map((font) => ({
      ...font,
      isLiked: currentUserId ? (font.likes as any[]).length > 0 : false,
      likes: undefined,
    }));

    // Calculate stats
    const totalDownloads = fonts.reduce((sum, font) => sum + font.downloads, 0);
    const totalLikes = await prisma.like.count({
      where: {
        font: {
          userId: user.id,
        },
      },
    });

    const publicFontsCount = fonts.filter((f) => f.isPublic).length;

    // Build response
    const profileData = {
      username: user.username,
      email: isOwnProfile ? user.email : undefined,
      bio: user.profile?.bio || null,
      avatarUrl: user.profile?.avatarUrl || null,
      createdAt: user.createdAt.toISOString(),
      subscriptionTier: user.subscriptionTier,
      stats: {
        totalFonts: fonts.length,
        publicFonts: publicFontsCount,
        totalDownloads,
        totalLikes,
      },
      fonts: fontsWithLikeStatus,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    // Fetch user data with counts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        subscriptionTier: true,
        tokensRemaining: true,
        _count: {
          select: {
            fonts: true,
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

    // Fetch total downloads (sum of all font downloads)
    const totalDownloadsResult = await prisma.font.aggregate({
      where: { userId },
      _sum: {
        downloads: true,
      },
    });

    // Fetch total likes
    const totalLikesResult = await prisma.like.count({
      where: {
        font: {
          userId,
        },
      },
    });

    // Fetch recent token transaction history (last 20)
    const tokenHistory = await prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        createdAt: true,
      },
    });

    // Fetch active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: {
        planType: true,
        status: true,
        currentPeriodEnd: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Prepare response data
    const dashboardData = {
      user: {
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        tokensRemaining: user.tokensRemaining,
      },
      stats: {
        fontsCreated: user._count.fonts,
        totalDownloads: totalDownloadsResult._sum.downloads || 0,
        totalLikes: totalLikesResult,
      },
      tokenHistory: tokenHistory.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description || '',
        createdAt: transaction.createdAt.toISOString(),
      })),
      subscription: subscription
        ? {
            planType: subscription.planType,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
          }
        : null,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

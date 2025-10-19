import { PrismaClient, TokenTransactionType } from '@prisma/client';

const prisma = new PrismaClient();

// Token costs for different operations
export const TOKEN_COSTS = {
  AI_IMAGE_GENERATION: 10,
  FONT_GENERATION: 5,
} as const;

// Subscription tier monthly token allowances
export const SUBSCRIPTION_TOKENS = {
  FREE: 20,
  PRO: 500,
  BUSINESS: 2000,
} as const;

// Initial signup bonus
export const SIGNUP_BONUS_TOKENS = 50;

export class TokenService {
  /**
   * Get user's current token balance
   */
  static async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokensRemaining: true },
    });

    return user?.tokensRemaining ?? 0;
  }

  /**
   * Check if user has enough tokens for an operation
   */
  static async canAfford(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * Deduct tokens from user's balance
   */
  static async deductTokens(
    userId: string,
    amount: number,
    type: TokenTransactionType,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
      // Check if user has enough tokens
      const canAfford = await this.canAfford(userId, amount);
      if (!canAfford) {
        return {
          success: false,
          newBalance: await this.getBalance(userId),
          error: 'Insufficient tokens',
        };
      }

      // Use a transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Deduct tokens from user
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            tokensRemaining: {
              decrement: amount,
            },
          },
          select: { tokensRemaining: true },
        });

        // Record the transaction
        await tx.tokenTransaction.create({
          data: {
            userId,
            amount: -amount, // Negative for deductions
            type,
            description: description || `Used ${amount} tokens for ${type}`,
            metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
          },
        });

        return updatedUser.tokensRemaining;
      });

      return {
        success: true,
        newBalance: result,
      };
    } catch (error) {
      console.error('Error deducting tokens:', error);
      return {
        success: false,
        newBalance: await this.getBalance(userId),
        error: 'Failed to deduct tokens',
      };
    }
  }

  /**
   * Add tokens to user's balance
   */
  static async addTokens(
    userId: string,
    amount: number,
    type: TokenTransactionType,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Add tokens to user
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            tokensRemaining: {
              increment: amount,
            },
          },
          select: { tokensRemaining: true },
        });

        // Record the transaction
        await tx.tokenTransaction.create({
          data: {
            userId,
            amount, // Positive for additions
            type,
            description: description || `Added ${amount} tokens - ${type}`,
            metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
          },
        });

        return updatedUser.tokensRemaining;
      });

      return {
        success: true,
        newBalance: result,
      };
    } catch (error) {
      console.error('Error adding tokens:', error);
      return {
        success: false,
        newBalance: await this.getBalance(userId),
        error: 'Failed to add tokens',
      };
    }
  }

  /**
   * Grant signup bonus tokens to new user
   */
  static async grantSignupBonus(userId: string): Promise<void> {
    await this.addTokens(
      userId,
      SIGNUP_BONUS_TOKENS,
      'SIGNUP_BONUS',
      `Welcome bonus: ${SIGNUP_BONUS_TOKENS} tokens`
    );
  }

  /**
   * Grant monthly subscription tokens
   */
  static async grantSubscriptionTokens(
    userId: string,
    tier: 'FREE' | 'PRO' | 'BUSINESS'
  ): Promise<void> {
    const amount = SUBSCRIPTION_TOKENS[tier];
    await this.addTokens(
      userId,
      amount,
      'SUBSCRIPTION_GRANT',
      `Monthly ${tier} subscription grant: ${amount} tokens`
    );
  }

  /**
   * Get user's token transaction history
   */
  static async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    return await prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get token usage statistics for a user
   */
  static async getUsageStats(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await prisma.tokenTransaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        type: true,
        createdAt: true,
      },
    });

    const stats = {
      totalSpent: 0,
      totalEarned: 0,
      byType: {} as Record<string, number>,
    };

    transactions.forEach((tx) => {
      if (tx.amount < 0) {
        stats.totalSpent += Math.abs(tx.amount);
      } else {
        stats.totalEarned += tx.amount;
      }

      stats.byType[tx.type] = (stats.byType[tx.type] || 0) + Math.abs(tx.amount);
    });

    return stats;
  }

  /**
   * Check if user needs to be warned about low tokens
   */
  static async shouldWarnLowTokens(userId: string): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance < 10 && balance > 0;
  }
}

export default TokenService;

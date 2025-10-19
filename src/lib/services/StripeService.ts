import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import TokenService from './TokenService';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Product and pricing configuration
export const STRIPE_PLANS = {
  PRO: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    amount: 1900, // $19.00
    tokens: 500,
  },
  BUSINESS: {
    name: 'Business',
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || '',
    amount: 4900, // $49.00
    tokens: 2000,
  },
} as const;

export const TOKEN_PACKS = {
  SMALL: {
    name: '100 Tokens',
    priceId: process.env.STRIPE_TOKENS_100_PRICE_ID || '',
    amount: 999, // $9.99
    tokens: 100,
  },
  MEDIUM: {
    name: '500 Tokens',
    priceId: process.env.STRIPE_TOKENS_500_PRICE_ID || '',
    amount: 3999, // $39.99
    tokens: 500,
  },
  LARGE: {
    name: '1000 Tokens',
    priceId: process.env.STRIPE_TOKENS_1000_PRICE_ID || '',
    amount: 6999, // $69.99
    tokens: 1000,
  },
} as const;

export class StripeService {
  /**
   * Create or retrieve a Stripe customer for a user
   */
  static async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    // Check if user already has a Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, username: true },
    });

    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
        username: user?.username || '',
      },
    });

    // Save customer ID to database
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Create a checkout session for subscription
   */
  static async createSubscriptionCheckout(
    userId: string,
    email: string,
    plan: 'PRO' | 'BUSINESS',
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const customerId = await this.getOrCreateCustomer(userId, email);
    const planConfig = STRIPE_PLANS[plan];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        plan,
        type: 'subscription',
      },
    });

    return session.url || '';
  }

  /**
   * Create a checkout session for token purchase
   */
  static async createTokenCheckout(
    userId: string,
    email: string,
    pack: 'SMALL' | 'MEDIUM' | 'LARGE',
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const customerId = await this.getOrCreateCustomer(userId, email);
    const packConfig = TOKEN_PACKS[pack];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: packConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        pack,
        tokens: packConfig.tokens.toString(),
        type: 'token_purchase',
      },
    });

    return session.url || '';
  }

  /**
   * Handle successful subscription payment
   */
  static async handleSubscriptionSuccess(
    subscriptionId: string,
    customerId: string
  ): Promise<void> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Find user by customer ID
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Determine subscription tier from price ID
    let tier: 'PRO' | 'BUSINESS' = 'PRO';
    const priceId = subscription.items.data[0]?.price.id;

    if (priceId === STRIPE_PLANS.BUSINESS.priceId) {
      tier = 'BUSINESS';
    }

    // Update or create subscription record
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscriptionId },
      create: {
        userId: user.id,
        stripeSubscriptionId: subscriptionId,
        planType: tier,
        status: 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      update: {
        status: 'ACTIVE',
        planType: tier,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    // Update user subscription tier
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionTier: tier },
    });

    // Grant monthly subscription tokens
    await TokenService.grantSubscriptionTokens(user.id, tier);
  }

  /**
   * Handle successful token purchase
   */
  static async handleTokenPurchase(
    sessionId: string,
    metadata: Record<string, string>
  ): Promise<void> {
    const { userId, tokens } = metadata;
    const tokenAmount = parseInt(tokens, 10);

    if (!userId || !tokenAmount) {
      console.error('Missing userId or tokens in metadata:', metadata);
      return;
    }

    // Add purchased tokens to user's balance
    await TokenService.addTokens(
      userId,
      tokenAmount,
      'PURCHASE',
      `Purchased ${tokenAmount} tokens`,
      { sessionId }
    );
  }

  /**
   * Handle subscription cancellation
   */
  static async handleSubscriptionCanceled(subscriptionId: string): Promise<void> {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
      },
    });

    // Optionally downgrade user to FREE tier
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      select: { userId: true },
    });

    if (subscription) {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: { subscriptionTier: 'FREE' },
      });
    }
  }

  /**
   * Create a customer portal session for managing subscriptions
   */
  static async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<string> {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Get subscription details for a user
   */
  static async getSubscriptionDetails(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription?.stripeSubscriptionId) {
      return null;
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    return {
      ...subscription,
      stripeData: stripeSubscription,
    };
  }
}

export default StripeService;

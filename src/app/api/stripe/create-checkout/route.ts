import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import StripeService from '@/lib/services/StripeService';
import { z } from 'zod';

const checkoutSchema = z.object({
  type: z.enum(['subscription', 'tokens']),
  plan: z.enum(['PRO', 'BUSINESS']).optional(),
  pack: z.enum(['SMALL', 'MEDIUM', 'LARGE']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = checkoutSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { type, plan, pack } = validationResult.data;

    // Get base URL for redirects
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002';
    const successUrl = `${baseUrl}/dashboard?success=true`;
    const cancelUrl = `${baseUrl}/dashboard?canceled=true`;

    let checkoutUrl: string;

    if (type === 'subscription') {
      if (!plan) {
        return NextResponse.json(
          { error: 'Plan is required for subscription checkout' },
          { status: 400 }
        );
      }

      checkoutUrl = await StripeService.createSubscriptionCheckout(
        session.user.id,
        session.user.email!,
        plan,
        successUrl,
        cancelUrl
      );
    } else {
      if (!pack) {
        return NextResponse.json(
          { error: 'Pack is required for token checkout' },
          { status: 400 }
        );
      }

      checkoutUrl = await StripeService.createTokenCheckout(
        session.user.id,
        session.user.email!,
        pack,
        successUrl,
        cancelUrl
      );
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

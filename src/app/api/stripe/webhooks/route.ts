import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import StripeService from '@/lib/services/StripeService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      // Subscription events
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await StripeService.handleSubscriptionSuccess(
          subscription.id,
          subscription.customer as string
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await StripeService.handleSubscriptionCanceled(subscription.id);
        break;
      }

      // Checkout session completed (for both subscriptions and one-time payments)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'payment' && session.metadata?.type === 'token_purchase') {
          // Handle token purchase
          await StripeService.handleTokenPurchase(
            session.id,
            session.metadata as Record<string, string>
          );
        } else if (session.mode === 'subscription') {
          // Subscription will be handled by subscription.created event
          console.log('Subscription checkout completed, waiting for subscription event');
        }
        break;
      }

      // Invoice payment succeeded (recurring subscription payments)
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          // Grant monthly tokens for recurring subscription
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          await StripeService.handleSubscriptionSuccess(
            subscription.id,
            subscription.customer as string
          );
        }
        break;
      }

      // Invoice payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.error('Payment failed for invoice:', invoice.id);

        // TODO: Send email notification to user about failed payment
        // TODO: Update subscription status to PAST_DUE
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      {
        error: 'Webhook handler failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhooks (we need the raw body for signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
};

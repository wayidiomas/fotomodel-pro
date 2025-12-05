/**
 * POST /api/stripe/create-checkout
 *
 * Cria uma Stripe Checkout Session para assinatura de plano
 *
 * Body:
 * - planId: UUID do plano na tabela subscription_plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Missing planId' },
        { status: 400 }
      );
    }

    // Fetch plan from database
    const { data: plan, error: planError } = await (supabase
      .from('subscription_plans') as any)
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planId, planError);
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Free plan doesn't need checkout
    if (plan.slug === 'free') {
      return NextResponse.json(
        { error: 'Free plan does not require checkout' },
        { status: 400 }
      );
    }

    // Validate Stripe IDs
    if (!plan.stripe_price_id) {
      console.error('Plan missing Stripe price ID:', plan.slug);
      return NextResponse.json(
        { error: 'Plan not configured for payments' },
        { status: 400 }
      );
    }

    // Get user data for customer creation
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('stripe_customer_id, phone, name')
      .eq('id', user.id)
      .single();

    let customerId = userData?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
        phone: userData?.phone || undefined,
        name: userData?.name || undefined,
      });

      customerId = customer.id;

      // Save customer ID to database
      await (supabase
        .from('users') as any)
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      console.log(`✅ Created Stripe customer: ${customerId} for user ${user.id}`);
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
        plan_slug: plan.slug,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: plan.id,
          plan_slug: plan.slug,
        },
      },
      // Allow promo codes
      allow_promotion_codes: true,
      // Billing address collection
      billing_address_collection: 'required',
    });

    console.log(`✅ Created checkout session: ${session.id} for plan ${plan.slug}`);

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

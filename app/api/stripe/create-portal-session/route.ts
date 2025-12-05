/**
 * POST /api/stripe/create-portal-session
 *
 * Cria uma sessão do Stripe Customer Portal para o usuário gerenciar suas cobranças
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Detecta o ambiente da Stripe (test ou live)
const stripeEnvironment = process.env.STRIPE_ENVIRONMENT || 'test';

const secretKey = stripeEnvironment === 'live'
  ? process.env.STRIPE_SECRET_KEY_LIVE
  : process.env.STRIPE_SECRET_KEY_TEST;

const portalConfigurationId = stripeEnvironment === 'live'
  ? process.env.STRIPE_PORTAL_CONFIGURATION_LIVE
  : process.env.STRIPE_PORTAL_CONFIGURATION_TEST;

if (!secretKey) {
  throw new Error(
    `Missing Stripe secret key for environment: ${stripeEnvironment}. ` +
    `Please set STRIPE_SECRET_KEY_${stripeEnvironment.toUpperCase()} in your .env file.`
  );
}

const stripe = new Stripe(secretKey, {
  apiVersion: '2025-11-17.clover',
});

export async function POST() {
  try {
    console.log('[Portal] Starting portal session creation...');
    const supabase = await createClient();

    // Get authenticated user
    console.log('[Portal] Getting authenticated user...');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('[Portal] No user found - Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Portal] User authenticated:', user.id);

    // Get user's Stripe customer ID
    console.log('[Portal] Fetching Stripe customer ID...');
    const { data: userData, error: userError } = await (supabase
      .from('users') as any)
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      console.log('[Portal] No Stripe customer found');
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    console.log('[Portal] Stripe customer ID:', userData.stripe_customer_id);

    // Create Stripe billing portal session
    // Uses the default configuration from Stripe Dashboard (bpc_1SaoVqE68AxF5WdDT5ujrnlD)
    // This allows you to manage products directly in the Dashboard
    console.log('[Portal] Creating Stripe portal session...');
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    console.log('[Portal] Portal session created:', session.id);
    console.log('[Portal] Portal URL:', session.url);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

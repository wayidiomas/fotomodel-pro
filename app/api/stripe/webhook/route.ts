/**
 * POST /api/stripe/webhook
 *
 * Processa eventos do Stripe via webhooks
 *
 * Eventos tratados:
 * - checkout.session.completed: Quando checkout é finalizado
 * - customer.subscription.created: Nova assinatura criada
 * - customer.subscription.updated: Assinatura atualizada
 * - customer.subscription.deleted: Assinatura cancelada
 * - invoice.payment_succeeded: Pagamento bem-sucedido (recarga de créditos)
 * - invoice.payment_failed: Falha no pagamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { stripe, stripeEnv } from '@/lib/stripe/client';
import Stripe from 'stripe';

// Type helpers for Stripe API compatibility
// The Stripe API returns these fields but TypeScript types may not include them
interface SubscriptionWithPeriod extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

interface InvoiceWithSubscription extends Stripe.Invoice {
  subscription: string | Stripe.Subscription | null;
}

// Configuração do webhook secret baseada no ambiente
const webhookSecretRaw = stripeEnv === 'live'
  ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
  : process.env.STRIPE_WEBHOOK_SECRET_TEST;

if (!webhookSecretRaw) {
  throw new Error(
    `Missing Stripe webhook secret for environment: ${stripeEnv}. ` +
    `Please set STRIPE_WEBHOOK_SECRET_${stripeEnv.toUpperCase()} in your .env file.`
  );
}

const webhookSecret: string = webhookSecretRaw;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verificar assinatura do webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`📥 Received Stripe event: ${event.type}`);

    // Processar evento
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as SubscriptionWithPeriod);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as SubscriptionWithPeriod);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as SubscriptionWithPeriod);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as InvoiceWithSubscription);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as InvoiceWithSubscription);
        break;

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Checkout Session Completed
 * Chamado quando o usuário completa o checkout
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`✅ Checkout completed: ${session.id}`);

  const supabase = await createClient();
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId) {
    console.error('❌ No customer ID in checkout session');
    return;
  }

  // Atualizar stripe_customer_id do usuário
  // O user_id deve estar nos metadata da session
  const userId = session.metadata?.user_id;

  if (userId) {
    const { error } = await (supabase
      .from('users') as any)
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error updating user with customer ID:', error);
    } else {
      console.log(`✅ Updated user ${userId} with Stripe customer ${customerId}`);
    }
  }
}

/**
 * Subscription Created
 * Chamado quando uma nova assinatura é criada
 */
async function handleSubscriptionCreated(subscription: SubscriptionWithPeriod) {
  console.log(`✅ Subscription created: ${subscription.id}`);

  const supabase = await createClient();
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  // Buscar usuário pelo stripe_customer_id
  const { data: userData, error: userError } = await (supabase
    .from('users') as any)
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !userData) {
    console.error('❌ User not found for customer:', customerId, userError);
    return;
  }

  const userId = userData.id;

  // Buscar plano pelo stripe_price_id
  const { data: planData, error: planError } = await (supabase
    .from('subscription_plans') as any)
    .select('*')
    .eq('stripe_price_id', priceId)
    .single();

  if (planError || !planData) {
    console.error('❌ Plan not found for price:', priceId, planError);
    return;
  }

  // Criar registro na user_subscriptions
  const { error: subError } = await (supabase
    .from('user_subscriptions') as any)
    .insert({
      user_id: userId,
      plan_id: planData.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      credits_recharged_this_period: planData.monthly_credits,
      extra_credits_used_this_period: 0,
    });

  if (subError) {
    console.error('❌ Error creating subscription record:', subError);
    return;
  }

  // Atualizar tabela users
  const { error: updateError } = await (supabase
    .from('users') as any)
    .update({
      current_plan_id: planData.id,
      subscription_status: subscription.status,
      subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      billing_cycle_anchor: new Date(subscription.current_period_start * 1000).toISOString(),
      stripe_subscription_id: subscription.id,
      credits: (supabase as any).rpc('increment_credits', {
        increment_amount: planData.monthly_credits
      }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    console.error('❌ Error updating user subscription:', updateError);
  } else {
    console.log(`✅ Created subscription for user ${userId}, plan ${planData.slug}`);
  }
}

/**
 * Subscription Updated
 * Chamado quando uma assinatura é atualizada
 */
async function handleSubscriptionUpdated(subscription: SubscriptionWithPeriod) {
  console.log(`✅ Subscription updated: ${subscription.id}`);

  const supabase = await createClient();

  // Buscar registro de assinatura
  const { data: subData, error: subError } = await (supabase
    .from('user_subscriptions') as any)
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (subError || !subData) {
    console.error('❌ Subscription record not found:', subscription.id, subError);
    return;
  }

  const userId = subData.user_id;

  // Atualizar registro de assinatura
  const { error: updateSubError } = await (supabase
    .from('user_subscriptions') as any)
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subData.id);

  if (updateSubError) {
    console.error('❌ Error updating subscription record:', updateSubError);
  }

  // Atualizar usuário
  const { error: updateUserError } = await (supabase
    .from('users') as any)
    .update({
      subscription_status: subscription.status,
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateUserError) {
    console.error('❌ Error updating user subscription status:', updateUserError);
  } else {
    console.log(`✅ Updated subscription for user ${userId}, status: ${subscription.status}`);
  }
}

/**
 * Subscription Deleted (Cancelled)
 * Chamado quando uma assinatura é cancelada
 */
async function handleSubscriptionDeleted(subscription: SubscriptionWithPeriod) {
  console.log(`✅ Subscription deleted: ${subscription.id}`);

  const supabase = await createClient();

  // Buscar registro de assinatura
  const { data: subData, error: subError } = await (supabase
    .from('user_subscriptions') as any)
    .select('user_id, plan_id')
    .eq('stripe_subscription_id', subscription.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (subError || !subData) {
    console.error('❌ Subscription record not found:', subscription.id, subError);
    return;
  }

  const userId = subData.user_id;

  // Buscar plano Free
  const { data: freePlan } = await (supabase
    .from('subscription_plans') as any)
    .select('id')
    .eq('slug', 'free')
    .single();

  // Atualizar registro de assinatura
  const { error: updateSubError } = await (supabase
    .from('user_subscriptions') as any)
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (updateSubError) {
    console.error('❌ Error updating subscription record:', updateSubError);
  }

  // Atualizar usuário para plano Free
  const { error: updateUserError } = await (supabase
    .from('users') as any)
    .update({
      current_plan_id: freePlan?.id || null,
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateUserError) {
    console.error('❌ Error updating user to free plan:', updateUserError);
  } else {
    console.log(`✅ Cancelled subscription for user ${userId}, moved to free plan`);
  }
}

/**
 * Invoice Payment Succeeded
 * Chamado quando um pagamento é bem-sucedido
 * Usado para recarregar créditos mensais
 */
async function handleInvoicePaymentSucceeded(invoice: InvoiceWithSubscription) {
  console.log(`✅ Invoice payment succeeded: ${invoice.id}`);

  const supabase = await createClient();
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log('ℹ️  Invoice not related to subscription, skipping');
    return;
  }

  // Buscar registro de assinatura
  const { data: subData, error: subError } = await (supabase
    .from('user_subscriptions') as any)
    .select('*, subscription_plans(*)')
    .eq('stripe_subscription_id', subscriptionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (subError || !subData) {
    console.error('❌ Subscription record not found:', subscriptionId, subError);
    return;
  }

  const userId = subData.user_id;
  const plan = subData.subscription_plans;

  // Se for invoice de novo ciclo (não o primeiro), recarregar créditos
  if (invoice.billing_reason === 'subscription_cycle') {
    console.log(`🔄 Recharging ${plan.monthly_credits} credits for user ${userId}`);

    // Recarregar créditos mensais
    const { error: creditsError } = await (supabase
      .from('users') as any)
      .update({
        credits: (supabase as any).rpc('set_credits', {
          new_credits: plan.monthly_credits
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (creditsError) {
      console.error('❌ Error recharging credits:', creditsError);
    }

    // Resetar contador de créditos extras usados no período
    const { error: resetError } = await (supabase
      .from('user_subscriptions') as any)
      .update({
        credits_recharged_this_period: plan.monthly_credits,
        extra_credits_used_this_period: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subData.id);

    if (resetError) {
      console.error('❌ Error resetting extra credits counter:', resetError);
    }

    // Resetar contador na tabela users
    const { error: resetUserError } = await (supabase
      .from('users') as any)
      .update({
        extra_credits_used: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (resetUserError) {
      console.error('❌ Error resetting user extra credits counter:', resetUserError);
    } else {
      console.log(`✅ Recharged credits and reset counters for user ${userId}`);
    }
  }
}

/**
 * Invoice Payment Failed
 * Chamado quando um pagamento falha
 */
async function handleInvoicePaymentFailed(invoice: InvoiceWithSubscription) {
  console.log(`❌ Invoice payment failed: ${invoice.id}`);

  const supabase = await createClient();
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log('ℹ️  Invoice not related to subscription, skipping');
    return;
  }

  // Buscar registro de assinatura
  const { data: subData, error: subError } = await (supabase
    .from('user_subscriptions') as any)
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (subError || !subData) {
    console.error('❌ Subscription record not found:', subscriptionId, subError);
    return;
  }

  const userId = subData.user_id;

  // Atualizar status da assinatura para past_due
  const { error: updateSubError } = await (supabase
    .from('user_subscriptions') as any)
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (updateSubError) {
    console.error('❌ Error updating subscription to past_due:', updateSubError);
  }

  const { error: updateUserError } = await (supabase
    .from('users') as any)
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateUserError) {
    console.error('❌ Error updating user subscription status:', updateUserError);
  } else {
    console.log(`✅ Marked subscription as past_due for user ${userId}`);
  }
}

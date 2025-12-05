/**
 * POST /api/stripe/sync-products
 *
 * Sincroniza planos do Supabase com produtos e preços do Stripe
 *
 * Este endpoint deve ser chamado:
 * - Após criar/atualizar planos no Supabase
 * - Para sincronizar manualmente produtos com Stripe
 *
 * Autenticação: Requer admin ou chave secreta
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';

interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  name_pt: string;
  description: string | null;
  description_pt: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  price_brl: number;
  monthly_credits: number;
  billing_interval: 'month' | 'year' | 'one_time';
  is_active: boolean;
  features: string[];
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication/authorization
    // For now, require a secret key in header
    const authHeader = request.headers.get('x-admin-secret');
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret || authHeader !== adminSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // 1. Buscar todos os planos ativos do Supabase
    const { data: plans, error: plansError } = await (supabase
      .from('subscription_plans') as any)
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (plansError) {
      console.error('Error fetching plans:', plansError);
      return NextResponse.json(
        { error: 'Failed to fetch plans from database' },
        { status: 500 }
      );
    }

    const results = [];

    // 2. Para cada plano, criar/atualizar no Stripe
    for (const plan of plans as SubscriptionPlan[]) {
      try {
        // Pular plano gratuito (não precisa criar no Stripe)
        if (plan.slug === 'free') {
          results.push({
            plan_slug: plan.slug,
            status: 'skipped',
            message: 'Free plan does not need Stripe product',
          });
          continue;
        }

        let productId = plan.stripe_product_id;
        let priceId = plan.stripe_price_id;

        // 2a. Criar ou atualizar produto no Stripe
        if (productId) {
          // Atualizar produto existente
          const product = await stripe.products.update(productId, {
            name: plan.name_pt,
            description: plan.description_pt || undefined,
            active: plan.is_active,
            metadata: {
              supabase_plan_id: plan.id,
              slug: plan.slug,
              monthly_credits: plan.monthly_credits.toString(),
            },
          });
          console.log(`✅ Updated Stripe product: ${product.id} (${plan.slug})`);
        } else {
          // Criar novo produto
          const product = await stripe.products.create({
            name: plan.name_pt,
            description: plan.description_pt || undefined,
            active: plan.is_active,
            metadata: {
              supabase_plan_id: plan.id,
              slug: plan.slug,
              monthly_credits: plan.monthly_credits.toString(),
            },
          });
          productId = product.id;
          console.log(`✅ Created Stripe product: ${product.id} (${plan.slug})`);
        }

        // 2b. Criar ou atualizar preço no Stripe
        if (priceId) {
          // Preços no Stripe são imutáveis, então verificamos se precisa criar um novo
          const existingPrice = await stripe.prices.retrieve(priceId);

          // Se o valor mudou, criar novo preço e arquivar o antigo
          const newPriceCents = Math.round(plan.price_brl * 100);
          if (existingPrice.unit_amount !== newPriceCents) {
            // Arquivar preço antigo
            await stripe.prices.update(priceId, { active: false });

            // Criar novo preço
            const newPrice = await stripe.prices.create({
              product: productId,
              unit_amount: newPriceCents,
              currency: 'brl',
              recurring: plan.billing_interval === 'one_time' ? undefined : {
                interval: plan.billing_interval as 'month' | 'year',
              },
              metadata: {
                supabase_plan_id: plan.id,
                slug: plan.slug,
              },
            });
            priceId = newPrice.id;
            console.log(`✅ Created new Stripe price: ${newPrice.id} (${plan.slug})`);
          } else {
            console.log(`✅ Price unchanged for ${plan.slug}`);
          }
        } else {
          // Criar novo preço
          const price = await stripe.prices.create({
            product: productId,
            unit_amount: Math.round(plan.price_brl * 100), // Converter BRL para centavos
            currency: 'brl',
            recurring: plan.billing_interval === 'one_time' ? undefined : {
              interval: plan.billing_interval as 'month' | 'year',
            },
            metadata: {
              supabase_plan_id: plan.id,
              slug: plan.slug,
            },
          });
          priceId = price.id;
          console.log(`✅ Created Stripe price: ${price.id} (${plan.slug})`);
        }

        // 3. Salvar IDs do Stripe de volta no Supabase
        const { error: updateError } = await (supabase
          .from('subscription_plans') as any)
          .update({
            stripe_product_id: productId,
            stripe_price_id: priceId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', plan.id);

        if (updateError) {
          console.error(`Error updating plan ${plan.slug}:`, updateError);
          results.push({
            plan_slug: plan.slug,
            status: 'error',
            message: `Failed to update Supabase: ${updateError.message}`,
          });
        } else {
          results.push({
            plan_slug: plan.slug,
            status: 'success',
            stripe_product_id: productId,
            stripe_price_id: priceId,
          });
        }
      } catch (error) {
        console.error(`Error syncing plan ${plan.slug}:`, error);
        results.push({
          plan_slug: plan.slug,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Products and prices synced successfully',
      results,
    });
  } catch (error) {
    console.error('Error in sync-products:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

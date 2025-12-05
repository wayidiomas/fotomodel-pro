import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PerfilClient } from './perfil-client';

const PLAN_NAMES: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  premium: 'Premium',
};

const PLAN_PRICES: Record<string, string> = {
  free: 'R$ 0,00/mês',
  pro: 'R$ 97,00/mês',
  premium: 'R$ 197,00/mês',
};

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user data from database
  const { data: userData, error: userError } = await (supabase
    .from('users') as any)
    .select('full_name, credits, stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('Error fetching user data:', userError);
  }

  // Get subscription data
  const { data: subscriptionData } = await (supabase
    .from('subscription_plans') as any)
    .select('plan_slug, status, current_period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get user stats - count images generated through generations
  const { data: statsData } = await (supabase
    .from('generations') as any)
    .select('generation_results(id)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .eq('is_deleted', false);

  const totalResults = (statsData || []).reduce(
    (sum: number, gen: any) => sum + (gen.generation_results?.length || 0), 0
  );

  const { count: downloadsCount } = await (supabase
    .from('user_downloads') as any)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Determine provider type (email or phone)
  const provider = user.phone ? 'phone' : 'email';

  // Format renewal date
  let renewalDate: string | null = null;
  if (subscriptionData?.current_period_end) {
    const date = new Date(subscriptionData.current_period_end);
    renewalDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Prepare data for client component
  const planSlug = subscriptionData?.plan_slug || 'free';
  const planName = PLAN_NAMES[planSlug] || 'Gratuito';
  const planPrice = PLAN_PRICES[planSlug] || 'R$ 0,00/mês';

  return (
    <PerfilClient
      userData={{
        name: userData?.full_name || user.user_metadata?.full_name || 'Usuário',
        email: user.email || null,
        phone: user.phone || null,
        provider,
      }}
      planData={{
        name: planName,
        status: subscriptionData?.status || 'inactive',
        renewalDate,
        price: planPrice,
      }}
      stats={{
        credits: userData?.credits || 0,
        imagesGenerated: totalResults || 0,
        downloads: downloadsCount || 0,
      }}
      hasStripeCustomer={!!userData?.stripe_customer_id}
      planSlug={planSlug}
    />
  );
}

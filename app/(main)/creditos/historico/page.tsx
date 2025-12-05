import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MainHeader } from '@/components/shared/main-header';
import HistoricoCreditosClient from './historico-creditos-client';

export const metadata = {
  title: 'Histórico de Gastos | Fotomodel Pro',
  description: 'Histórico completo de transações e gastos de créditos.',
};

export default async function HistoricoCreditosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's credits for header
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('credits')
    .eq('id', user.id)
    .single();

  // Get credit transactions
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div
      className="min-h-screen bg-[#f5f4f0] animate-gradient-slow"
      style={{
        backgroundImage:
          'radial-gradient(circle at 12% 18%, rgba(214,192,150,0.14), transparent 32%), radial-gradient(circle at 85% 10%, rgba(190,170,130,0.12), transparent 32%), radial-gradient(circle at 30% 75%, rgba(200,180,140,0.1), transparent 38%)',
      }}
    >
      <MainHeader currentPage="historico" credits={userData?.credits || 0} />

      <HistoricoCreditosClient transactions={transactions || []} />
    </div>
  );
}

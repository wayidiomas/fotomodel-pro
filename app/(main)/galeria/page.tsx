import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GaleriaClient } from './galeria-client';
import type { Tables } from '@/types/database.types';

export const metadata = {
  title: 'Galeria | Fotomodel Pro',
  description: 'Visualize todas as suas gerações de imagens de modelos AI',
};

export type GenerationResult = Tables<'generation_results'>;
export type Generation = Tables<'generations'> & {
  generation_results: GenerationResult[];
};

const PAGE_SIZE = 20;

export default async function GaleriaPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Parallel queries - all lightweight
  const [generationsResult, userDataResult, statsResult] = await Promise.all([
    // 1. First page of generations - MINIMAL fields only
    (supabase.from('generations') as any)
      .select(
        `
        id,
        created_at,
        credits_used,
        generation_results!inner (
          id,
          image_url,
          thumbnail_url,
          is_purchased,
          created_at
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1),

    // 2. User credits
    (supabase.from('users') as any)
      .select('credits')
      .eq('id', user.id)
      .single(),

    // 3. Stats - sum credits and count results in one query
    (supabase.from('generations') as any)
      .select('credits_used, generation_results(id)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('is_deleted', false),
  ]);

  const { data: generations, error: generationsError, count: totalCount } = generationsResult;

  if (generationsError) {
    console.error('Error fetching generations:', generationsError);
  }

  const totalGenerations = totalCount || 0;
  const userData = userDataResult.data;
  const userCredits = userData?.credits ?? 0;

  // Calculate exact stats from all generations
  const statsData = statsResult.data || [];
  const totalResults = statsData.reduce(
    (sum: number, gen: any) => sum + (gen.generation_results?.length || 0), 0
  );
  const totalCreditsUsed = statsData.reduce(
    (sum: number, gen: any) => sum + (gen.credits_used || 0), 0
  );

  // Fast serialization - no category enrichment (categories loaded lazily if needed)
  const sanitizedGenerations = (generations || []).map((gen: any) => ({
    id: gen.id,
    created_at: gen.created_at,
    credits_used: gen.credits_used,
    categories: [], // Skip for fast load - filter can be disabled or load lazily
    garmentTypes: [],
    generation_results: gen.generation_results.map((result: any) => ({
      id: result.id,
      image_url: result.image_url,
      thumbnail_url: result.thumbnail_url,
      is_purchased: result.is_purchased,
      created_at: result.created_at,
    })),
  }));

  const totalPages = Math.ceil(totalGenerations / PAGE_SIZE);

  return (
    <GaleriaClient
      initialGenerations={sanitizedGenerations}
      userCredits={userCredits}
      stats={{
        totalGenerations,
        totalResults,
        totalCreditsUsed,
      }}
      pagination={{
        page: 0,
        pageSize: PAGE_SIZE,
        total: totalGenerations,
        totalPages,
        hasMore: totalPages > 1,
      }}
    />
  );
}

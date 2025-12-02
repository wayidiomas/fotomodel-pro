import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GaleriaClient } from './galeria-client';
import { enrichGenerationsWithCategories } from '@/lib/gallery/extract-categories';
import type { Tables } from '@/types/database.types';

export const metadata = {
  title: 'Galeria | Fotomodel Pro',
  description: 'Visualize todas as suas gerações de imagens de modelos AI',
};

export type GenerationResult = Tables<'generation_results'>;
export type Generation = Tables<'generations'> & {
  generation_results: GenerationResult[];
};

export default async function GaleriaPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's completed generations with results
  const { data: generations, error: generationsError } = await (supabase
    .from('generations') as any)
    .select(
      `
      id,
      created_at,
      credits_used,
      input_data,
      generation_results!inner (
        id,
        image_url,
        thumbnail_url,
        has_watermark,
        is_purchased,
        created_at
      )
    `
    )
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (generationsError) {
    console.error('Error fetching generations:', generationsError);
  }

  // Fetch user credits
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('credits')
    .eq('id', user.id)
    .single();

  const userCredits = userData?.credits ?? 0;

  // Enrich generations with category information
  const enrichedGenerations = generations
    ? await enrichGenerationsWithCategories(supabase, generations)
    : [];

  // Sanitize data to prevent serialization issues with large objects
  const sanitizedGenerations = enrichedGenerations.map((gen) => ({
    id: gen.id,
    created_at: gen.created_at,
    credits_used: gen.credits_used,
    categories: gen.categories,
    garmentTypes: gen.garmentTypes,
    generation_results: gen.generation_results.map((result: any) => ({
      id: result.id,
      image_url: result.image_url,
      thumbnail_url: result.thumbnail_url,
      has_watermark: result.has_watermark,
      is_purchased: result.is_purchased,
      created_at: result.created_at,
    })),
  }));

  return (
    <GaleriaClient
      generations={sanitizedGenerations}
      userCredits={userCredits}
    />
  );
}

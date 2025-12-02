import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MainHeader } from '@/components/shared/main-header';
import { ModelosClient } from './modelos-client';

export const metadata = {
  title: 'Modelos | Fotomodel Pro',
  description: 'Visualize e gerencie seus modelos personalizados salvos',
};

export default async function ModelosPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's saved models
  const { data: userModels, error: modelsError } = await (supabase
    .from('user_models') as any)
    .select(
      `
      id,
      model_name,
      image_url,
      thumbnail_url,
      height_cm,
      weight_kg,
      facial_expression,
      hair_color,
      pose_name,
      gender,
      age_min,
      age_max,
      age_range,
      ethnicity,
      pose_category,
      garment_categories,
      created_at
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (modelsError) {
    console.error('Error fetching user models:', modelsError);
  }

  // Fetch system poses (biblioteca)
  const { data: systemPoses, error: posesError } = await (supabase
    .from('model_poses') as any)
    .select(
      `
      id,
      name,
      image_url,
      gender,
      age_min,
      age_max,
      age_range,
      ethnicity,
      pose_category,
      garment_categories,
      description,
      is_featured
    `
    )
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (posesError) {
    console.error('Error fetching system poses:', posesError);
  }

  // Fetch user credits
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('credits')
    .eq('id', user.id)
    .single();

  const userCredits = userData?.credits ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader currentPage="modelos" credits={userCredits} />
      <ModelosClient
        userModels={userModels || []}
        systemPoses={systemPoses || []}
        userCredits={userCredits}
      />
    </div>
  );
}

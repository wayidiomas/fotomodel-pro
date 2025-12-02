import { redirect } from 'next/navigation';
import { PoseSelectionClient } from '@/components/pose-selection/pose-selection-client';
import { MainHeader } from '@/components/shared/main-header';
import { createClient } from '@/lib/supabase/server';

interface PoseSelectionPageProps {
  searchParams: Promise<{ ids?: string; category?: string }>;
}

/**
 * Pose Selection Page (Step 3)
 * Allows users to select up to 2 model poses for their garments
 *
 * Required query param: ids (comma-separated upload IDs from Step 2)
 */
export default async function PoseSelectionPage({ searchParams }: PoseSelectionPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let credits = 0;
  if (user) {
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('credits')
      .eq('id', user.id)
      .single();
    credits = userData?.credits ?? 0;
  }

  const params = await searchParams;
  const idsParam = params.ids;
  const categorySlug = params.category;

  console.log('📍 Poses page - Received IDs param:', idsParam);

  // Validate that IDs are provided
  if (!idsParam) {
    console.log('❌ No IDs provided, redirecting to categorizar');
    redirect('/criar/categorizar');
  }

  // Parse upload IDs (supports comma-separated or JSON-encoded arrays)
  let decodedParam = idsParam;
  try {
    decodedParam = decodeURIComponent(idsParam);
  } catch {
    decodedParam = idsParam;
  }

  let uploadIds: string[] = [];
  try {
    const parsed = JSON.parse(decodedParam);
    if (Array.isArray(parsed)) {
      uploadIds = parsed
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
    }
  } catch {
    // Not JSON, fallback to comma-separated parsing
  }

  if (uploadIds.length === 0) {
    uploadIds = decodedParam
      .split(',')
      .map((id) => id.replace(/[\[\]"]/g, '').trim())
      .filter(Boolean);
  }
  console.log('📍 Parsed upload IDs:', uploadIds);

  // Validate that we have at least one upload ID
  if (uploadIds.length === 0) {
    console.log('❌ Empty upload IDs after filtering, redirecting to categorizar');
    redirect('/criar/categorizar');
  }

  console.log('✅ Rendering PoseSelectionClient with IDs:', uploadIds);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader currentPage="criar" credits={credits} />
      <PoseSelectionClient uploadIds={uploadIds} categorySlug={categorySlug} />
    </div>
  );
}

export const metadata = {
  title: 'Escolha as Poses | Fotomodel',
  description: 'Selecione as poses de modelo para suas roupas',
};

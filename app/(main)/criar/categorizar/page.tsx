import * as React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CategorizationClient } from '@/components/generation-flow/categorization-client';
import { MainHeader } from '@/components/shared';
import type { WardrobeCollectionSummary } from '@/types/wardrobe';

interface CategorizationPageProps {
  searchParams: Promise<{ ids?: string; category?: string; all?: string }>;
}

export default async function CategorizationPage({ searchParams }: CategorizationPageProps) {
  // Get authenticated user
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get upload IDs from query params
  const params = await searchParams;
  const idsParam = params.ids;
  const categorySlug = params.category;
  const allParam = params.all;

  if (!idsParam) {
    // No IDs provided, redirect back to Step 1
    redirect('/criar');
  }

  const uploadIds = idsParam.split(',').filter(Boolean);
  const allUploadIds = allParam ? allParam.split(',').filter(Boolean) : uploadIds;

  if (uploadIds.length === 0) {
    redirect('/criar');
  }

  // Fetch specific uploads by IDs
  const { data: uploads, error: uploadsError } = await supabase
    .from('user_uploads')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .in('id', uploadIds);

  if (uploadsError || !uploads || uploads.length === 0) {
    // No uploads found, redirect back to Step 1
    redirect('/criar');
  }

  let credits = 0;
  let wardrobeCollections: WardrobeCollectionSummary[] = [];

  if (user?.id) {
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('credits')
      .eq('id', user.id)
      .single();
    credits = userData?.credits ?? 0;

    const { data: collectionData } = await (supabase
      .from('wardrobe_collections') as any)
      .select('id, name, icon_color, item_count')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    wardrobeCollections =
      collectionData?.map((collection: any) => ({
        id: collection.id,
        name: collection.name,
        iconColor: collection.icon_color,
        itemCount: collection.item_count ?? 0,
      })) ?? [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#fff] to-[#f7f4ef]">
      <MainHeader currentPage="criar" credits={credits} />

      {/* Client Component */}
      <CategorizationClient
        uploads={uploads}
        userId={user.id}
        categorySlug={categorySlug}
        collections={wardrobeCollections}
        allUploadIds={allUploadIds}
      />
    </div>
  );
}

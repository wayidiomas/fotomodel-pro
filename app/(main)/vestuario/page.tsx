import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { VestuarioClient } from './vestuario-client';
import type { Tables } from '@/types/database.types';
import { MainHeader } from '@/components/shared';

// Type for wardrobe item with upload data
export type WardrobeItemWithUpload = Tables<'wardrobe_items'> & {
  upload: Tables<'user_uploads'>;
};

const PAGE_SIZE = 20;

export default async function VestuarioPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's collections
  const { data: collections } = await supabase
    .from('wardrobe_collections')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  // Fetch ONLY first page of wardrobe items (paginated)
  const { data: wardrobeItems, count: totalCount } = await supabase
    .from('wardrobe_items')
    .select(
      `
      *,
      upload:user_uploads(*)
    `,
      { count: 'exact' }
    )
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1);

  const { data: userData } = await (supabase
    .from('users') as any)
    .select('credits')
    .eq('id', user.id)
    .single();

  const credits = userData?.credits ?? 0;
  const totalItems = totalCount || 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader currentPage="vestuario" credits={credits} />
      <VestuarioClient
        collections={collections || []}
        initialItems={(wardrobeItems || []) as WardrobeItemWithUpload[]}
        pagination={{
          page: 0,
          pageSize: PAGE_SIZE,
          total: totalItems,
          totalPages,
          hasMore: totalPages > 1,
        }}
      />
    </div>
  );
}

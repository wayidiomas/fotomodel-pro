import * as React from 'react';
import { notFound } from 'next/navigation';
import { GenerationFlowClient } from '@/components/generation-flow/generation-flow-client';
import { getCategoryConfig, validCategorySlugs } from '@/lib/generation-flow/category-config';
import { getCategoryTips } from '@/lib/generation-flow/get-category-tips';
import { createClient } from '@/lib/supabase/server';
import { MainHeader } from '@/components/shared';
import { getStoragePublicUrl } from '@/lib/storage/upload';
import type { WardrobeCollectionSummary, WardrobePickerItem } from '@/types/wardrobe';

interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryGenerationPage({ params }: PageProps) {
  const { category: categorySlug } = await params;

  // Get category configuration
  const categoryConfig = getCategoryConfig(categorySlug);

  // If category not found, show 404
  if (!categoryConfig) {
    notFound();
  }

  // Fetch category tips from database
  const categoryTip = await getCategoryTips(categorySlug);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let credits = 0;
  let wardrobeCollections: WardrobeCollectionSummary[] = [];
  let wardrobeItems: WardrobePickerItem[] = [];

  if (user?.id) {
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('credits')
      .eq('id', user.id)
      .single();
    credits = userData?.credits ?? 0;

    const { data: collectionsData } = await (supabase
      .from('wardrobe_collections') as any)
      .select('id, name, icon_color, item_count')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    wardrobeCollections =
      collectionsData?.map((collection: any) => ({
        id: collection.id,
        name: collection.name,
        iconColor: collection.icon_color,
        itemCount: collection.item_count ?? 0,
      })) ?? [];

    const { data: wardrobeItemsData } = await (supabase
      .from('wardrobe_items') as any)
      .select(
        `
        id,
        collection_id,
        garment_type,
        piece_type,
        category_slug,
        created_at,
        upload:user_uploads (
          id,
          file_path,
          file_name,
          file_size,
          mime_type,
          metadata,
          thumbnail_path
        )
      `
      )
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    wardrobeItems =
      wardrobeItemsData
        ?.map((item: any) => {
          if (!item.upload) {
            return null;
          }

          const publicUrl =
            (item.upload.metadata as any)?.publicUrl ||
            getStoragePublicUrl(item.upload.file_path, 'user-uploads');

          if (!publicUrl) {
            return null;
          }

          const previewUrl =
            getStoragePublicUrl(item.upload.thumbnail_path, 'thumbnails') ||
            publicUrl;

          return {
            id: item.id,
            uploadId: item.upload.id,
            collectionId: item.collection_id,
            collectionName:
              wardrobeCollections.find((collection) => collection.id === item.collection_id)?.name ||
              null,
            pieceType: (item.piece_type as WardrobePickerItem['pieceType']) ?? null,
            garmentType: item.garment_type,
            categorySlug: item.category_slug,
            createdAt: item.created_at,
            storagePath: item.upload.file_path,
            publicUrl,
            previewUrl,
            fileName: item.upload.file_name ?? 'Peça do vestuário',
            fileSize: item.upload.file_size ?? 0,
            mimeType: item.upload.mime_type ?? 'image/jpeg',
          } as WardrobePickerItem;
        })
        .filter((item: any): item is WardrobePickerItem => Boolean(item)) ?? [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#fff] to-[#f7f4ef]">
      <MainHeader currentPage="criar" credits={credits} />

      {/* Client Components */}
      <GenerationFlowClient
        categoryConfig={categoryConfig}
        categoryTip={categoryTip}
        wardrobeCollections={wardrobeCollections}
        wardrobeItems={wardrobeItems}
      />
    </div>
  );
}

// Generate static params for all valid categories
export function generateStaticParams() {
  return validCategorySlugs.map((slug) => ({
    category: slug,
  }));
}

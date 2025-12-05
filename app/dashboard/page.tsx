import { createClient } from '@/lib/supabase/server';
import { getStoragePublicUrl } from '@/lib/storage/upload';
import { DashboardWrapper } from './dashboard-wrapper';
import type { CarouselItem } from '@/components/dashboard/content-carousel-item';

/**
 * Dashboard Page (Server Component)
 *
 * Página principal do dashboard estilo Netflix com:
 * - Header com navegação e créditos
 * - Carrossel auto-scroll com todas as ferramentas (6 opções)
 * - Carrosséis: Últimas peças, Últimas modelos, Últimos downloads
 */

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Middleware should redirect, but safeguard
  }

  // Fetch user data with credits
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('credits, full_name, phone')
    .eq('id', user.id)
    .single();

  // Fetch recent wardrobe items (últimas peças) - same query as vestuário
  const { data: recentWardrobeItems } = await (supabase
    .from('wardrobe_items') as any)
    .select(`
      id,
      garment_type,
      created_at,
      upload:user_uploads(id, file_name, thumbnail_path, file_path, metadata)
    `)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch recent models (últimas modelos)
  const { data: recentModels } = await (supabase
    .from('user_models') as any)
    .select('id, model_name, thumbnail_url, image_url, gender, age_range, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch recent downloads (últimos downloads)
  const { data: recentDownloads } = await (supabase
    .from('user_downloads') as any)
    .select('id, thumbnail_url, image_url, downloaded_at, generation_id')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('downloaded_at', { ascending: false })
    .limit(20);

  // Transform data to CarouselItem format - using same URL resolution as vestuário
  const uploadsItems: CarouselItem[] = (recentWardrobeItems || [])
    .map((item: any) => {
      const upload = item.upload;
      if (!upload) return null;

      // Same URL resolution as vestuário
      const imageUrl =
        (upload.metadata as any)?.publicUrl ||
        getStoragePublicUrl(upload.thumbnail_path, 'user-uploads') ||
        getStoragePublicUrl(upload.file_path, 'user-uploads');

      if (!imageUrl) return null;
      const metadata = upload.metadata as Record<string, any> || {};
      return {
        id: item.id,
        type: 'upload' as const,
        imageUrl,
        title: upload.file_name || 'Peça',
        subtitle: item.garment_type || metadata?.garmentMetadata?.category || '',
        createdAt: item.created_at,
        metadata: {
          category: item.garment_type || metadata?.garmentMetadata?.category,
        },
      };
    })
    .filter((item: CarouselItem | null): item is CarouselItem => item !== null);

  const modelsItems: CarouselItem[] = (recentModels || [])
    .map((model: any) => {
      const imageUrl = getStoragePublicUrl(model.thumbnail_url || model.image_url);
      if (!imageUrl) return null;
      return {
        id: model.id,
        type: 'model' as const,
        imageUrl,
        title: model.model_name || 'Modelo',
        subtitle: [model.gender, model.age_range].filter(Boolean).join(' • '),
        createdAt: model.created_at,
        metadata: {
          gender: model.gender,
          age_range: model.age_range,
        },
      };
    })
    .filter((item: CarouselItem | null): item is CarouselItem => item !== null);

  const downloadsItems: CarouselItem[] = (recentDownloads || [])
    .map((download: any) => {
      const imageUrl = getStoragePublicUrl(download.thumbnail_url || download.image_url);
      if (!imageUrl) return null;
      return {
        id: download.id,
        type: 'download' as const,
        imageUrl,
        title: 'Download',
        createdAt: download.downloaded_at,
      };
    })
    .filter((item: CarouselItem | null): item is CarouselItem => item !== null);

  return (
    <DashboardWrapper
      credits={userData?.credits || 0}
      uploads={uploadsItems}
      models={modelsItems}
      downloads={downloadsItems}
    />
  );
}

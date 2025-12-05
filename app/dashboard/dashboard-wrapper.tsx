'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CreditsProvider } from '@/contexts/credits-context';
import { MainHeader } from '@/components/shared/main-header';
import { HeroToolsCarousel } from '@/components/dashboard/hero-tools-carousel';
import { DashboardCarousels } from '@/components/dashboard/dashboard-carousels';
import { useDashboardData, queryKeys } from '@/lib/hooks/use-queries';
import type { CarouselItem } from '@/components/dashboard/content-carousel-item';
import { getStoragePublicUrl } from '@/lib/storage/upload';

interface DashboardWrapperProps {
  credits: number;
  uploads: CarouselItem[];
  models: CarouselItem[];
  downloads: CarouselItem[];
}

// Transform raw data to CarouselItem format
function transformWardrobeItems(items: any[]): CarouselItem[] {
  const result: CarouselItem[] = [];
  for (const item of items) {
    const upload = item.upload;
    if (!upload) continue;

    const imageUrl =
      (upload.metadata as any)?.publicUrl ||
      getStoragePublicUrl(upload.thumbnail_path, 'user-uploads') ||
      getStoragePublicUrl(upload.file_path, 'user-uploads');

    if (!imageUrl) continue;
    const metadata = upload.metadata as Record<string, any> || {};
    result.push({
      id: item.id,
      type: 'upload',
      imageUrl,
      title: upload.file_name || 'Peça',
      subtitle: item.garment_type || metadata?.garmentMetadata?.category || '',
      createdAt: item.created_at,
      metadata: {
        category: item.garment_type || metadata?.garmentMetadata?.category,
      },
    });
  }
  return result;
}

function transformModels(models: any[]): CarouselItem[] {
  const result: CarouselItem[] = [];
  for (const model of models) {
    const imageUrl = getStoragePublicUrl(model.thumbnail_url || model.image_url);
    if (!imageUrl) continue;
    result.push({
      id: model.id,
      type: 'model',
      imageUrl,
      title: model.model_name || 'Modelo',
      subtitle: [model.gender, model.age_range].filter(Boolean).join(' • '),
      createdAt: model.created_at,
      metadata: {
        gender: model.gender,
        age_range: model.age_range,
      },
    });
  }
  return result;
}

function transformDownloads(downloads: any[]): CarouselItem[] {
  const result: CarouselItem[] = [];
  for (const download of downloads) {
    const imageUrl = getStoragePublicUrl(download.thumbnail_url || download.image_url);
    if (!imageUrl) continue;
    result.push({
      id: download.id,
      type: 'download',
      imageUrl,
      title: 'Download',
      createdAt: download.downloaded_at,
    });
  }
  return result;
}

export function DashboardWrapper({
  credits: initialCredits,
  uploads: initialUploads,
  models: initialModels,
  downloads: initialDownloads,
}: DashboardWrapperProps) {
  const queryClient = useQueryClient();

  // Pre-populate the cache with server-side data
  useEffect(() => {
    queryClient.setQueryData(queryKeys.dashboardData, {
      wardrobeItems: [],
      models: [],
      downloads: [],
      credits: initialCredits,
    });
  }, [queryClient, initialCredits]);

  // Use React Query for data with SSR initial data
  const { data } = useDashboardData();

  // Use cached/fetched data or fall back to initial SSR data
  const uploads = data?.wardrobeItems?.length
    ? transformWardrobeItems(data.wardrobeItems)
    : initialUploads;
  const models = data?.models?.length
    ? transformModels(data.models)
    : initialModels;
  const downloads = data?.downloads?.length
    ? transformDownloads(data.downloads)
    : initialDownloads;
  const credits = data?.credits ?? initialCredits;

  return (
    <CreditsProvider initialCredits={credits}>
      <div className="min-h-screen bg-[#f5f4f0] animate-gradient-slow" style={{
        backgroundImage:
          'radial-gradient(circle at 12% 18%, rgba(214,192,150,0.14), transparent 32%), radial-gradient(circle at 85% 10%, rgba(190,170,130,0.12), transparent 32%), radial-gradient(circle at 30% 75%, rgba(200,180,140,0.1), transparent 38%)',
      }}>
        {/* Header */}
        <MainHeader currentPage="dashboard" />

        {/* Main Content */}
        <main className="mx-auto w-full max-w-[1600px] space-y-12 px-6 py-12 md:px-10 lg:px-14">
          {/* Carrossel Único com todas as ferramentas */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-freight text-3xl font-medium text-black md:text-4xl">
                Comece a criar
              </h2>
              <p className="font-inter text-lg text-gray-500">
                Escolha uma forma de gerar seus modelos
              </p>
            </div>
            <HeroToolsCarousel />
          </section>

          {/* Carrosséis de conteúdo */}
          <DashboardCarousels
            uploads={uploads}
            models={models}
            downloads={downloads}
          />
        </main>
      </div>
    </CreditsProvider>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Download,
  Share2,
  X,
  Calendar,
  Coins,
  Grid3x3,
} from 'lucide-react';
import type { GenerationWithCategories } from '@/lib/gallery/extract-categories';
import { filterGenerationsByCategory, countGenerationsByCategory } from '@/lib/gallery/extract-categories';
import { cn } from '@/lib/utils';
import { GarmentCategory } from '@/lib/generation-flow/garment-metadata-types';
import { Logo } from '@/components/shared/logo';

interface GaleriaClientProps {
  generations: GenerationWithCategories[];
  userCredits: number;
}

const SUPABASE_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/generated-images`
    : null;

const PLACEHOLDER_IMAGE = '/assets/images/generation-flow/clothing-items.png';

const resolvePublicImageUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  const bucketBase = SUPABASE_IMAGES_BUCKET;
  if (!bucketBase) return '';

  return `${bucketBase}/${path.replace(/^\/+/, '')}`;
};

const NAV_LINKS = [
  { name: 'Dashboard', href: '/dashboard', active: false },
  { name: 'Criar', href: '/criar', active: false },
  { name: 'Vestuário', href: '/vestuario', active: false },
  { name: 'Galeria', href: '/galeria', active: true },
  { name: 'Modelos', href: '/modelos', active: false },
  { name: 'Histórico', href: '/historico', active: false },
];

// Garment category groups for filtering (same as vestuário)
const CATEGORY_FILTERS = [
  {
    slug: 'tops',
    label: 'Camisetas & Tops',
    categories: ['TSHIRT', 'TANK_TOP', 'POLO', 'HENLEY', 'LONG_SLEEVE', 'BLOUSE', 'DRESS_SHIRT', 'BUTTON_DOWN']
  },
  {
    slug: 'sweaters',
    label: 'Moletons & Suéteres',
    categories: ['SWEATER', 'CARDIGAN', 'PULLOVER', 'TURTLENECK', 'HOODIE', 'SWEATSHIRT']
  },
  {
    slug: 'jackets',
    label: 'Casacos & Jaquetas',
    categories: ['BLAZER', 'SUIT_JACKET', 'BOMBER_JACKET', 'DENIM_JACKET', 'LEATHER_JACKET', 'TRENCH_COAT', 'PARKA', 'PEACOAT', 'PUFFER_JACKET', 'WINDBREAKER', 'VEST', 'TRACK_JACKET']
  },
  {
    slug: 'pants',
    label: 'Calças',
    categories: ['JEANS', 'DRESS_PANTS', 'CHINOS', 'CARGO_PANTS', 'JOGGERS', 'SWEATPANTS', 'LEGGINGS']
  },
  {
    slug: 'shorts',
    label: 'Shorts & Bermudas',
    categories: ['SHORTS', 'BERMUDA', 'CARGO_SHORTS', 'ATHLETIC_SHORTS']
  },
  {
    slug: 'skirts',
    label: 'Saias',
    categories: ['PENCIL_SKIRT', 'A_LINE_SKIRT', 'MIDI_SKIRT', 'MAXI_SKIRT', 'MINI_SKIRT', 'PLEATED_SKIRT']
  },
  {
    slug: 'dresses',
    label: 'Vestidos',
    categories: ['CASUAL_DRESS', 'COCKTAIL_DRESS', 'EVENING_GOWN', 'MIDI_DRESS', 'MAXI_DRESS', 'SHIRT_DRESS', 'WRAP_DRESS', 'SUNDRESS']
  },
  {
    slug: 'jumpsuits',
    label: 'Macacões',
    categories: ['JUMPSUIT', 'ROMPER', 'OVERALLS']
  },
] as const;

export function GaleriaClient({ generations, userCredits }: GaleriaClientProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<{
    generation: GenerationWithCategories;
    result: any;
  } | null>(null);
  const [downloadingResultId, setDownloadingResultId] = useState<string | null>(null);

  // Calculate stats
  const totalGenerations = generations.length;
  const totalResults = generations.reduce(
    (sum, gen) => sum + gen.generation_results.length,
    0
  );
  const totalCreditsUsed = generations.reduce(
    (sum, gen) => sum + (gen.credits_used || 0),
    0
  );

  // Category counts
  const categoryCounts = useMemo(() => {
    return countGenerationsByCategory(generations);
  }, [generations]);

  // Extended filters with "All"
  const extendedFilters = [
    { slug: null, label: 'Todas as categorias' },
    ...CATEGORY_FILTERS,
  ];

  // Filtered generations
  const filteredGenerations = useMemo(() => {
    return filterGenerationsByCategory(generations, selectedCategory);
  }, [generations, selectedCategory]);

  // Flatten results for display
  const displayResults = useMemo(() => {
    return filteredGenerations.flatMap((generation) =>
      generation.generation_results.map((result) => ({
        generation,
        result,
      }))
    );
  }, [filteredGenerations]);

  const handleDownload = async (resultId: string) => {
    try {
      setDownloadingResultId(resultId);

      const response = await fetch('/api/ai/download-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao baixar imagem');
      }

      if (data.imageUrl) {
        // Download the clean image
        const imageResponse = await fetch(data.imageUrl);
        const blob = await imageResponse.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `fotomodel-${resultId}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('Download concluído com sucesso!');
      }
    } catch (error: any) {
      console.error('Error downloading image:', error);
      alert(error.message || 'Erro ao baixar imagem. Tente novamente.');
    } finally {
      setDownloadingResultId(null);
    }
  };

  const handleShareToWhatsApp = (imagePath: string) => {
    if (typeof window === 'undefined') return;

    const fullUrl = resolvePublicImageUrl(imagePath);
    if (!fullUrl) return;

    const message = encodeURIComponent(
      `Olha essa imagem que gerei no Fotomodel Pro ✨\n${fullUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header - Glassmorphic */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="mx-auto flex h-16 items-center justify-between px-8">
          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center">
              <Logo variant="header" className="h-8 w-auto" />
            </Link>

            <nav className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-inter font-medium transition-all ${
                    link.active
                      ? 'bg-white/60 backdrop-blur-sm text-[#20202a] shadow-sm'
                      : 'text-gray-600 hover:bg-white/40 hover:backdrop-blur-sm hover:text-gray-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Credits */}
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white/60 backdrop-blur-sm border border-white/40 px-3 py-1 shadow-sm">
              <span className="font-inter text-sm font-semibold text-[#020817]">
                {userCredits} créditos
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-8 px-10 py-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/50 bg-white/85 p-8 shadow-[0_25px_70px_rgba(15,15,35,0.12)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(210,200,180,0.25),_transparent_55%)]" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f1e7d3] bg-[#f7f2e7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#4b3f2f]">
                <Sparkles className="h-3.5 w-3.5" />
                Suas criações
              </div>
              <div className="space-y-1">
                <h1 className="font-inter text-3xl font-bold text-[#111827]">Galeria</h1>
                <p className="font-inter text-base text-[#4b5563]">
                  Veja todas as imagens de modelos que você gerou com IA.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/criar"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#20202a]/10 bg-[#20202a] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#20202a]/30 hover:bg-[#2a2a35] transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  Nova Geração
                </Link>
              </div>
            </div>
            <div className="grid w-full max-w-md grid-cols-3 gap-4 rounded-3xl border border-white/40 bg-white/60 p-4 shadow-inner backdrop-blur">
              <div className="rounded-2xl bg-white/70 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Gerações
                </p>
                <p className="mt-1 text-3xl font-bold text-[#111827]">{totalGenerations}</p>
                <p className="text-xs text-gray-500">sessões completas</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Imagens
                </p>
                <p className="mt-1 text-3xl font-bold text-[#111827]">{totalResults}</p>
                <p className="text-xs text-gray-500">variações criadas</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Créditos
                </p>
                <p className="mt-1 text-3xl font-bold text-[#111827]">{totalCreditsUsed}</p>
                <p className="text-xs text-gray-500">utilizados no total</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-inter text-xl font-semibold text-[#020817]">
              Filtrar por categoria
            </h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm font-semibold text-[#20202a] underline-offset-4 hover:underline"
              >
                Limpar filtro
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {extendedFilters.map((category) => {
              const isSelected = selectedCategory === category.slug;
              const count = category.slug
                ? categoryCounts.get(category.slug) || 0
                : totalGenerations;

              return (
                <button
                  key={category.slug ?? 'all'}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={cn(
                    'flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all',
                    isSelected
                      ? 'border-[#20202a] bg-[#20202a] text-white shadow-md'
                      : 'border-gray-200 bg-white/80 text-[#374151] hover:border-[#20202a]/40'
                  )}
                >
                  {category.label}
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs',
                      isSelected ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-inter text-xl font-semibold text-[#020817]">
                Suas gerações
              </h2>
              <p className="text-sm text-gray-500">
                {displayResults.length}{' '}
                {displayResults.length === 1 ? 'imagem disponível' : 'imagens disponíveis'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#111827] shadow-sm"
                disabled
              >
                <Grid3x3 className="h-4 w-4" />
                Visualização em Grid
              </button>
            </div>
          </div>

          {displayResults.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {displayResults.map(({ generation, result }) => {
                const imageUrl = resolvePublicImageUrl(result.image_url) || PLACEHOLDER_IMAGE;
                const createdDate = result.created_at ? new Date(result.created_at) : null;

                // Get first category label
                const firstCategory = generation.garmentTypes[0];
                const categoryLabel = firstCategory
                  ? (GarmentCategory[firstCategory as keyof typeof GarmentCategory] || 'Geração')
                  : 'Geração';

                return (
                  <div
                    key={result.id}
                    className="group relative overflow-hidden rounded-[30px] border border-white/40 bg-white/60 shadow-[0_20px_50px_rgba(20,20,40,0.1)] backdrop-blur cursor-pointer"
                    onClick={() => setSelectedResult({ generation, result })}
                  >
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={imageUrl}
                        alt="Geração AI"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 20vw"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <span className="rounded-full border border-white/40 bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                          {categoryLabel}
                        </span>
                      </div>
                      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between text-white">
                        <div>
                          <p className="text-sm font-semibold">
                            Geração {generation.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-white/70">
                            {createdDate ? createdDate.toLocaleDateString('pt-BR') : 'Data indefinida'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[30px] border border-dashed border-gray-200 bg-white/70 p-16 text-center shadow-inner">
              <p className="text-base font-semibold text-gray-600">
                {selectedCategory ? 'Nenhuma geração nesta categoria' : 'Nenhuma geração ainda'}
              </p>
              <p className="text-sm text-gray-400">
                {selectedCategory
                  ? 'Crie novas gerações com peças desta categoria'
                  : 'Comece criando sua primeira geração de modelo AI'}
              </p>
              <Link
                href="/criar"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#20202a]/10 bg-[#20202a] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#20202a]/30 hover:bg-[#2a2a35] transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Criar Primeira Geração
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Image Preview */}
              <div className="relative lg:w-2/3 aspect-[3/4] bg-gray-100">
                <Image
                  src={resolvePublicImageUrl(selectedResult.result.image_url) || PLACEHOLDER_IMAGE}
                  alt="Geração AI"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Details Sidebar */}
              <div className="lg:w-1/3 p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-inter text-xl font-semibold text-gray-900">
                      Detalhes da Geração
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(selectedResult.result.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {new Date(selectedResult.generation.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {selectedResult.generation.credits_used || 0} créditos utilizados
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <button
                    onClick={() => handleDownload(selectedResult.result.id)}
                    disabled={downloadingResultId === selectedResult.result.id}
                    className="w-full font-inter px-4 py-3 bg-gradient-to-r from-[#20202a] to-[#2a2a35] text-white text-sm font-medium rounded-2xl hover:shadow-lg active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {downloadingResultId === selectedResult.result.id ? 'Baixando...' : 'Baixar Imagem'}
                  </button>

                  <button
                    onClick={() => handleShareToWhatsApp(selectedResult.result.image_url)}
                    className="w-full font-inter px-4 py-3 bg-green-50 text-green-700 text-sm font-medium rounded-2xl hover:bg-green-100 active:scale-[0.98] transition-all border border-green-200 flex items-center justify-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartilhar no WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

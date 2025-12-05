'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Download,
  Share2,
  X,
  Calendar,
  Coins,
  Loader2,
} from 'lucide-react';
import { MainHeader } from '@/components/shared/main-header';
import { getStoragePublicUrl } from '@/lib/storage/upload';
import { useToast, ToastContainer } from '@/components/ui/toast';

interface GenerationResult {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
  is_purchased: boolean;
  created_at: string;
}

interface Generation {
  id: string;
  created_at: string;
  credits_used: number;
  generation_results: GenerationResult[];
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface GaleriaClientProps {
  initialGenerations: Generation[];
  userCredits: number;
  stats: {
    totalGenerations: number;
    totalResults: number;
    totalCreditsUsed: number;
  };
  pagination: PaginationInfo;
}

const PLACEHOLDER_IMAGE = '/assets/images/generation-flow/clothing-items.png';

// Tiny blur placeholder for faster perceived loading
const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQREiExBRMiQWFR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQEBAAMBAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEEA/ANS6Vcx3VxNLAweGSTuAYyGBIGx2qvSlJMY5WKvA3/9k=';

// Use centralized storage URL resolution that detects correct bucket from path
const resolvePublicImageUrl = (path?: string | null) => {
  if (!path) return '';
  return getStoragePublicUrl(path) || '';
};

export function GaleriaClient({
  initialGenerations,
  userCredits,
  stats,
  pagination: initialPagination
}: GaleriaClientProps) {
  const [generations, setGenerations] = useState(initialGenerations);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedResult, setSelectedResult] = useState<{
    generation: Generation;
    result: GenerationResult;
  } | null>(null);
  const [downloadingResultId, setDownloadingResultId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const { totalGenerations, totalResults, totalCreditsUsed } = stats;

  // Flatten results for display
  const displayResults = useMemo(() => {
    return generations.flatMap((generation) =>
      generation.generation_results.map((result) => ({
        generation,
        result,
      }))
    );
  }, [generations]);

  // Load more - simple fetch without React Query
  const loadMore = async () => {
    if (isLoadingMore || !pagination.hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await fetch(`/api/gallery?page=${nextPage}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setGenerations(prev => [...prev, ...data.generations]);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading more:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

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

        addToast({
          type: 'success',
          title: 'Download concluído!',
          description: 'A imagem foi baixada com sucesso.',
        });
      }
    } catch (error: any) {
      console.error('Error downloading image:', error);
      addToast({
        type: 'error',
        title: 'Erro ao baixar',
        description: error.message || 'Erro ao baixar imagem. Tente novamente.',
      });
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
      <MainHeader currentPage="galeria" credits={userCredits} />

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
                <h1 className="font-freight font-medium text-3xl text-[#111827]">Galeria</h1>
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

        {/* Gallery Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-freight font-medium text-xl text-[#020817]">
                Suas gerações
              </h2>
              <p className="text-sm text-gray-500">
                {displayResults.length}{' '}
                {displayResults.length === 1 ? 'imagem carregada' : 'imagens carregadas'}
              </p>
            </div>
          </div>

          {displayResults.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {displayResults.map(({ generation, result }) => {
                  const imageUrl = resolvePublicImageUrl(result.thumbnail_url || result.image_url) || PLACEHOLDER_IMAGE;
                  const createdDate = result.created_at ? new Date(result.created_at) : null;

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
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />
                        <div className="absolute left-4 top-4 flex items-center gap-2">
                          <span className="rounded-full border border-white/40 bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                            Geração
                          </span>
                        </div>
                        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between text-white">
                          <div>
                            <p className="text-sm font-semibold">
                              {generation.id.slice(0, 8)}
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

              {/* Load More Button */}
              {pagination.hasMore && (
                <div className="flex justify-center pt-8">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-[#111827] shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        Carregar mais
                        <span className="text-gray-400">
                          ({generations.length} de {pagination.total})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[30px] border border-dashed border-gray-200 bg-white/70 p-16 text-center shadow-inner">
              <p className="text-base font-semibold text-gray-600">
                Nenhuma geração ainda
              </p>
              <p className="text-sm text-gray-400">
                Comece criando sua primeira geração de modelo AI
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
                    <h3 className="font-freight font-medium text-xl text-gray-900">
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

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

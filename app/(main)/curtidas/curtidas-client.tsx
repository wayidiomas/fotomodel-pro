'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, X, Download, Calendar, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStoragePublicUrl } from '@/lib/storage/upload';
import { createClient } from '@/lib/supabase/client';

interface LikedItem {
  id: string;           // generation_feedback.id
  resultId: string;     // generation_results.id
  imageUrl: string;
  thumbnailUrl: string | null;
  likedAt: string;
  generatedAt: string;
}

interface CurtidasClientProps {
  items: LikedItem[];
}

export function CurtidasClient({ items: initialItems }: CurtidasClientProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedItem, setSelectedItem] = useState<LikedItem | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveLike = async (feedbackId: string) => {
    setRemovingId(feedbackId);
    try {
      const supabase = createClient();
      await supabase
        .from('generation_feedback')
        .delete()
        .eq('id', feedbackId);

      setItems(prev => prev.filter(item => item.id !== feedbackId));
      if (selectedItem?.id === feedbackId) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error removing like:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const resolveImageUrl = (path: string | null) => {
    if (!path) return '';
    return getStoragePublicUrl(path) || path;
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f0e6]">
            <Heart className="h-6 w-6 text-[#b08c4a] fill-[#c6a972]" />
          </div>
          <div>
            <h1 className="font-freight text-3xl font-medium text-gray-900">
              Minhas Curtidas
            </h1>
            <p className="mt-1 font-inter text-base text-gray-500">
              {items.length} {items.length === 1 ? 'imagem curtida' : 'imagens curtidas'}
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="rounded-[28px] border border-white/60 bg-white/80 p-12 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f0e6]">
            <Heart className="h-8 w-8 text-[#c6a972]" />
          </div>
          <h3 className="font-freight text-xl font-medium text-gray-900">
            Nenhuma curtida ainda
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Curta imagens no chat ou nos resultados de geração para vê-las aqui.
          </p>
        </div>
      ) : (
        /* Grid de Imagens */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 shadow-md transition-all hover:shadow-xl"
            >
              <Image
                src={resolveImageUrl(item.thumbnailUrl || item.imageUrl)}
                alt="Imagem curtida"
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />
              {/* Heart badge */}
              <div className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm">
                <Heart className="h-4 w-4 text-[#b08c4a] fill-[#c6a972]" />
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs text-white/80">
                    {formatDistanceToNow(new Date(item.likedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal de Detalhe */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedItem(null)}
          />
          <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>
                  Curtido {formatDistanceToNow(new Date(selectedItem.likedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Image */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-100">
              <Image
                src={resolveImageUrl(selectedItem.imageUrl)}
                alt="Imagem curtida"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-3">
              <a
                href={resolveImageUrl(selectedItem.imageUrl)}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#20202a] px-4 py-3 font-medium text-white transition-colors hover:bg-[#2a2a36]"
              >
                <Download className="h-5 w-5" />
                Baixar imagem
              </a>
              <button
                onClick={() => handleRemoveLike(selectedItem.id)}
                disabled={removingId === selectedItem.id}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5" />
                Remover curtida
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

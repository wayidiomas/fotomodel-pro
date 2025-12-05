'use client';

import * as React from 'react';
import Image from 'next/image';
import { Folder, Search, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GarmentType, PieceType } from '@/lib/generation-flow/upload-types';
import type { WardrobeCollectionSummary, WardrobePickerItem } from '@/types/wardrobe';

interface WardrobePickerModalProps {
  open: boolean;
  pieceType: PieceType | null;
  garmentType: GarmentType;
  collections: WardrobeCollectionSummary[];
  items: WardrobePickerItem[];
  onClose: () => void;
  onSelect: (item: WardrobePickerItem) => void;
}

const pieceLabels: Record<PieceType, string> = {
  upper: 'Peça de cima',
  lower: 'Peça de baixo',
};

export const WardrobePickerModal: React.FC<WardrobePickerModalProps> = ({
  open,
  pieceType,
  garmentType,
  collections,
  items,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeCollection, setActiveCollection] = React.useState<string>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 18;

  React.useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setActiveCollection('all');
      setCurrentPage(1);
    }
  }, [open]);

  const normalizedPieceFilter = garmentType === 'single' ? null : pieceType;

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (normalizedPieceFilter) {
        const matchesPiece =
          item.pieceType === normalizedPieceFilter ||
          item.pieceType === 'full' ||
          item.pieceType === null;
        if (!matchesPiece) return false;
      }

      if (activeCollection !== 'all' && item.collectionId !== activeCollection) {
        return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const haystack = `${item.fileName} ${item.collectionName ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [items, normalizedPieceFilter, activeCollection, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeCollection, searchTerm, pieceType, garmentType]);

  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  if (!open) {
    return null;
  }

  const modalTitle =
    garmentType === 'single'
      ? 'Escolha uma peça única do seu vestuário'
      : `Selecione ${pieceType ? pieceLabels[pieceType] : 'a peça desejada'}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-[1100px] max-h-[90vh] flex flex-col rounded-[40px] border border-white/30 bg-white/85 shadow-[0_25px_80px_rgba(15,15,35,0.25)] backdrop-blur-2xl">
        <div className="flex flex-col gap-6 p-6 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f1e7d3] bg-[#f7f2e7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#4b3f2f]">
                <Sparkles className="h-3.5 w-3.5" />
                Vestuário
              </div>
              <h3 className="font-freight text-2xl font-medium text-[#151515]">{modalTitle}</h3>
              <p className="text-sm text-gray-500">
                Filtre por coleção, busque pelo nome da peça ou selecione rapidamente os favoritos.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/50 bg-white/70 p-2 text-gray-500 transition hover:text-gray-900"
              aria-label="Fechar seleção"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-white/40 bg-white/70 p-4 shadow-inner backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Busque por nome ou coleção"
                  className="flex-1 border-none bg-transparent text-sm text-gray-700 outline-none"
                />
              </div>
              {pieceType && (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-[#efe4cc] bg-[#fbf6eb] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#6b4d23]">
                  {pieceLabels[pieceType]}
                </div>
              )}
            </div>
            {collections.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCollection('all')}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm font-semibold transition',
                    activeCollection === 'all'
                      ? 'border-[#20202a] bg-[#20202a] text-white shadow'
                      : 'border-gray-200 bg-white/80 text-gray-600 hover:border-[#20202a]/40'
                  )}
                >
                  Todas
                </button>
                {collections.map((collection) => (
                  <button
                    type="button"
                    key={collection.id}
                    onClick={() => setActiveCollection(collection.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition',
                      activeCollection === collection.id
                        ? 'border-[#20202a] bg-[#20202a] text-white shadow'
                        : 'border-gray-200 bg-white/80 text-gray-600 hover:border-[#20202a]/40'
                    )}
                  >
                    <span
                      className="inline-flex h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: collection.iconColor || '#20202a' }}
                    />
                    {collection.name}
                    <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium">
                      {collection.itemCount}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {paginatedItems.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="group flex flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white/80 text-left shadow-[0_20px_55px_rgba(15,15,35,0.12)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(15,15,35,0.18)]"
                  >
                    <div className="relative h-56 w-full overflow-hidden">
                      <Image
                        src={item.previewUrl || item.publicUrl}
                        alt={item.fileName}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width:768px) 90vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />
                      {item.collectionName && (
                        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                          <Folder className="h-3.5 w-3.5" />
                          {item.collectionName}
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-3 text-left text-sm font-semibold text-[#111827]">
                      {item.fileName}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full border border-gray-200 px-3 py-1 font-semibold text-[#111827] disabled:opacity-50"
                >
                  Anterior
                </button>
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-full border border-gray-200 px-3 py-1 font-semibold text-[#111827] disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-[28px] border border-dashed border-gray-200 bg-white/70 p-12 text-center shadow-inner">
              <p className="text-base font-semibold text-gray-600">Nenhuma peça encontrada</p>
              <p className="text-sm text-gray-400">
                Ajuste os filtros acima ou adicione novas peças na aba Vestuário.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export type AuditEntry = {
  id: string;
  type: 'upload' | 'generation' | 'model';
  title: string;
  subtitle?: string;
  createdAt: string;
  imageUrl?: string;
  meta?: string;
};

interface HistoricoClientProps {
  entries: AuditEntry[];
  totalCount: number;
  page: number;
  totalPages: number;
  perPage: number;
}

const TYPE_BADGE: Record<AuditEntry['type'], { label: string; color: string; text: string }> = {
  upload: { label: 'Upload', color: 'bg-blue-50 text-blue-800 border-blue-100', text: 'text-blue-900' },
  generation: { label: 'Geração', color: 'bg-emerald-50 text-emerald-800 border-emerald-100', text: 'text-emerald-900' },
  model: { label: 'Modelo', color: 'bg-purple-50 text-purple-800 border-purple-100', text: 'text-purple-900' },
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function HistoricoClient({ entries, totalCount, page, totalPages, perPage }: HistoricoClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<'all' | AuditEntry['type']>('all');

  const filteredEntries = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((item) => item.type === filter);
  }, [entries, filter]);

  const counts = useMemo(() => {
    return entries.reduce(
      (acc, item) => {
        acc.all += 1;
        acc[item.type] += 1;
        return acc;
      },
      { all: 0, upload: 0, generation: 0, model: 0 }
    );
  }, [entries]);

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set('page', String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-[1728px] px-7 py-10">
      {/* Header block */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f1e7d3] bg-[#f7f2e7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#4b3f2f]">
            Log completo
          </div>
          <h1 className="font-freight text-[34px] font-medium leading-tight text-[#0b1022]">Histórico</h1>
          <p className="font-inter text-[16px] text-[#1f2937] text-opacity-80">
            Tudo o que você já subiu, gerou e salvou — com paginação e filtros rápidos.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {(['all', 'upload', 'generation', 'model'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                filter === key
                  ? 'border-[#20202a] bg-[#20202a] text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              )}
            >
              {key === 'all' ? 'Tudo' : TYPE_BADGE[key].label}
              <span className="rounded-full bg-black/5 px-2 text-xs font-semibold text-gray-800">
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredEntries.map((entry) => {
          const badge = TYPE_BADGE[entry.type];
          return (
            <div
              key={entry.id}
              className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_12px_45px_rgba(12,18,38,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(12,18,38,0.12)]"
            >
              <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                {entry.imageUrl ? (
                  <Image
                    src={entry.imageUrl}
                    alt={entry.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    priority={false}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">Sem imagem</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/45" />
                <div
                  className={cn(
                    'absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm',
                    badge.color
                  )}
                >
                  <span>{badge.label}</span>
                </div>
              </div>

              <div className="space-y-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-freight text-lg font-medium text-[#0b1022]">{entry.title}</h3>
                    <p className="font-inter text-sm text-gray-600 line-clamp-2">{entry.subtitle || '—'}</p>
                  </div>
                  {entry.meta && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-800">
                      {entry.meta}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                  <span>{formatDate(entry.createdAt)}</span>
                  <span className={cn('uppercase tracking-[0.18em]', badge.text)}>
                    {badge.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredEntries.length === 0 && (
        <div className="mt-14 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="font-freight text-lg font-medium text-gray-900">Nada por aqui ainda</p>
          <p className="font-inter text-sm text-gray-600 max-w-md">
            Gere imagens, faça uploads ou salve modelos para ver seu histórico completo.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 font-inter text-sm text-gray-800">
          <div>
            <span className="font-semibold">{totalCount}</span> itens • página {page} de {totalPages} • {perPage} por página
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, Download, Wand2, Shirt, User, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CarouselItem, CarouselItemType } from './content-carousel-item';

interface ItemDetailModalProps {
  item: CarouselItem | null;
  items: CarouselItem[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (item: CarouselItem) => void;
}

export function ItemDetailModal({
  item,
  items,
  isOpen,
  onClose,
  onNavigate,
}: ItemDetailModalProps) {
  const currentIndex = item ? items.findIndex((i) => i.id === item.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onNavigate(items[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, items, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onNavigate(items[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, items, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const relativeTime = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col bg-gradient-to-br from-white to-gray-50/80 rounded-3xl overflow-hidden shadow-2xl border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/80 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <TypeBadge type={item.type} />
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              {relativeTime}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          <div className="flex flex-col lg:flex-row min-h-[500px]">
            {/* Image Section */}
            <div className="lg:w-1/2 relative bg-gradient-to-br from-gray-100 to-gray-50">
              <div className="aspect-[3/4] lg:aspect-auto lg:absolute lg:inset-0 flex items-center justify-center p-6">
                <div className="relative w-full h-full max-h-[500px] lg:max-h-none rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || 'Item'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="lg:w-1/2 flex flex-col p-6 lg:p-8">
              {/* Title & Subtitle */}
              <div className="mb-6">
                {item.title && (
                  <h2 className="font-freight text-3xl font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h2>
                )}
                {item.subtitle && (
                  <p className="font-inter text-base text-gray-600">
                    {item.subtitle}
                  </p>
                )}
              </div>

              {/* Type-specific Content */}
              <TypeSpecificContent type={item.type} item={item} />

              {/* Actions - pushed to bottom */}
              <div className="mt-auto pt-6 space-y-3">
                <ActionButtons type={item.type} item={item} />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {hasPrev && (
          <button
            onClick={handlePrev}
            className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xl border border-gray-100 transition-all hover:scale-110 hover:shadow-2xl z-20"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xl border border-gray-100 transition-all hover:scale-110 hover:shadow-2xl z-20"
            aria-label="Próximo"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        )}

        {/* Position Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/70 backdrop-blur-sm rounded-full text-sm font-medium text-white shadow-lg">
          {currentIndex + 1} / {items.length}
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: CarouselItemType }) {
  const config = {
    upload: {
      label: 'Peça',
      icon: Shirt,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    model: {
      label: 'Modelo',
      icon: User,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    },
    download: {
      label: 'Geração',
      icon: Sparkles,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200'
    },
  };

  const { label, icon: Icon, bgColor, textColor, borderColor } = config[type];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border',
        bgColor,
        textColor,
        borderColor
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function TypeSpecificContent({ type, item }: { type: CarouselItemType; item: CarouselItem }) {
  if (type === 'model' && item.metadata) {
    const { gender, age_range, ethnicity, hair_color, height_cm, weight_kg } = item.metadata as any;

    const attributes = [
      { label: 'Gênero', value: formatGender(gender), show: !!gender },
      { label: 'Idade', value: age_range, show: !!age_range },
      { label: 'Etnia', value: ethnicity, show: !!ethnicity },
      { label: 'Cabelo', value: hair_color, show: !!hair_color },
      { label: 'Altura', value: height_cm ? `${height_cm}cm` : null, show: !!height_cm },
      { label: 'Peso', value: weight_kg ? `${weight_kg}kg` : null, show: !!weight_kg },
    ].filter(attr => attr.show && attr.value);

    if (attributes.length === 0) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-inter text-xs font-semibold uppercase tracking-wider text-gray-500">
          Características
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {attributes.map((attr, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-gray-50/80 border border-gray-100 p-3"
            >
              <p className="text-xs font-medium text-gray-500 mb-0.5">{attr.label}</p>
              <p className="text-sm font-semibold text-gray-900">{attr.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'upload' && item.metadata) {
    const { category, garment_type, piece_type } = item.metadata as any;

    const attributes = [
      { label: 'Categoria', value: category, show: !!category },
      { label: 'Tipo', value: garment_type, show: !!garment_type },
      { label: 'Peça', value: piece_type, show: !!piece_type },
    ].filter(attr => attr.show && attr.value);

    if (attributes.length === 0) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-inter text-xs font-semibold uppercase tracking-wider text-gray-500">
          Detalhes da Peça
        </h4>
        <div className="flex flex-wrap gap-2">
          {attributes.map((attr, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-sm font-medium text-blue-700"
            >
              {attr.value}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'download') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Download className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">Imagem Disponível</p>
              <p className="text-xs text-emerald-700">Sem marca d'água • Alta resolução</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function ActionButtons({ type, item }: { type: CarouselItemType; item: CarouselItem }) {
  if (type === 'upload') {
    return (
      <>
        <Link href="/criar/cabide" className="block">
          <Button className="w-full h-12 gap-2 bg-[#20202a] hover:bg-[#2a2a36] rounded-xl font-semibold text-base shadow-lg shadow-gray-900/10">
            <Wand2 className="h-5 w-5" />
            Gerar com esta peça
          </Button>
        </Link>
        <Link href="/vestuario" className="block">
          <Button variant="outline" className="w-full h-11 gap-2 rounded-xl border-gray-200 hover:bg-gray-50">
            <Shirt className="h-4 w-4" />
            Ver no vestuário
          </Button>
        </Link>
      </>
    );
  }

  if (type === 'model') {
    return (
      <>
        <Link href="/chat" className="block">
          <Button className="w-full h-12 gap-2 bg-[#20202a] hover:bg-[#2a2a36] rounded-xl font-semibold text-base shadow-lg shadow-gray-900/10">
            <Wand2 className="h-5 w-5" />
            Usar este modelo
          </Button>
        </Link>
        <Link href="/modelos" className="block">
          <Button variant="outline" className="w-full h-11 gap-2 rounded-xl border-gray-200 hover:bg-gray-50">
            Explorar mais modelos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </>
    );
  }

  if (type === 'download') {
    return (
      <>
        <a href={item.imageUrl} download target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full h-12 gap-2 bg-[#20202a] hover:bg-[#2a2a36] rounded-xl font-semibold text-base shadow-lg shadow-gray-900/10">
            <Download className="h-5 w-5" />
            Baixar imagem
          </Button>
        </a>
        <Link href="/galeria" className="block">
          <Button variant="outline" className="w-full h-11 gap-2 rounded-xl border-gray-200 hover:bg-gray-50">
            Ver todas na galeria
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </>
    );
  }

  return null;
}

function formatGender(gender: string | null | undefined): string | null {
  if (!gender) return null;
  const map: Record<string, string> = {
    'MALE': 'Masculino',
    'FEMALE': 'Feminino',
    'NON_BINARY': 'Não-binário',
    'male': 'Masculino',
    'female': 'Feminino',
  };
  return map[gender] || gender;
}

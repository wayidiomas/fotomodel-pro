'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GarmentType, PieceType, GarmentUpload } from '@/lib/generation-flow/upload-types';
import { garmentDescriptions, pieceTypeDescriptions } from '@/lib/generation-flow/upload-types';
import { ImageLoadingOverlay } from '@/components/shared/image-loading-overlay';
import { Tooltip } from '@/components/shared/tooltip';
import { IconifyShirt } from '@/components/icons/iconify-shirt';
import { IconifyPants } from '@/components/icons/iconify-pants';

interface UploadAreaProps {
  garmentType: GarmentType;
  uploads: GarmentUpload[];
  onUpload: (file: File, pieceType: PieceType) => void;
  onRemoveUpload: (id: string) => void;
  onChooseFromWardrobe?: (pieceType: PieceType, garmentType: GarmentType) => void;
  isUploading?: boolean;
  uploadError?: string | null;
  className?: string;
}

const pieceMeta = {
  upper: {
    label: 'Peça de cima',
    Icon: IconifyShirt,
  },
  lower: {
    label: 'Peça de baixo',
    Icon: IconifyPants,
  },
} satisfies Record<PieceType, { label: string; Icon: React.ComponentType<{ className?: string; size?: number }> }>;

export const UploadArea: React.FC<UploadAreaProps> = ({
  garmentType,
  uploads = [],
  onUpload,
  onRemoveUpload,
  onChooseFromWardrobe,
  isUploading = false,
  uploadError,
  className,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const sourcePickerRef = React.useRef<HTMLDivElement>(null);
  const slotsContainerRef = React.useRef<HTMLDivElement>(null);
  const previousUploadsRef = React.useRef<GarmentUpload[]>([]);

  const [selectedPieceType, setSelectedPieceType] = React.useState<PieceType>('upper');
  const [showSourcePicker, setShowSourcePicker] = React.useState(false);
  const [pickerPieceType, setPickerPieceType] = React.useState<PieceType>('upper');

  const maxUploads = garmentType === 'single' ? 1 : 2;
  const canAddMore = uploads.length < maxUploads;
  const singleSlotType: PieceType = (uploads[0]?.pieceType as PieceType) || 'upper';
  const slotPieceTypes: PieceType[] =
    garmentType === 'outfit'
      ? (['upper', 'lower'] as PieceType[])
      : ([singleSlotType] as PieceType[]);

  React.useEffect(() => {
    if (!showSourcePicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (sourcePickerRef.current && !sourcePickerRef.current.contains(event.target as Node)) {
        setShowSourcePicker(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSourcePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showSourcePicker]);

  React.useEffect(() => {
    if (!canAddMore) {
      setShowSourcePicker(false);
    }
  }, [canAddMore]);

  React.useEffect(() => {
    const previousCount = slotsContainerRef.current?.dataset.count
      ? Number(slotsContainerRef.current.dataset.count)
      : uploads.length;

    if (slotsContainerRef.current) {
      slotsContainerRef.current.dataset.count = String(uploads.length);
      if (uploads.length > previousCount) {
        slotsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [uploads.length]);

  React.useEffect(() => {
    const previous = previousUploadsRef.current;
    const hasNewlyCompleted = uploads.some((upload) => {
      if (!upload.uploadResult?.success) return false;
      const prevMatch = previous.find((p) => p.id === upload.id);
      return !prevMatch || !prevMatch.uploadResult?.success;
    });

    if (hasNewlyCompleted && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    previousUploadsRef.current = uploads;
  }, [uploads]);

  React.useEffect(() => {
    if (showSourcePicker) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showSourcePicker]);

  const handleFileInputClick = () => {
    setShowSourcePicker(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file, selectedPieceType);
      event.target.value = '';
    }
  };

  const handleSourceSelection = (source: 'upload' | 'wardrobe') => {
    setShowSourcePicker(false);
    if (source === 'upload') {
      handleFileInputClick();
    } else if (source === 'wardrobe' && onChooseFromWardrobe) {
      onChooseFromWardrobe(pickerPieceType, garmentType);
    }
  };

  const startUpload = (piece: PieceType) => {
    setSelectedPieceType(piece);
    setPickerPieceType(piece);
    setShowSourcePicker(true);

    if (slotsContainerRef.current) {
      slotsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const renderSlot = (piece: PieceType) => {
    const upload = uploads.find((u) => u.pieceType === piece);
    const meta = pieceMeta[piece];
    const isSingleMode = garmentType === 'single';
    const label = isSingleMode ? 'Peça única' : meta.label;
    const tooltipText = isSingleMode
      ? 'Sua peça única será aplicada a todo o visual. Prefira fotos com boa iluminação e fundo neutro.'
      : pieceTypeDescriptions[piece];

    return (
      <div
        key={piece}
        className={cn(
          'flex flex-col rounded-[32px] border border-gray-200 bg-white shadow-sm transition-shadow',
          'hover:shadow-md'
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <meta.Icon className="h-10 w-10 text-[#20202a]" size={40} />
            <div>
              <p className="font-inter text-sm font-semibold text-[#111827]">{label}</p>
              <p className="font-inter text-xs text-gray-500">
                {upload
                  ? 'Imagem carregada'
                  : isSingleMode
                    ? 'Aguardando foto da peça única'
                    : 'Aguardando foto da peça'}
              </p>
            </div>
          </div>
          <Tooltip content={tooltipText}>
            <button className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-[#111827]">
              ?
            </button>
          </Tooltip>
        </div>

        <div className="px-5 py-4 space-y-4">
          {upload ? (
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              <Image
                src={upload.previewUrl}
                alt={`Preview ${label}`}
                fill
                className="object-contain drop-shadow-md bg-white"
              />
              {!upload.uploadResult && <ImageLoadingOverlay loadingText="Enviando..." />}
              <button
                onClick={() => onRemoveUpload(upload.id)}
                className="absolute top-3 right-3 rounded-full bg-red-500 p-2 text-white shadow"
                aria-label={`Remover ${label}`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 px-4 text-center">
              <div className="relative flex w-full max-w-[260px] items-center justify-center">
                <Image
                  src="/assets/images/generation-flow/clothing-items.png"
                  alt="Referência de peças"
                  width={260}
                  height={180}
                  className="object-contain drop-shadow-md"
                />
              </div>
              <p className="font-inter text-sm text-gray-600 max-w-[360px]">
                {isSingleMode
                  ? 'Envie a foto da peça única para encaixar no look ou escolha do vestuário.'
                  : `Envie a foto da ${meta.label.toLowerCase()} para encaixar no look ou escolha do vestuário.`}
              </p>
              <button
                onClick={() => startUpload(piece)}
                className="rounded-2xl bg-[#20202a] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#2a2a34]"
                disabled={!canAddMore}
              >
                Selecionar imagem
              </button>
            </div>
          )}
        </div>

        {upload && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-600">
            <span>{upload.uploadResult?.success ? 'Upload concluído' : 'Processando...'}</span>
            <button
              onClick={() => startUpload(piece)}
              className="rounded-full border border-gray-200 px-3 py-1 font-medium text-[#111827] hover:bg-gray-50"
            >
              Trocar imagem
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={cn('relative flex flex-col gap-5', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <p className="font-inter text-xs uppercase tracking-[0.2em] text-[#6b7280]">Passo 1</p>
          <p className="font-freight font-medium text-xl text-[#111827]">
            {uploads.length > 0 ? 'Ótimo! Continue ajustando as peças' : 'Fotografe ou faça upload da peça'}
          </p>
        </div>
        <Tooltip content={garmentDescriptions[garmentType]}>
          <button className="h-8 w-8 rounded-full border border-gray-200 text-gray-500 hover:text-[#111827]">
            ?
          </button>
        </Tooltip>
      </div>

      <div
        ref={slotsContainerRef}
        data-count={uploads.length}
        className={cn(
          'grid w-full gap-4',
          garmentType === 'outfit' ? 'md:grid-cols-2' : 'grid-cols-1'
        )}
      >
        {slotPieceTypes.map((piece) => renderSlot(piece))}
      </div>

      {uploadError && (
        <div className="w-full rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
          {uploadError}
        </div>
      )}

      {showSourcePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            ref={sourcePickerRef}
            className="w-full max-w-lg rounded-[32px] border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur"
          >
            <div className="mb-4 flex items-center gap-3">
              {(pickerPieceType === 'upper' ? (
                <IconifyShirt className="h-12 w-12 text-[#20202a]" size={48} />
              ) : (
                <IconifyPants className="h-12 w-12 text-[#20202a]" size={48} />
              ))}
              <div>
                <p className="font-freight font-medium text-lg text-[#111827]">
                  {pickerPieceType === 'upper' ? 'Adicionar peça de cima' : 'Adicionar peça de baixo'}
                </p>
                <p className="font-inter text-sm text-gray-500">Escolha a origem da imagem</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => handleSourceSelection('upload')}
                className="flex flex-col gap-1 rounded-2xl border border-[#20202a]/10 bg-[#20202a] px-4 py-3 text-left text-white shadow transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center gap-2">
                  <Image src="/assets/icons/ui/upload-device.svg" alt="" width={20} height={20} />
                  <span className="font-inter text-sm font-semibold">Enviar do dispositivo</span>
                </div>
                <span className="font-inter text-xs text-white/80">
                  Faça upload direto do seu computador ou celular
                </span>
              </button>
              <button
                onClick={() => handleSourceSelection('wardrobe')}
                disabled={!onChooseFromWardrobe}
                className={cn(
                  'flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-[#111827] shadow transition-transform hover:scale-[1.01]',
                  !onChooseFromWardrobe && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-2">
                  <Image src="/assets/icons/ui/wardrobe.svg" alt="" width={20} height={20} />
                  <span className="font-inter text-sm font-semibold">Escolher do vestuário</span>
                </div>
                <span className="font-inter text-xs text-gray-500">
                  Use peças que você já enviou anteriormente
                </span>
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowSourcePicker(false)}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

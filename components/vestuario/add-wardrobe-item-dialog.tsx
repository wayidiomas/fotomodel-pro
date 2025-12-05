'use client';

import * as React from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { uploadUserImage } from '@/lib/storage/upload';
import { GarmentCategory, enumToOptions } from '@/lib/generation-flow/garment-metadata-types';
import { mapCategoryToSlug } from '@/lib/wardrobe/save-to-wardrobe';
import type { WardrobeCollectionSummary } from '@/types/wardrobe';
import { useWardrobeLimits } from '@/lib/hooks/use-queries';

interface AddWardrobeItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: WardrobeCollectionSummary[];
  onSuccess?: () => void;
  defaultCollectionId?: string | null;
  onUpgradeClick?: () => void;
}

export function AddWardrobeItemDialog({
  open,
  onOpenChange,
  collections,
  onSuccess,
  defaultCollectionId,
  onUpgradeClick,
}: AddWardrobeItemDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>('');
  const [pieceName, setPieceName] = React.useState('');
  const [category, setCategory] = React.useState<keyof typeof GarmentCategory | ''>('');
  const [collectionId, setCollectionId] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLimitError, setIsLimitError] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Check wardrobe limits
  const { data: limits } = useWardrobeLimits();

  const resetState = React.useCallback(() => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setPieceName('');
    setCategory('');
    setCollectionId('');
    setDescription('');
    setErrorMessage(null);
    setIsLimitError(false);
    setIsSaving(false);
  }, [previewUrl]);

  React.useEffect(() => {
    if (!open) {
      resetState();
    } else {
      setCollectionId(defaultCollectionId || '');
    }
  }, [open, resetState, defaultCollectionId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (nextFile) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type)) {
        setErrorMessage('Formatos aceitos: JPG, PNG ou WEBP');
        event.target.value = '';
        return;
      }
      if (nextFile.size > 20 * 1024 * 1024) {
        setErrorMessage('Limite de 20MB por imagem');
        event.target.value = '';
        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setFile(nextFile);
      setPreviewUrl(URL.createObjectURL(nextFile));
      setErrorMessage(null);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    // Check if user can add more items
    if (limits && !limits.canAddMore) {
      setIsLimitError(true);
      setErrorMessage(
        `Você atingiu o limite de ${limits.maxItems} peças do plano ${limits.planSlug === 'free' ? 'Gratuito' : limits.planSlug}. Faça upgrade do seu plano para adicionar mais peças.`
      );
      return;
    }

    if (!file) {
      setErrorMessage('Envie a foto da peça para continuar');
      return;
    }
    if (!category) {
      setErrorMessage('Selecione o tipo de peça');
      return;
    }
    if (!pieceName.trim()) {
      setErrorMessage('Informe um nome ou referência para a peça');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Descreva brevemente a peça');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const normalizedCategory = category as keyof typeof GarmentCategory;

      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Você precisa estar autenticado para adicionar peças');
      }

      const uploadResult = await uploadUserImage(supabase, user.id, file, file.name);
      if (!uploadResult.success || !uploadResult.path || !uploadResult.publicUrl) {
        throw new Error(uploadResult.error || 'Erro ao enviar imagem');
      }

      const garmentMetadata = {
        category: normalizedCategory,
        description,
      };

      const { data: uploadRecord, error: uploadError } = await supabase
        .from('user_uploads')
        .insert({
          user_id: user.id,
          file_path: uploadResult.path,
          file_name: pieceName,
          file_size: file.size,
          mime_type: file.type,
          status: 'ready', // Wardrobe items are ready immediately
          metadata: {
            garmentType: 'single',
            publicUrl: uploadResult.publicUrl,
            garmentMetadata,
          },
        })
        .select('id')
        .single();

      if (uploadError || !uploadRecord) {
        throw new Error(uploadError?.message || 'Não foi possível criar o upload');
      }

      const { error: wardrobeError } = await supabase.from('wardrobe_items').insert({
        user_id: user.id,
        upload_id: uploadRecord.id,
        collection_id: collectionId || null,
        category_slug: mapCategoryToSlug(normalizedCategory),
        garment_type: normalizedCategory,
        piece_type: null,
        tags: [],
        metadata: garmentMetadata,
      });

      if (wardrobeError) {
        throw new Error(wardrobeError.message);
      }

      resetState();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao salvar peça';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm px-4 py-8">
      <div className="w-full max-w-6xl rounded-[32px] border border-white/30 bg-white/90 p-6 shadow-[0_30px_120px_rgba(10,10,25,0.28)] backdrop-blur-xl">
        <div className="max-h-[90vh] overflow-y-auto pr-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#f1e7d3] bg-[#f7f2e7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#4b3f2f]">
                Nova peça
              </p>
              <h2 className="mt-2 font-freight text-2xl font-medium text-[#151515]">
                Adicione uma peça ao seu vestuário
              </h2>
              <p className="text-sm text-gray-500">
                Faça upload da foto, categorize rapidamente e salve para reutilizar nas gerações.
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-white/60 bg-white/70 p-2 text-gray-500 transition hover:text-gray-900"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
              {isLimitError && onUpgradeClick && (
                <button
                  onClick={() => {
                    onUpgradeClick();
                    onOpenChange(false);
                  }}
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#b58a4b] to-[#d0b16b] px-4 py-2 text-sm font-semibold text-white shadow transition hover:shadow-lg"
                >
                  Ver planos e fazer upgrade
                </button>
              )}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
            <div className="space-y-4 rounded-[28px] border border-white/40 bg-white/90 p-5 shadow-inner">
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                {previewUrl ? (
                  <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl">
                    <Image src={previewUrl} alt="Prévia da peça" fill className="object-contain" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <Image
                      src="/assets/images/generation-flow/clothing-items.png"
                      alt="Placeholder"
                      width={220}
                      height={160}
                      className="object-contain"
                    />
                    <p className="text-sm text-gray-500">
                      Use fotos com boa iluminação e fundo neutro para melhores resultados.
                    </p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <button
                  className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[#20202a] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#2b2b35]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? 'Trocar imagem' : 'Selecionar imagem'}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#20202a]">Nome / referência da peça</label>
                <input
                  type="text"
                  value={pieceName}
                  onChange={event => setPieceName(event.target.value)}
                  placeholder="Ex: Blusa canelada off-white"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-[#20202a] focus:ring-[#20202a]"
                />
              </div>
            </div>

            <div className="space-y-4 rounded-[28px] border border-white/40 bg-white/95 p-5 shadow-inner">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#20202a]">Tipo de peça</label>
                <select
                  value={category}
                  onChange={event => setCategory(event.target.value as keyof typeof GarmentCategory)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-[#20202a] focus:ring-[#20202a]"
                >
                  <option value="">Selecione</option>
                  {enumToOptions(GarmentCategory).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#20202a]">Coleção (opcional)</label>
                <select
                  value={collectionId}
                  onChange={event => setCollectionId(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-[#20202a] focus:ring-[#20202a]"
                >
                  <option value="">Sem coleção específica</option>
                  {collections.map(collection => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#20202a]">Descrição rápida</label>
                <textarea
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Ex: Blusa canelada em malha leve, gola alta e mangas longas."
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-[#20202a] focus:ring-[#20202a]"
                />
              </div>

            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-2xl border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-600"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="rounded-2xl bg-gradient-to-r from-[#b58a4b] to-[#d0b16b] px-6 py-2 text-sm font-semibold text-white shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d0b16b] disabled:opacity-60"
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar peça no vestuário'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

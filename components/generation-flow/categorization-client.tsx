'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProgressSteps } from './progress-steps';
import { CategorizationLoading } from './categorization-loading';
import { ChatButton } from '@/components/shared/chat-button';
import { createClient } from '@/lib/supabase/client';
import type { GarmentMetadata } from '@/lib/generation-flow/garment-metadata-types';
import {
  GarmentCategory,
  GarmentColor,
  GarmentOccasion,
  GarmentPattern,
  enumToOptions,
} from '@/lib/generation-flow/garment-metadata-types';
import type { WardrobeCollectionSummary } from '@/types/wardrobe';

interface Upload {
  id: string;
  file_path: string;
  metadata: {
    publicUrl: string;
    pieceType: 'upper' | 'lower';
    garmentType: 'single' | 'outfit';
  };
}

interface CategorizationClientProps {
  uploads: Upload[];
  userId: string;
  categorySlug?: string | null;
  collections: WardrobeCollectionSummary[];
  allUploadIds?: string[];
}

interface CategorizationState {
  uploadId: string;
  metadata: GarmentMetadata | null;
  isAnalyzing: boolean;
  error: string | null;
  collectionId: string | null;
}

export const CategorizationClient: React.FC<CategorizationClientProps> = ({
  uploads,
  userId,
  categorySlug,
  collections,
  allUploadIds,
}) => {
  const router = useRouter();
  const [categorizations, setCategorizations] = React.useState<CategorizationState[]>(
    uploads.map(u => ({
      uploadId: u.id,
      metadata: null,
      isAnalyzing: true,
      error: null,
      collectionId: null,
    }))
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [currentPieceIndex, setCurrentPieceIndex] = React.useState(0);

  // Call Gemini AI for all uploads on mount
  React.useEffect(() => {
    const analyzeUploads = async () => {
      const promises = uploads.map(async (upload, index) => {
        try {
          const response = await fetch('/api/ai/categorize-garment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: upload.metadata.publicUrl,
              pieceType: upload.metadata.pieceType,
            }),
          });

          const result = await response.json();

          setCategorizations(prev =>
            prev.map((cat, i) =>
              i === index
                ? {
                  ...cat,
                  metadata: result.success ? result.metadata : null,
                  isAnalyzing: false,
                  error: result.success ? null : result.error,
                }
                : cat
            )
          );
        } catch (error) {
          setCategorizations(prev =>
            prev.map((cat, i) =>
              i === index
                ? {
                  ...cat,
                  isAnalyzing: false,
                  error: 'Erro ao analisar peça',
                }
                : cat
            )
          );
        }
      });

      await Promise.all(promises);
    };

    analyzeUploads();
  }, [uploads]);

  const handleMetadataChange = (field: keyof GarmentMetadata, value: any) => {
    setCategorizations(prev =>
      prev.map((cat, i) =>
        i === currentPieceIndex && cat.metadata
          ? { ...cat, metadata: { ...cat.metadata, [field]: value } }
          : cat
      )
    );
  };

  const handleCollectionChange = (collectionId: string | null) => {
    setCategorizations(prev =>
      prev.map((cat, i) =>
        i === currentPieceIndex ? { ...cat, collectionId } : cat
      )
    );
  };

  const handleBack = () => {
    // If viewing a piece beyond the first, go to previous piece
    if (currentPieceIndex > 0) {
      setCurrentPieceIndex(currentPieceIndex - 1);
    } else {
      // Go back to upload step
      router.back();
    }
  };

  const handleNext = async () => {
    // If there are more pieces to review, show the next piece
    if (currentPieceIndex < categorizations.length - 1) {
      setCurrentPieceIndex(currentPieceIndex + 1);
      return;
    }

    // All pieces reviewed, save and navigate to next step
    setIsSaving(true);

    try {
      const supabase = createClient();

      // Prepare categorizations to save
      const categorizationsToSave = categorizations
        .filter(cat => cat.metadata !== null)
        .map(cat => ({
          uploadId: cat.uploadId,
          metadata: cat.metadata!,
        }));

      // Save all categorizations
      const { saveCategorizationsBatch } = await import('@/lib/generation-flow/save-categorization');
      const result = await saveCategorizationsBatch(supabase as any, categorizationsToSave);

      if (!result.success) {
        console.error('Failed to save categorizations:', result.error);
        alert(result.error || 'Erro ao salvar categorizações');
        setIsSaving(false);
        return;
      }

      console.log('✅ Categorizations saved successfully');

      try {
        const wardrobePayloads = categorizations
          .filter(cat => cat.metadata)
          .map(cat => ({
            uploadId: cat.uploadId,
            collectionId: cat.collectionId || null,
          }));

        await Promise.all(
          wardrobePayloads.map(async (payload) => {
            try {
              const response = await fetch('/api/wardrobe/save-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  uploadIds: [payload.uploadId],
                  collectionId: payload.collectionId,
                }),
              });

              if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                console.warn('Erro ao salvar no vestuário:', errorBody?.error || response.statusText);
              }
            } catch (wardrobeError) {
              console.warn('Wardrobe request error', wardrobeError);
            }
          })
        );
      } catch (wardrobeError) {
        console.warn('Erro ao sincronizar com o vestuário:', wardrobeError);
      }

      // Navigate to next step (poses selection) with upload IDs
      const nextStepIds = (allUploadIds && allUploadIds.length > 0 ? allUploadIds : uploads.map(u => u.id));
      const uploadIds = nextStepIds.join(',');
      const params = new URLSearchParams();
      params.set('ids', uploadIds);
      if (categorySlug) {
        params.set('category', categorySlug);
      }
      router.push(`/criar/poses?${params.toString()}`);
    } catch (error) {
      console.error('Error saving categorizations:', error);
      alert('Erro inesperado ao salvar. Tente novamente.');
      setIsSaving(false);
    }
  };

  const isAnalyzing = categorizations.some(c => c.isAnalyzing);
  // Can proceed if current piece has metadata and no error
  const currentCat = categorizations[currentPieceIndex];
  const canProceed = currentCat && currentCat.metadata !== null && !currentCat.error;

  const translateEnumLabel = React.useCallback(
    <T extends Record<string, string>>(enumObject: T, value: string) => {
      if (!value) return '';
      return enumObject[value as keyof T] || value;
    },
    []
  );

  return (
    <>
      <ProgressSteps
        currentStep={2}
        canProceed={canProceed}
        isLoading={isSaving}
        onNext={handleNext}
        onBack={handleBack}
      />

      <main className="px-8 py-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        {isAnalyzing ? (
          <CategorizationLoading count={uploads.length} />
        ) : (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-2 mb-8">
              <h2 className="font-freight font-medium text-3xl text-[#20202a]">
                Categorização das Peças
              </h2>
              <p className="font-inter text-base text-gray-600">
                Revise e ajuste os detalhes identificados pela IA
              </p>
              {categorizations.length > 1 && (
                <p className="font-inter text-sm text-gray-500">
                  Peça {currentPieceIndex + 1} de {categorizations.length}
                </p>
              )}
            </div>

            {/* Show only current piece */}
            {(() => {
              const cat = categorizations[currentPieceIndex];
              const index = currentPieceIndex;
              return (
                <div
                  key={cat.uploadId}
                  className="group relative bg-white bg-noise rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.04),0_20px_48px_rgba(0,0,0,0.02)] transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-gray-200"
                >
                  <div className="flex gap-8 p-8">
                    {/* Image Preview - Plataforma Elevada */}
                    <div className="relative w-80 h-96 flex-shrink-0 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 p-px shadow-[0_4px_12px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.06)] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.12),0_16px_48px_rgba(0,0,0,0.08)] transition-all duration-300">
                      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white">
                        {/* Radial gradient overlay para foco */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-100/30 via-transparent to-transparent pointer-events-none" />
                        <Image
                          src={uploads[index].metadata.publicUrl}
                          alt={`Peça ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {/* Badge com backdrop blur médio */}
                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-xl font-inter font-semibold text-sm shadow-lg">
                          Peça {index + 1} · {uploads[index].metadata.pieceType === 'upper' ? '👕 Superior' : '👖 Inferior'}
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#20202a] uppercase tracking-wide">
                            <svg className="w-5 h-5 text-[#20202a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-6 4l5-5m0 0l-5-5m5 5H9" />
                            </svg>
                            Vincular a uma coleção (opcional)
                          </label>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <select
                              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl font-inter font-medium text-[#20202a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.04),0_0_0_4px_rgba(32,32,42,0.1)] focus:border-[#20202a] transition-all cursor-pointer bg-white hover:border-gray-300"
                              value={cat.collectionId ?? ''}
                              onChange={(event) => {
                                const value = event.target.value;
                                handleCollectionChange(value || null);
                              }}
                            >
                              <option value="">Sem coleção específica</option>
                              {collections.map((collection) => (
                                <option key={collection.id} value={collection.id}>
                                  {collection.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500">
                              Essas coleções aparecem no pop-up do vestuário.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Fields */}
                    {cat.metadata && (
                      <div className="flex-1 space-y-6">
                        {/* Category */}
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#20202a] uppercase tracking-wide">
                            <svg className="w-5 h-5 text-[#20202a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Tipo de Peça
                          </label>
                          <select
                            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl font-inter font-medium text-[#20202a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.04),0_0_0_4px_rgba(32,32,42,0.1)] focus:border-[#20202a] transition-all cursor-pointer bg-white hover:border-gray-300"
                            value={cat.metadata.category}
                            onChange={(e) => handleMetadataChange('category', e.target.value as GarmentCategory)}
                          >
                            {enumToOptions(GarmentCategory).map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#20202a] uppercase tracking-wide">
                            <svg className="w-5 h-5 text-[#20202a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            Descrição
                          </label>
                          <textarea
                            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl font-inter text-[#20202a] leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.04),0_0_0_4px_rgba(32,32,42,0.1)] focus:border-[#20202a] transition-all resize-none bg-white hover:border-gray-300"
                            rows={4}
                            value={cat.metadata.description}
                            onChange={(e) => handleMetadataChange('description', e.target.value)}
                          />
                        </div>

                        {/* Colors, Occasions, Patterns - Grid melhorado */}
                        <div className="grid grid-cols-3 gap-6 pt-2">
                          {/* Colors */}
                          <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-[#20202a] uppercase tracking-wide">
                              <svg className="w-5 h-5 text-[#20202a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                              </svg>
                              Cores
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {cat.metadata.colors.map((color, idx) => (
                                <span
                                  key={`${color}-${idx}`}
                                  className="inline-flex items-center px-3.5 py-1.5 bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200/80 text-gray-700 rounded-full text-xs font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:from-gray-150 hover:to-gray-100 transition-all"
                                >
                                  {translateEnumLabel(GarmentColor, color)}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Occasions */}
                          <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-[#20202a] uppercase tracking-wide">
                              <svg className="w-5 h-5 text-[#20202a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Ocasiões
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {cat.metadata.occasions.map((occ, idx) => (
                                <span
                                  key={`${occ}-${idx}`}
                                  className="inline-flex items-center px-3.5 py-1.5 bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200/80 text-gray-700 rounded-xl text-xs font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:from-gray-150 hover:to-gray-100 transition-all"
                                >
                                  {translateEnumLabel(GarmentOccasion, occ)}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Patterns */}
                          <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-[#20202a] uppercase tracking-wide">
                              <svg className="w-5 h-5 text-[#20202a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                              </svg>
                              Padrões
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {cat.metadata.patterns.map((pat, idx) => (
                                <span
                                  key={`${pat}-${idx}`}
                                  className="inline-flex items-center px-3.5 py-1.5 bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200/80 text-gray-700 rounded-lg text-xs font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:from-gray-150 hover:to-gray-100 transition-all"
                                >
                                  {translateEnumLabel(GarmentPattern, pat)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {cat.error && (
                      <div className="flex-1 flex items-center justify-center p-8 bg-red-50 rounded-2xl border-2 border-red-200">
                        <div className="text-center space-y-3">
                          <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="text-red-700 font-semibold">{cat.error}</p>
                          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                            Tentar Novamente
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      <ChatButton onClick={() => { }} />
    </>
  );
};

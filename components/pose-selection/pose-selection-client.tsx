'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ProgressSteps } from '@/components/generation-flow/progress-steps';
import { GenderFilter } from './gender-filter';
import { AgeFilter } from './age-filter';
import { GarmentFilter } from './garment-filter';
import { PoseCard } from './pose-card';
import { PoseDetailModal } from './pose-detail-modal';
import { OriginalGarmentsDisplay } from './original-garments-display';
import { usePoseFilters } from '@/lib/generation-flow/usePoseFilters';
import { usePoseSelection } from '@/lib/generation-flow/usePoseSelection';
import { savePoseSelection } from '@/lib/generation-flow/save-pose-selection';
import type { PoseMetadata } from '@/lib/generation-flow/pose-types';
import { ModelGender, AgeRange, ModelEthnicity, PoseCategory } from '@/lib/generation-flow/pose-types';
import { createClient } from '@/lib/supabase/client';

interface PoseSelectionClientProps {
  uploadIds: string[];
  categorySlug?: string | null;
}

export const PoseSelectionClient: React.FC<PoseSelectionClientProps> = ({ uploadIds, categorySlug }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for detail modal
  const [modalPose, setModalPose] = React.useState<PoseMetadata | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [userModelPoses, setUserModelPoses] = React.useState<PoseMetadata[]>([]);

  // State for sidebar toggle (mobile/tablet)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // State for garment images in bottom bar
  const [garmentImages, setGarmentImages] = React.useState<Array<{ id: string; imageUrl: string }>>([]);
  const normalizedCategory = React.useMemo(
    () => categorySlug?.toLowerCase() ?? null,
    [categorySlug]
  );
  const showOriginalPoseOption = normalizedCategory === 'roupa-no-corpo';

  // Filter and selection hooks
  const {
    poses,
    isLoading,
    error,
    filters,
    setGenders,
    setAgeRange,
    setGarmentCategories,
    resetFilters,
  } = usePoseFilters();

  const {
    selectedPoseIds,
    isSelected,
    getSelectionIndex,
    togglePoseSelection,
    selectionCount,
  } = usePoseSelection(uploadIds);

  const originalPose = React.useMemo<PoseMetadata | null>(() => {
    if (!showOriginalPoseOption || garmentImages.length === 0) {
      return null;
    }
    const firstImage = garmentImages[0];
    if (!firstImage?.imageUrl) {
      return null;
    }
    return {
      id: `original:${firstImage.id}`,
      imageUrl: firstImage.imageUrl,
      gender: ModelGender.NON_BINARY,
      ageMin: 20,
      ageMax: 40,
      ageRange: AgeRange.TWENTIES,
      ethnicity: ModelEthnicity.MIXED,
      poseCategory: PoseCategory.STANDING_CASUAL,
      garmentCategories: [],
      name: 'Pose original',
      description: 'Usar a pose original da sua foto de referência',
      tags: ['original'],
      createdAt: new Date().toISOString(),
    };
  }, [showOriginalPoseOption, garmentImages]);

  const displayedPoses = React.useMemo(() => {
    let combined = poses;

    if (userModelPoses.length > 0) {
      combined = [...userModelPoses, ...combined];
    }

    if (originalPose) {
      const filtered = combined.filter((pose) => pose.id !== originalPose.id);
      return [originalPose, ...filtered];
    }

    return combined;
  }, [poses, originalPose, userModelPoses]);

  // Fetch garment images for bottom bar preview
  React.useEffect(() => {
    const fetchGarments = async () => {
      if (!uploadIds || uploadIds.length === 0) return;

      try {
        const supabase = createClient();

        const { data, error } = await (supabase
          .from('user_uploads') as any)
          .select('id, metadata')
          .in('id', uploadIds)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching garment images:', error);
          return;
        }

        if (data) {
          const uploadMap = new Map(
            data.map((upload: any) => [upload.id, upload.metadata?.publicUrl || ''])
          );
          const orderedImages = uploadIds
            .map((id) => {
              const imageUrl = uploadMap.get(id);
              if (!imageUrl) return null;
              return { id, imageUrl };
            })
            .filter((g): g is { id: string; imageUrl: string } => Boolean(g));

          setGarmentImages(orderedImages);
        }
      } catch (error) {
        console.error('Error fetching garments:', error);
      }
    };

    fetchGarments();
  }, [uploadIds]);

  // Fetch user-specific saved models
  React.useEffect(() => {
    const fetchUserModels = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await (supabase
          .from('user_models') as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching user models:', error);
          return;
        }

        if (data) {
          const mapped: PoseMetadata[] = data.map((row: any) => {
            const gender =
              Object.values(ModelGender).includes(row.gender as ModelGender)
                ? (row.gender as ModelGender)
                : ModelGender.NON_BINARY;
            const ageRange =
              Object.values(AgeRange).includes(row.age_range as AgeRange)
                ? (row.age_range as AgeRange)
                : AgeRange.TWENTIES;
            const ethnicity =
              Object.values(ModelEthnicity).includes(row.ethnicity as ModelEthnicity)
                ? (row.ethnicity as ModelEthnicity)
                : ModelEthnicity.MIXED;
            const poseCategory =
              Object.values(PoseCategory).includes(row.pose_category as PoseCategory)
                ? (row.pose_category as PoseCategory)
                : PoseCategory.STANDING_CASUAL;

            return {
              id: `user-model:${row.id}`,
              userModelId: row.id,
              imageUrl: row.image_url,
              gender,
              ageMin: row.age_min || 20,
              ageMax: row.age_max || 40,
              ageRange,
              ethnicity,
              poseCategory,
              garmentCategories: row.garment_categories || [],
              name: row.model_name || 'Modelo salvo',
              description: 'Modelo personalizado salvo por você',
              tags: ['Meu modelo'],
              createdAt: row.created_at,
              isUserModel: true,
              modelAttributes: {
                heightCm: row.height_cm,
                weightKg: row.weight_kg,
                hairColor: row.hair_color,
                facialExpression: row.facial_expression,
              },
              metadata: row.metadata,
            };
          });

          setUserModelPoses(mapped);
        }
      } catch (error) {
        console.error('Error loading user models:', error);
      }
    };

    fetchUserModels();
  }, []);

  // Handlers
  const handleViewDetails = (pose: PoseMetadata) => {
    setModalPose(pose);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setModalPose(null), 200); // Clear after animation
  };

  const handleToggleSelectFromModal = (poseId: string) => {
    togglePoseSelection(poseId);
  };

  const handleBack = () => {
    router.back();
  };

  const handleNext = async () => {
    if (selectionCount === 0) {
      alert('Selecione pelo menos 1 pose para continuar');
      return;
    }

    setIsSaving(true);

    try {
      // Save pose selection to database
      const result = await savePoseSelection(uploadIds, selectedPoseIds);

      if (!result.success) {
        alert(result.error || 'Erro ao salvar seleção de poses');
        setIsSaving(false);
        return;
      }

      // Navigate to personalization step
      const params = new URLSearchParams();
      params.set('ids', JSON.stringify(uploadIds));
      if (categorySlug) {
        params.set('category', categorySlug);
      }
      router.push(`/criar/personalizacao?${params.toString()}`);
    } catch (error) {
      console.error('Error saving pose selection:', error);
      alert('Erro ao salvar seleção de poses');
      setIsSaving(false);
    }
  };

  // Calculate active filters count
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.genders.length > 0 && filters.genders.length < 2) count++;
    if (filters.ageMin !== 1 || filters.ageMax !== 80) count++;
    if (filters.garmentCategories.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <>
      {/* Progress Steps Navbar */}
      <ProgressSteps
        currentStep={3}
        canProceed={selectionCount > 0}
        isLoading={isSaving}
        onNext={handleNext}
        onBack={handleBack}
      />

      <div className="min-h-screen bg-[#fafafa]">
        <div className="px-8 py-4">
          {/* Header com título e filtros */}
          <div className="mb-6">
            <div className="mb-4">
              <h1 className="font-inter font-bold text-[30px] leading-[1.2] text-gray-900 mb-1">
                Galeria de poses
              </h1>
              <p className="font-inter font-medium text-base leading-5 text-gray-500">
                Selecione 1 pose
              </p>
            </div>

            {/* Filter row com botão Filtros */}
            <div className="flex items-center gap-5">
              {/* Botão Filtros funcional com toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden px-4 py-2 bg-[#f2f4f5] border border-[#cacaca] rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 4h12M4 8h8M6 12h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-inter font-medium text-sm">Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-[#20202a] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

        <div className="grid lg:grid-cols-[280px,1fr] gap-6">
          {/* Sidebar - Filters */}
          <aside
            className={`
              fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-auto
              transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              space-y-6
            `}
          >
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
              <div
                className="lg:hidden fixed inset-0 bg-black/50 -z-10"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar Content */}
            <div className="lg:relative h-full lg:h-auto bg-[#fafafa] lg:bg-transparent p-4 lg:p-0">
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-inter font-bold text-lg text-[#111827]">Filtros</h2>
                {(filters.garmentCategories.length > 0 ||
                  filters.genders.length < 2 ||
                  filters.ageMin !== 1 ||
                  filters.ageMax !== 80) && (
                  <button
                    onClick={resetFilters}
                    className="font-inter font-medium text-sm text-[#6b7280] hover:text-[#111827] transition-colors"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <GenderFilter selectedGenders={filters.genders} onGenderChange={setGenders} />
                <div className="border-t border-gray-200 pt-6">
                  <AgeFilter
                    ageMin={filters.ageMin}
                    ageMax={filters.ageMax}
                    onAgeChange={setAgeRange}
                  />
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <GarmentFilter
                    selectedCategories={filters.garmentCategories}
                    onCategoryChange={setGarmentCategories}
                  />
                </div>

                {/* Imagens Originais das Roupas - Movido para sidebar */}
                <div className="border-t border-gray-200 pt-6">
                  <OriginalGarmentsDisplay uploadIds={uploadIds} />
                </div>
              </div>
            </div>
            </div>
          </aside>

          {/* Main Content - Pose Grid */}
          <main>
            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="font-inter font-medium text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  >
                    <div className="aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && displayedPoses.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 12L20 20M20 12L12 20"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="font-inter font-semibold text-lg text-[#111827] mb-2">
                  Nenhuma pose encontrada
                </h3>
                <p className="font-inter text-sm text-[#6b7280] mb-6">
                  Tente ajustar os filtros para ver mais resultados
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 bg-[#20202a] text-white rounded-lg font-inter font-medium text-sm hover:bg-[#2a2a34] transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {/* Pose Grid */}
            {!isLoading && !error && displayedPoses.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5 gap-[29px]">
                  {displayedPoses.map((pose) => (
                    <PoseCard
                      key={pose.id}
                      pose={pose}
                      isSelected={isSelected(pose.id)}
                      selectionIndex={getSelectionIndex(pose.id)}
                      onSelect={togglePoseSelection}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>

                {/* Result count */}
                <div className="mt-6 text-center">
                  <p className="font-inter text-sm text-[#6b7280]">
                    Mostrando {displayedPoses.length} {displayedPoses.length === 1 ? 'pose' : 'poses'}
                  </p>
                </div>
              </>
            )}
          </main>
        </div>

        {/* Fixed Bottom Bar - Apple-style Glassmorphism com thumbnails */}
        {selectionCount > 0 && (() => {
          // Get selected pose
          const selectedPose = poses.find((p) => selectedPoseIds.includes(p.id));

          return (
            <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 md:px-6 md:pb-8">
              {/* Glassmorphism container com gradiente sutil - flutuante */}
              <div className="relative mx-auto max-w-5xl bg-gradient-to-t from-white/50 via-white/40 to-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl">
                <div className="px-4 py-3.5 md:px-6 md:py-4">
                  <div className="flex items-center justify-between gap-6">
                    {/* Left side - Thumbnails com descrição */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {/* Selected Pose Thumbnail com opção de remover */}
                        {selectedPose && (
                          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm flex-shrink-0 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5 group">
                            <Image
                              src={selectedPose.imageUrl}
                              alt="Pose selecionada"
                              fill
                              className="object-cover transition-all group-hover:brightness-75"
                              sizes="64px"
                            />
                            {/* Botão X para remover seleção - aparece no hover */}
                            <button
                              onClick={() => togglePoseSelection(selectedPose.id)}
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm"
                              aria-label="Remover pose selecionada"
                            >
                              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 14 14"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M1 1L13 13M13 1L1 13"
                                    stroke="#111827"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            </button>
                          </div>
                        )}

                        {/* Garment Thumbnails */}
                        {garmentImages.map((garment) => (
                          <div
                            key={garment.id}
                            className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm flex-shrink-0 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
                          >
                            <Image
                              src={garment.imageUrl}
                              alt="Roupa"
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Texto descritivo sutil */}
                      <div className="hidden md:flex flex-col gap-0.5">
                        <p className="font-inter font-semibold text-sm text-gray-900/90">
                          Seleção completa
                        </p>
                        <p className="font-inter text-xs text-gray-600/80">
                          {garmentImages.length} {garmentImages.length === 1 ? 'peça' : 'peças'} • 1 pose
                        </p>
                      </div>
                    </div>

                    {/* Right side - Continue Button */}
                    <button
                      onClick={handleNext}
                      disabled={isSaving}
                      className="px-8 py-3.5 bg-[#20202a] text-white rounded-2xl font-inter font-semibold text-base hover:bg-[#2a2a34] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                    >
                      {isSaving && (
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      )}
                      {isSaving ? 'Salvando...' : 'Continuar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>

      {/* Detail Modal */}
      <PoseDetailModal
        pose={modalPose}
        isOpen={isModalOpen}
        isSelected={modalPose ? isSelected(modalPose.id) : false}
        onClose={handleCloseModal}
        onToggleSelect={handleToggleSelectFromModal}
      />
    </>
  );
};

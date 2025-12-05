'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProgressSteps } from '@/components/generation-flow/progress-steps';
// Height/Weight sliders removed - body size (P, M, G, Plus Size) controls this now
import { FacialExpressionPicker } from '@/components/generation-flow/facial-expression-picker';
import { HairColorPicker } from '@/components/generation-flow/hair-color-picker';
// AI Tools panel hidden for MVP
// import { AIToolsPanel } from '@/components/generation-flow/ai-tools-panel';
import { FormatSelector } from '@/components/generation-flow/format-selector';
import { PersonalizationCarousel, type CarouselSection } from '@/components/generation-flow/personalization-carousel';
import { useCustomization } from '@/lib/generation-flow/useCustomization';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/types/database.types';
import type { ImageFormatPreset } from '@/lib/generation-flow/image-formats';
import type { PoseMetadata } from '@/lib/generation-flow/pose-types';
import { FloatingPoseBar } from '@/components/generation-flow/floating-pose-bar';
import { BackgroundStep } from '@/components/generation-flow/background-step';
import { MainHeader } from '@/components/shared';
import { ModelCharacteristicsSelector } from '@/components/chat/model-characteristics-selector';

type BackgroundPreset = Tables<'background_presets'>;

const POSE_SELECTION_STORAGE_KEY = 'fotomodel_pose_selection';

// Define carousel sections
// Note: AI tools section hidden for MVP
const CAROUSEL_SECTIONS: CarouselSection[] = [
  {
    id: 'format',
    title: 'Formato de Saída',
    subtitle: 'Escolha o formato ideal para sua plataforma'
  },
  {
    id: 'model-profile',
    title: 'Perfil do Modelo',
    subtitle: 'Defina sexo, faixa etária e tipo de corpo'
  },
  {
    id: 'expression',
    title: 'Expressão Facial',
    subtitle: 'Escolha a expressão para a modelo'
  },
  {
    id: 'hair',
    title: 'Cor do Cabelo',
    subtitle: 'Defina a cor do cabelo (opcional)'
  },
  {
    id: 'background',
    title: 'Cenário & Background',
    subtitle: 'Escolha um preset, faça upload ou peça para a IA criar'
  },
];

function PersonalizacaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uploadIdsParam = searchParams.get('ids');
  const categorySlug = searchParams.get('category');

  const [uploadIds, setUploadIds] = React.useState<string[]>([]);
  const [backgrounds, setBackgrounds] = React.useState<BackgroundPreset[]>([]);
  const [formats, setFormats] = React.useState<ImageFormatPreset[]>([]);
  const [selectedPoses, setSelectedPoses] = React.useState<PoseMetadata[]>([]);
  const [garmentImages, setGarmentImages] = React.useState<Array<{ id: string; imageUrl: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const carouselWrapperRef = React.useRef<HTMLDivElement>(null);
  const hasScrolledRef = React.useRef(false);
  const [headerCredits, setHeaderCredits] = React.useState<number>(0);

  const customization = useCustomization(uploadIds, CAROUSEL_SECTIONS.length);

  // Parse upload IDs from URL
  React.useEffect(() => {
    if (uploadIdsParam) {
      try {
        const ids = JSON.parse(decodeURIComponent(uploadIdsParam));
        setUploadIds(Array.isArray(ids) ? ids : [ids]);
      } catch (error) {
        console.error('Error parsing upload IDs:', error);
        router.push('/criar');
      }
    } else {
      router.push('/criar');
    }
  }, [uploadIdsParam, router]);

  // Fetch data from database
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // Fetch backgrounds
        const { data: bgData, error: bgError } = await supabase
          .from('background_presets')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (bgError) throw bgError;
        setBackgrounds(bgData || []);

        // Fetch image formats
        const { data: formatData, error: formatError } = await (supabase
          .from('image_format_presets') as any)
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (formatError) throw formatError;
        setFormats(formatData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch pose selection and garment images
  React.useEffect(() => {
    const fetchPoseSelection = async () => {
      if (!uploadIds || uploadIds.length === 0) return;

      try {
        const supabase = createClient();

        // 1. Read pose selection from localStorage
        const stored = localStorage.getItem(POSE_SELECTION_STORAGE_KEY);
        if (!stored) return;

        const poseSelection = JSON.parse(stored);
        const { poseIds, uploadIds: storedUploadIds } = poseSelection;

        // Verify upload IDs match
        if (
          !storedUploadIds ||
          JSON.stringify(storedUploadIds.sort()) !== JSON.stringify(uploadIds.sort())
        ) {
          return;
        }

        // 2. Fetch actual pose data from database
        if (poseIds && poseIds.length > 0) {
          const allPoses: PoseMetadata[] = [];

          // Separate different types of pose IDs
          const regularPoseIds: string[] = [];
          const userModelIds: string[] = [];
          const originalPoseIds: string[] = [];

          for (const poseId of poseIds) {
            if (typeof poseId === 'string') {
              if (poseId.startsWith('user-model:')) {
                userModelIds.push(poseId.replace('user-model:', ''));
              } else if (poseId.startsWith('original:')) {
                originalPoseIds.push(poseId.replace('original:', ''));
              } else {
                regularPoseIds.push(poseId);
              }
            } else {
              regularPoseIds.push(poseId);
            }
          }

          // Fetch regular poses from model_poses table
          if (regularPoseIds.length > 0) {
            const { data: posesData, error: posesError } = await (supabase
              .from('model_poses') as any)
              .select('*')
              .in('id', regularPoseIds)
              .eq('is_active', true);

            if (posesError) {
              console.error('Error fetching model_poses:', posesError);
            } else if (posesData) {
              const mappedPoses: PoseMetadata[] = posesData.map((pose: any) => ({
                id: pose.id,
                imageUrl: pose.image_url,
                gender: pose.gender,
                ageMin: pose.age_min,
                ageMax: pose.age_max,
                ageRange: pose.age_range,
                ethnicity: pose.ethnicity,
                poseCategory: pose.pose_category,
                garmentCategories: pose.garment_categories || [],
                name: pose.name,
                description: pose.description,
                tags: pose.tags || [],
                createdAt: pose.created_at,
              }));
              allPoses.push(...mappedPoses);
            }
          }

          // Fetch user models from user_models table
          if (userModelIds.length > 0) {
            const { data: userModelsData, error: userModelsError } = await (supabase
              .from('user_models') as any)
              .select('*')
              .in('id', userModelIds);

            if (userModelsError) {
              console.error('Error fetching user_models:', userModelsError);
            } else if (userModelsData) {
              const mappedUserModels: PoseMetadata[] = userModelsData.map((model: any) => ({
                id: `user-model:${model.id}`,
                imageUrl: model.image_url,
                gender: model.gender || 'FEMALE',
                ageMin: model.age_min || 20,
                ageMax: model.age_max || 40,
                ageRange: model.age_range || 'TWENTIES',
                ethnicity: model.ethnicity || 'MIXED',
                poseCategory: model.pose_category || 'standing',
                garmentCategories: model.garment_categories || [],
                name: model.model_name || 'Modelo Personalizado',
                description: 'Modelo personalizado salvo',
                tags: [],
                createdAt: model.created_at,
              }));
              allPoses.push(...mappedUserModels);
            }
          }

          // Fetch original poses from user_uploads metadata
          if (originalPoseIds.length > 0) {
            const { data: originalsData, error: originalsError } = await (supabase
              .from('user_uploads') as any)
              .select('id, metadata')
              .in('id', originalPoseIds);

            if (originalsError) {
              console.error('Error fetching original poses:', originalsError);
            } else if (originalsData) {
              const mappedOriginals: PoseMetadata[] = originalsData.map((upload: any) => ({
                id: `original:${upload.id}`,
                imageUrl: upload.metadata?.publicUrl || '',
                gender: 'FEMALE',
                ageMin: 20,
                ageMax: 40,
                ageRange: 'TWENTIES',
                ethnicity: 'MIXED',
                poseCategory: 'original_reference',
                garmentCategories: [],
                name: 'Pose Original',
                description: 'Pose original enviada pelo usuário',
                tags: ['original'],
                createdAt: upload.metadata?.created_at || new Date().toISOString(),
              }));
              allPoses.push(...mappedOriginals);
            }
          }

          // Set all fetched poses
          if (allPoses.length > 0) {
            setSelectedPoses(allPoses);
          }
        }

        // 3. Fetch garment images
        const { data: uploadsData, error: uploadsError } = await (supabase
          .from('user_uploads') as any)
          .select('id, file_path, metadata')
          .in('id', uploadIds)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (uploadsError) {
          console.error('Error fetching garment images:', uploadsError);
        } else if (uploadsData) {
          const images = uploadsData
            .map((upload: any) => ({
              id: upload.id,
              // For Bubble uploads, file_path is already a complete URL
              // For Supabase uploads, use metadata.publicUrl
              imageUrl: upload.metadata?.publicUrl || upload.file_path || '',
            }))
            .filter((g: any) => g.imageUrl);

          setGarmentImages(images);
        }
      } catch (error) {
        console.error('Error fetching pose selection:', error);
      }
    };

    fetchPoseSelection();
  }, [uploadIds]);

  // Fetch credits for header
  React.useEffect(() => {
    const fetchCredits = async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) return;

      const { data, error } = await (supabase
        .from('users') as any)
        .select('credits')
        .eq('id', userData.user.id)
        .single();

      if (!error && data?.credits !== undefined) {
        setHeaderCredits(data.credits);
      }
    };

    fetchCredits();
  }, []);

  // Intelligent scroll to keep user focused on current section
  React.useEffect(() => {
    if (!carouselWrapperRef.current) return;
    if (!hasScrolledRef.current) {
      hasScrolledRef.current = true;
      return;
    }
    carouselWrapperRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [customization.currentSection]);

  // Handle back navigation
  const handleBack = () => {
    // If on first section of carousel, go back to poses page
    if (customization.currentSection === 0) {
      const params = new URLSearchParams();
      if (uploadIdsParam) {
        params.set('ids', uploadIdsParam);
      }
      if (categorySlug) {
        params.set('category', categorySlug);
      }
      const query = params.toString();
      router.push(`/criar/poses${query ? `?${query}` : ''}`);
    } else {
      // Otherwise go to previous section in carousel
      customization.prevSection();
    }
  };

  // Handle skip (go directly to results without customization)
  const handleSkip = async () => {
    const params = new URLSearchParams();
    if (uploadIdsParam) {
      params.set('ids', uploadIdsParam);
    }
    if (categorySlug) {
      params.set('category', categorySlug);
    }
    router.push(`/criar/resultado${params.toString() ? `?${params.toString()}` : ''}`);
  };

  // Handle next - advances carousel or goes to results
  const handleNext = async () => {
    // If not on last section, just advance carousel
    if (customization.currentSection < CAROUSEL_SECTIONS.length - 1) {
      customization.nextSection();
      return;
    }

    // On last section, save and go to results
    try {
      setIsSaving(true);
      const supabase = createClient();

      // Save customization to database for each upload
      for (const uploadId of uploadIds) {
        // 1. Save generation_customizations
        const { data: existing } = await (supabase
          .from('generation_customizations') as any)
          .select('id')
          .eq('upload_id', uploadId)
          .single();

        if (existing) {
          // Update existing
          await (supabase.from('generation_customizations') as any).update({
            model_height_cm: customization.height,
            model_weight_kg: customization.weight,
            facial_expression: customization.facialExpression,
            metadata: JSON.parse(JSON.stringify({
              hair_color: customization.hairColor,
              ai_tools: customization.aiTools,
              model_characteristics: customization.modelCharacteristics,
            })),
          }).eq('id', existing.id);
        } else {
          // Insert new
          await (supabase.from('generation_customizations') as any).insert({
            upload_id: uploadId,
            model_height_cm: customization.height,
            model_weight_kg: customization.weight,
            facial_expression: customization.facialExpression,
            metadata: JSON.parse(JSON.stringify({
              hair_color: customization.hairColor,
              ai_tools: customization.aiTools,
              model_characteristics: customization.modelCharacteristics,
            })),
          });
        }

        // 2. Save format selection (NEW)
        if (customization.selectedFormat) {
          const { data: existingFormat } = await (supabase
            .from('generation_format_selections') as any)
            .select('id')
            .eq('upload_id', uploadId)
            .single();

          if (existingFormat) {
            // Update existing format
            await (supabase.from('generation_format_selections') as any).update({
              format_preset_id: customization.selectedFormat,
              updated_at: new Date().toISOString(),
            }).eq('id', existingFormat.id);
          } else {
            // Insert new format
            await (supabase.from('generation_format_selections') as any).insert({
              upload_id: uploadId,
              format_preset_id: customization.selectedFormat,
            });
          }
        }
      }

      // Navigate to results forcing a fresh generation
      const params = new URLSearchParams();
      if (uploadIdsParam) {
        params.set('ids', uploadIdsParam);
      } else if (uploadIds.length > 0) {
        params.set('ids', JSON.stringify(uploadIds));
      }
      if (categorySlug) {
        params.set('category', categorySlug);
      }
      params.set('action', 'new');
      router.push(`/criar/resultado?${params.toString()}`);
    } catch (error) {
      console.error('Error saving customization:', error);
      alert('Erro ao salvar personalização. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#fff] to-[#f7f4ef]">
        <ProgressSteps currentStep={4} canProceed={false} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#20202a]/30 border-t-[#20202a] rounded-full animate-spin" />
            <p className="font-inter text-sm text-gray-600">Carregando opções...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#fff] to-[#f7f4ef]">
      <MainHeader currentPage="criar" credits={headerCredits} />
      {/* Progress Header */}
      <ProgressSteps
        currentStep={4}
        onNext={handleNext}
        onBack={handleBack}
        canProceed={true}
        isLoading={isSaving}
      />

      {/* Main Content */}
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto" ref={carouselWrapperRef}>
        {/* Page Header - Compacto */}
        <div className="mb-6 text-center">
          <h1 className="font-freight font-medium text-[32px] leading-tight text-[#111827]">
            Personalize sua Modelo
          </h1>
          <button
            onClick={handleSkip}
            className="font-inter text-xs text-gray-500 underline hover:text-[#20202a] transition-colors"
          >
            Pular esta etapa
          </button>
        </div>

        {/* Personalization Carousel */}
        <PersonalizationCarousel
          sections={CAROUSEL_SECTIONS}
          currentSection={customization.currentSection}
          onSectionChange={customization.setCurrentSection}
          className="mb-8"
        >
          {/* Section 1: Format Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
            <FormatSelector
              value={customization.selectedFormat}
              onChange={customization.setSelectedFormat}
              formats={formats}
            />
          </div>

          {/* Section 2: Model Profile (Gender, Age, Body Size) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
            <ModelCharacteristicsSelector
              value={customization.modelCharacteristics}
              onChange={customization.setModelCharacteristics}
            />
          </div>

          {/* Section 3: Facial Expression */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
            <FacialExpressionPicker
              value={customization.facialExpression}
              onChange={customization.setFacialExpression}
              gender={customization.modelCharacteristics.gender}
            />
          </div>

          {/* Section 4: Hair Color */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
            <HairColorPicker
              value={customization.hairColor}
              onChange={customization.setHairColor}
              gender={customization.modelCharacteristics.gender}
            />
          </div>

          {/* Section 5: Background */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
            <BackgroundStep
              enabled={customization.aiTools.changeBackground.enabled}
              selection={customization.aiTools.changeBackground.selection}
              backgrounds={backgrounds}
              onToggle={(enabled) =>
                customization.setAITools({
                  ...customization.aiTools,
                  changeBackground: {
                    enabled,
                    selection: enabled ? customization.aiTools.changeBackground.selection : null,
                  },
                })
              }
              onSelectionChange={(selection) =>
                customization.setAITools({
                  ...customization.aiTools,
                  changeBackground: {
                    enabled: selection
                      ? true
                      : customization.aiTools.changeBackground.enabled,
                    selection,
                  },
                })
              }
            />
          </div>

          {/* AI Tools section hidden for MVP */}
        </PersonalizationCarousel>
      </div>

      {/* Floating Pose Bar */}
      <FloatingPoseBar
        poses={selectedPoses}
        garments={garmentImages}
        customizations={{
          selectedFormat: formats.find(f => f.id === customization.selectedFormat) || null,
          height: customization.height,
          weight: customization.weight,
          facialExpression: customization.facialExpression,
          hairColor: customization.hairColor,
          hasAITools: false, // AI Tools hidden for MVP
          gender: customization.modelCharacteristics.gender,
        }}
        onAction={handleNext}
        actionLabel={
          customization.currentSection < CAROUSEL_SECTIONS.length - 1
            ? 'Próxima Etapa'
            : (isSaving ? 'Salvando...' : 'Finalizar')
        }
        actionDisabled={isSaving}
      />
    </div>
  );
}

export default function PersonalizacaoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#fff] to-[#f7f4ef]">
          <MainHeader currentPage="criar" credits={0} />
          <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#20202a]/30 border-t-[#20202a] rounded-full animate-spin" />
              <p className="font-inter text-sm text-gray-600">Carregando...</p>
            </div>
          </div>
        </div>
      }
    >
      <PersonalizacaoContent />
    </Suspense>
  );
}

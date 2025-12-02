'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProgressSteps } from '@/components/generation-flow/progress-steps';
import { HeightSlider, WeightSlider } from '@/components/generation-flow/height-weight-slider';
import { FacialExpressionPicker } from '@/components/generation-flow/facial-expression-picker';
import { HairColorPicker } from '@/components/generation-flow/hair-color-picker';
import { AIToolsPanel } from '@/components/generation-flow/ai-tools-panel';
import { FormatSelector } from '@/components/generation-flow/format-selector';
import { PersonalizationCarousel, type CarouselSection } from '@/components/generation-flow/personalization-carousel';
import { useCustomization } from '@/lib/generation-flow/useCustomization';
import { useFacialExpressions, useHairColors } from '@/lib/generation-flow/useCustomizationOptions';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/types/database.types';
import type { ImageFormatPreset } from '@/lib/generation-flow/image-formats';
import type { PoseMetadata } from '@/lib/generation-flow/pose-types';
import { FloatingPoseBar } from '@/components/generation-flow/floating-pose-bar';
import { BackgroundStep } from '@/components/generation-flow/background-step';
import { MainHeader } from '@/components/shared';

type BackgroundPreset = Tables<'background_presets'>;

const POSE_SELECTION_STORAGE_KEY = 'fotomodel_pose_selection';

// Define carousel sections
const CAROUSEL_SECTIONS: CarouselSection[] = [
  {
    id: 'format',
    title: 'Formato de Saída',
    subtitle: 'Escolha o formato ideal para sua plataforma'
  },
  {
    id: 'physical',
    title: 'Atributos Físicos',
    subtitle: 'Personalize altura e peso da modelo'
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
  {
    id: 'ai-tools',
    title: 'Ferramentas de IA',
    subtitle: 'Edições avançadas com IA'
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

  // Fetch dynamic customization options from database
  const { expressions, loading: loadingExpressions } = useFacialExpressions();
  const { colors, loading: loadingColors } = useHairColors();

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
          const { data: posesData, error: posesError } = await (supabase
            .from('model_poses') as any)
            .select('*')
            .in('id', poseIds);

          if (posesError) {
            console.error('Error fetching poses:', posesError);
          } else if (posesData) {
            // Map snake_case to camelCase for TypeScript interface
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
            setSelectedPoses(mappedPoses);
          }
        }

        // 3. Fetch garment images
        const { data: uploadsData, error: uploadsError } = await (supabase
          .from('user_uploads') as any)
          .select('id, metadata')
          .in('id', uploadIds)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (uploadsError) {
          console.error('Error fetching garment images:', uploadsError);
        } else if (uploadsData) {
          const images = uploadsData
            .map((upload: any) => ({
              id: upload.id,
              imageUrl: upload.metadata?.publicUrl || '',
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
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="font-inter text-xl md:text-2xl font-bold text-gray-900 mb-1">
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

          {/* Section 2: Physical Attributes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="space-y-6">
              <HeightSlider
                value={customization.height}
                onChange={customization.setHeight}
              />
              <WeightSlider
                value={customization.weight}
                onChange={customization.setWeight}
              />
            </div>
          </div>

          {/* Section 3: Facial Expression */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
            {loadingExpressions ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <FacialExpressionPicker
                value={customization.facialExpression}
                onChange={customization.setFacialExpression}
                expressions={expressions}
              />
            )}
          </div>

          {/* Section 4: Hair Color */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
            {loadingColors ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <HairColorPicker
                value={customization.hairColor}
                onChange={customization.setHairColor}
                colors={colors}
              />
            )}
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

          {/* Section 6: AI Tools */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
            <AIToolsPanel
              value={customization.aiTools}
              onChange={customization.setAITools}
            />
          </div>
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
          hasAITools: customization.aiTools.removeBackground ||
                      customization.aiTools.changeBackground.enabled ||
                      customization.aiTools.addLogo.enabled
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
        <div className="min-h-screen bg-gray-50">
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

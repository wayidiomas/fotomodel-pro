'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { calculateGenerationCredits, formatCreditCost } from '@/lib/credits/credit-calculator';
import type { CustomizationData } from '@/lib/generation-flow/useCustomization';
import { MainHeader } from '@/components/shared/main-header';
import { ProgressSteps } from '@/components/generation-flow/progress-steps';
import { WhatsAppShareButton } from '@/components/chat/whatsapp-share-button';

// Translation functions for user-facing text
function translateHairColor(color: string | null | undefined): string {
  if (!color) return '';

  // Normalize: replace underscores with spaces and lowercase
  const normalized = color.toLowerCase().replace(/_/g, ' ');

  const translations: Record<string, string> = {
    'black': 'Preto',
    'brown': 'Castanho',
    'blonde': 'Loiro',
    'red': 'Ruivo',
    'gray': 'Grisalho',
    'white': 'Branco',
    'dark brown': 'Castanho Escuro',
    'light brown': 'Castanho Claro',
    'dark blonde': 'Loiro Escuro',
    'light blonde': 'Loiro Claro',
    'auburn': 'Ruivo Acobreado',
  };

  return translations[normalized] || color;
}

function translateFacialExpression(expression: string | null | undefined): string {
  if (!expression) return '';

  // Normalize: replace underscores with spaces and lowercase
  const normalized = expression.toLowerCase().replace(/_/g, ' ');

  const translations: Record<string, string> = {
    'neutral': 'Neutro',
    'smile': 'Sorridente',
    'serious': 'Sério',
    'happy': 'Feliz',
    'confident': 'Confiante',
    'relaxed': 'Relaxado',
    'professional': 'Profissional',
    'friendly': 'Amigável',
    'elegant': 'Elegante',
  };

  return translations[normalized] || expression;
}

function translateGarmentCategory(category: string | null | undefined): string {
  if (!category) return '';

  const translations: Record<string, string> = {
    'dress': 'Vestido',
    'shirt': 'Camisa',
    'blouse': 'Blusa',
    't-shirt': 'Camiseta',
    'pants': 'Calça',
    'jeans': 'Jeans',
    'skirt': 'Saia',
    'jacket': 'Jaqueta',
    'coat': 'Casaco',
    'sweater': 'Suéter',
    'cardigan': 'Cardigã',
    'shorts': 'Shorts',
    'suit': 'Terno',
    'blazer': 'Blazer',
    'top': 'Top',
    'tank top': 'Regata',
    'hoodie': 'Moletom',
    'polo': 'Polo',
    'leggings': 'Legging',
    'swimwear': 'Roupa de Banho',
  };

  return translations[category.toLowerCase()] || category;
}

const pieceTypeBadgeLabel = (pieceType: 'upper' | 'lower' | 'single') => {
  switch (pieceType) {
    case 'upper':
      return 'Peça de Cima';
    case 'lower':
      return 'Peça de Baixo';
    default:
      return 'Peça Única';
  }
};

function ResultadoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const searchParamsString = searchParams.toString();
  const uploadIdsParam = searchParams.get('ids');
  const actionParam = searchParams.get('action');
  const [shouldForceGeneration, setShouldForceGeneration] = React.useState(actionParam === 'new');

  const [uploadIds, setUploadIds] = React.useState<string[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationResults, setGenerationResults] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [customization, setCustomization] = React.useState<CustomizationData | null>(null);
  const [userCredits, setUserCredits] = React.useState<number>(0);
  const [originalGarments, setOriginalGarments] = React.useState<
    Array<{ id: string; imageUrl: string; pieceType: 'upper' | 'lower' | 'single' }>
  >([]);

  // Like/Dislike state management
  const [likedResults, setLikedResults] = React.useState<Set<string>>(new Set());
  const [dislikedResults, setDislikedResults] = React.useState<Set<string>>(new Set());
  const [showDislikePopup, setShowDislikePopup] = React.useState(false);
  const [selectedResultForFeedback, setSelectedResultForFeedback] = React.useState<string | null>(null);
  const [dailyDislikeCount, setDailyDislikeCount] = React.useState(0);
  const [dailyDislikeLimit] = React.useState(3);

  // AI Improvement state management
  const [showAIImprovementModal, setShowAIImprovementModal] = React.useState(false);
  const [selectedResultForImprovement, setSelectedResultForImprovement] = React.useState<string | null>(null);
  const [feedbackTextValue, setFeedbackTextValue] = React.useState('');
  const [feedbackError, setFeedbackError] = React.useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);
  const [improvementTextValue, setImprovementTextValue] = React.useState('');
  const [improvementError, setImprovementError] = React.useState<string | null>(null);
  const [isSubmittingImprovement, setIsSubmittingImprovement] = React.useState(false);
  const [regeneratingResultId, setRegeneratingResultId] = React.useState<string | null>(null);

  // Image loading & download state
  const [loadingImages, setLoadingImages] = React.useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set());
  const [downloadingResultId, setDownloadingResultId] = React.useState<string | null>(null);

  // Save model state
  const [isSaveModelModalOpen, setIsSaveModelModalOpen] = React.useState(false);
  const [modelSaveResultId, setModelSaveResultId] = React.useState<string | null>(null);
  const [modelNameInput, setModelNameInput] = React.useState('');
  const [modelAgeMin, setModelAgeMin] = React.useState(20);
  const [modelAgeMax, setModelAgeMax] = React.useState(35);
  const [isSavingModel, setIsSavingModel] = React.useState(false);
  const [modelSavedSuccess, setModelSavedSuccess] = React.useState(false);
  const [poseSelectionId, setPoseSelectionId] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [savedModelResultIds, setSavedModelResultIds] = React.useState<Set<string>>(new Set());

  // Load user credits
  React.useEffect(() => {
    const loadUserCredits = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data: userData } = await (supabase
          .from('users') as any)
          .select('credits')
          .eq('id', user.id)
          .single();

        if (userData) {
          setUserCredits(userData.credits || 0);
        }
      }
    };

    loadUserCredits();
  }, []);

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

  // Load customization data
  React.useEffect(() => {
    const loadCustomization = async () => {
      if (uploadIds.length === 0) return;

      try {
        const supabase = createClient();

        // Load customization for first upload (they should all be the same)
        const { data, error } = await (supabase
          .from('generation_customizations') as any)
          .select('*')
          .eq('upload_id', uploadIds[0])
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setCustomization({
            height: data.model_height_cm || 170,
            weight: data.model_weight_kg || 60,
            facialExpression: data.facial_expression,
            hairColor: (data.metadata as any)?.hair_color || null,
            selectedFormat: null, // Will be loaded separately from generation_format_selections
            aiTools: (data.metadata as any)?.ai_tools || {
              removeBackground: false,
              changeBackground: { enabled: false, selection: null },
              addLogo: { enabled: false, logo: null },
            },
            uploadIds: uploadIds,
          });
        }
      } catch (error) {
        console.error('Error loading customization:', error);
      }
    };

    loadCustomization();
  }, [uploadIds]);

  // Load original garment references
  React.useEffect(() => {
    const fetchOriginalGarments = async () => {
      if (uploadIds.length === 0) return;

      try {
        const supabase = createClient();
        const { data, error } = await (supabase
          .from('user_uploads') as any)
          .select('id, metadata')
          .in('id', uploadIds)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching original garments:', error);
          return;
        }

        if (data) {
          const garments = data
            .map((upload: any) => ({
              id: upload.id,
              imageUrl: upload.metadata?.publicUrl || '',
              pieceType: (upload.metadata?.pieceType || 'single') as 'upper' | 'lower' | 'single',
            }))
            .filter((item: any) => item.imageUrl);

          setOriginalGarments(garments);

          const firstPoseId =
            data[0]?.metadata?.poseSelection?.selectedPoseIds?.[0] || null;
          setPoseSelectionId(firstPoseId);
        }
      } catch (error) {
        console.error('Error loading original garments:', error);
      }
    };

    fetchOriginalGarments();
  }, [uploadIds]);

  // Load existing results or trigger new generation
  React.useEffect(() => {
    const loadOrGenerate = async () => {
      if (
        uploadIds.length === 0 ||
        isGenerating ||
        generationResults.length > 0 ||
        shouldForceGeneration
      ) {
        return;
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Check if there's already a completed generation for these uploadIds
        const { data: existingGeneration } = await (supabase
          .from('generations') as any)
          .select(`
            id,
            status,
            created_at,
            generation_results (
              id,
              image_url,
              thumbnail_url,
              has_watermark,
              is_purchased,
              metadata
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .contains('input_data', { uploadIds })
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // If we have an existing completed generation, load its results
        if (existingGeneration && existingGeneration.generation_results?.length > 0) {
          console.log('Found existing generation:', existingGeneration);

          // Transform results to include public URLs
          const resultsWithUrls = existingGeneration.generation_results.map((result: any) => {
            const { data: imageUrlData } = supabase.storage
              .from('generated-images')
              .getPublicUrl(result.image_url);

            const { data: thumbnailUrlData } = result.thumbnail_url
              ? supabase.storage.from('thumbnails').getPublicUrl(result.thumbnail_url)
              : { data: { publicUrl: null } };

            return {
              ...result,
              image_url: imageUrlData.publicUrl,
              thumbnail_url: thumbnailUrlData.publicUrl,
            };
          });

          setGenerationResults(resultsWithUrls);
          console.log('Loaded existing results:', resultsWithUrls);
        } else {
          // No existing results, generate new ones
          console.log('No existing generation found, creating new one');
          await handleGenerate();
        }
      } catch (error) {
        console.error('Error loading existing results:', error);
        // If there's an error loading, try to generate new ones
        await handleGenerate();
      }
    };

    loadOrGenerate();
  }, [uploadIds, isGenerating, generationResults.length, shouldForceGeneration]);

  // Check which results have been saved as models
  React.useEffect(() => {
    const checkSavedModels = async () => {
      if (generationResults.length === 0 || !userId) return;

      try {
        const supabase = createClient();
        const resultIds = generationResults.map((r) => r.id);

        // Query user_models to see which generation_result_ids exist
        const { data: savedModels } = await (supabase
          .from('user_models') as any)
          .select('generation_result_id')
          .eq('user_id', userId)
          .in('generation_result_id', resultIds);

        if (savedModels) {
          const savedIds = new Set<string>(savedModels.map((m: any) => m.generation_result_id as string));
          setSavedModelResultIds(savedIds);
        }
      } catch (error) {
        console.error('Error checking saved models:', error);
      }
    };

    checkSavedModels();
  }, [generationResults, userId]);

  const handleBack = () => {
    router.push('/criar');
  };

  const handleGenerate = React.useCallback(async (options?: { keepExisting?: boolean; regenerationReason?: 'feedback' | 'improvement' }) => {
    try {
      const keepExisting = options?.keepExisting;
      const regenerationReason = options?.regenerationReason;

      setIsGenerating(true);
      setError(null);
      if (!keepExisting) {
        setGenerationResults([]);
      }

      if (uploadIds.length === 0) {
        throw new Error('Nenhuma peça selecionada para geração. Volte e selecione novamente.');
      }

      // Get session token for authentication
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Você precisa estar autenticado para gerar imagens');
      }

      // Call generation API
      const requestPayload: Record<string, any> = { uploadIds };
      if (regenerationReason) {
        requestPayload.regenerationType = regenerationReason;
      }

      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar imagens');
      }

      const apiResult = await response.json();
      console.log('API Result:', apiResult);

      // Fetch the generation results from database
      const { data: generationData, error: generationError } = await (supabase
        .from('generation_results') as any)
        .select('*')
        .eq('generation_id', apiResult.generationId)
        .eq('is_deleted', false);

      if (generationError) {
        console.error('Error fetching generation results:', generationError);
        throw new Error('Erro ao carregar resultados da geração');
      }

      console.log('Generation Data from DB:', generationData);

      if (!generationData || generationData.length === 0) {
        throw new Error('Nenhum resultado encontrado para esta geração');
      }

      // Transform database results to include publicUrl using Supabase's getPublicUrl
      const resultsWithUrls = generationData.map((result: any) => {
        const { data: imageUrlData } = supabase.storage
          .from('generated-images')
          .getPublicUrl(result.image_url);

        const { data: thumbnailUrlData } = result.thumbnail_url
          ? supabase.storage.from('thumbnails').getPublicUrl(result.thumbnail_url)
          : { data: { publicUrl: null } };

        console.log('Image URL:', imageUrlData.publicUrl);
        console.log('Thumbnail URL:', thumbnailUrlData.publicUrl);

        return {
          ...result,
          image_url: imageUrlData.publicUrl,
          thumbnail_url: thumbnailUrlData.publicUrl,
        };
      });

      console.log('Results with URLs:', resultsWithUrls);
      setGenerationResults(resultsWithUrls);
    } catch (error: any) {
      console.error('Error generating images:', error);
      setError(error.message || 'Erro ao gerar imagens. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  }, [router, uploadIds]);

  React.useEffect(() => {
    const generateIfNeeded = async () => {
      if (!shouldForceGeneration || uploadIds.length === 0) return;
      await handleGenerate();
      setShouldForceGeneration(false);

      const params = new URLSearchParams(searchParamsString);
      params.delete('action');
      const query = params.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(target, { scroll: false });
    };

    generateIfNeeded();
  }, [shouldForceGeneration, uploadIds, handleGenerate, router, pathname, searchParamsString]);

  const downloadCleanImageFile = React.useCallback(
    async (url: string, fileLabel: string, mimeType: string = 'image/png') => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Erro ao preparar o download da imagem limpa.');
      }

      const blob = await response.blob();
      const extension = mimeType.split('/')[1] || 'png';
      const safeLabel = fileLabel.replace(/[^a-z0-9-_]/gi, '-').toLowerCase() || 'fotomodel';
      const finalName = `${safeLabel}-${Date.now()}.${extension}`;
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = finalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    },
    []
  );

  const handleDownload = async (resultId: string) => {
    try {
      setDownloadingResultId(resultId);
      // Call download API (will remove watermark and unlock the clean image)
      const response = await fetch('/api/ai/download-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao baixar imagem');
      }

      if (typeof data.imageUrl === 'string') {
        const targetResultId = data.resultId || resultId;
        const mimeType = data.mimeType || 'image/png';

        setLoadedImages(prev => {
          const next = new Set(prev);
          next.delete(targetResultId);
          return next;
        });

        setGenerationResults((prev) =>
          prev.map((result: any) =>
            result.id === targetResultId
              ? {
                  ...result,
                  is_purchased: true,
                  has_watermark: false,
                  image_url: data.imageUrl,
                  metadata: {
                    ...(result.metadata || {}),
                    cleanMimeType: mimeType,
                  },
                }
              : result
          )
        );
        await downloadCleanImageFile(data.imageUrl, targetResultId, mimeType);
      } else if (data.resultId) {
        setGenerationResults((prev) =>
          prev.map((result: any) =>
            result.id === data.resultId
              ? { ...result, is_purchased: true, has_watermark: false }
              : result
          )
        );
      }
    } catch (error: any) {
      console.error('Error downloading image:', error);
      alert(error.message || 'Erro ao baixar imagem. Tente novamente.');
    } finally {
      setDownloadingResultId((prev) => (prev === resultId ? null : prev));
    }
  };

  const handleNewGeneration = () => {
    router.push('/criar');
  };

  const handleOpenSaveModelModal = React.useCallback(() => {
    if (!generationResults.length) {
      alert('Gere pelo menos uma imagem antes de salvar o modelo.');
      return;
    }
    const defaultName =
      modelNameInput.trim() || `Modelo ${new Date().toLocaleDateString('pt-BR')}`;
    setModelNameInput(defaultName);
    setModelSaveResultId((prev) => {
      if (prev) return prev;
      const firstResultId = generationResults[0]?.id ?? null;
      return firstResultId;
    });
    setIsSaveModelModalOpen(true);
    setModelSavedSuccess(false);
  }, [generationResults, modelNameInput]);

  const handleConfirmSaveModel = React.useCallback(async () => {
    if (!modelSaveResultId) return;
    const targetResult = generationResults.find((result) => result.id === modelSaveResultId);
    if (!targetResult) {
      alert('Selecione uma imagem para salvar o modelo.');
      return;
    }

    setIsSavingModel(true);

    try {
      let cleanImageUrl = targetResult.image_url;

      if (targetResult.has_watermark) {
        const cleanResponse = await fetch('/api/ai/download-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resultId: modelSaveResultId }),
        });

        const cleanData = await cleanResponse.json();
        if (!cleanResponse.ok || !cleanData.imageUrl) {
          throw new Error(cleanData.error || 'Não foi possível remover a watermark antes de salvar o modelo.');
        }

        cleanImageUrl = cleanData.imageUrl;

        setGenerationResults((prev) =>
          prev.map((result) =>
            result.id === modelSaveResultId
              ? {
                  ...result,
                  image_url: cleanData.imageUrl,
                  has_watermark: false,
                  is_purchased: true,
                }
              : result
          )
        );
      }

      const response = await fetch('/api/user-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationResultId: modelSaveResultId,
          imageUrl: cleanImageUrl,
          thumbnailUrl: targetResult.thumbnail_url,
          modelName: modelNameInput.trim() || undefined,
          heightCm: customization?.height,
          weightKg: customization?.weight,
          facialExpression: customization?.facialExpression,
          hairColor: customization?.hairColor,
          ageMin: modelAgeMin,
          ageMax: modelAgeMax,
          poseId: poseSelectionId,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar modelo.');
      }

      // Add this result ID to the saved models set
      setSavedModelResultIds((prev) => new Set<string>([...prev, modelSaveResultId]));

      setModelSavedSuccess(true);
      setIsSaveModelModalOpen(false);
    } catch (error: any) {
      console.error('Error saving model:', error);
      alert(error.message || 'Não foi possível salvar o modelo. Tente novamente.');
    } finally {
      setIsSavingModel(false);
    }
  }, [modelSaveResultId, generationResults, modelNameInput, customization, poseSelectionId]);

  const handleBackToCustomization = React.useCallback(() => {
    if (uploadIds.length === 0) {
      router.push('/criar/personalizacao');
      return;
    }

    const idsParam = encodeURIComponent(JSON.stringify(uploadIds));
    router.push(`/criar/personalizacao?ids=${idsParam}`);
  }, [router, uploadIds]);

  // Load daily dislike count
  React.useEffect(() => {
    const loadDailyDislikeCount = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const { data, error } = await (supabase
          .from('user_daily_limits') as any)
          .select('dislike_count')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading daily dislike count:', error);
          return;
        }

        setDailyDislikeCount(data?.dislike_count || 0);
      } catch (error) {
        console.error('Error in loadDailyDislikeCount:', error);
      }
    };

    loadDailyDislikeCount();
  }, []);

  // Handle like button click
  const handleLike = async (resultId: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Você precisa estar autenticado');
        return;
      }

      // Toggle like state
      const newLikedResults = new Set(likedResults);
      const newDislikedResults = new Set(dislikedResults);

      if (likedResults.has(resultId)) {
        // Remove like
        newLikedResults.delete(resultId);

        // Delete from database
        await (supabase
          .from('generation_feedback') as any)
          .delete()
          .eq('user_id', user.id)
          .eq('generation_result_id', resultId);
      } else {
        // Add like and remove dislike if exists
        newLikedResults.add(resultId);
        newDislikedResults.delete(resultId);

        // Upsert to database
        await (supabase
          .from('generation_feedback') as any)
          .upsert({
            user_id: user.id,
            generation_result_id: resultId,
            feedback_type: 'like',
            feedback_text: null,
          }, {
            onConflict: 'user_id,generation_result_id',
          });
      }

      setLikedResults(newLikedResults);
      setDislikedResults(newDislikedResults);
    } catch (error) {
      console.error('Error handling like:', error);
      alert('Erro ao processar feedback. Tente novamente.');
    }
  };

  // Handle dislike button click
  const handleDislike = async (resultId: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Você precisa estar autenticado');
        return;
      }

      // Toggle dislike state
      const newLikedResults = new Set(likedResults);
      const newDislikedResults = new Set(dislikedResults);

      if (dislikedResults.has(resultId)) {
        // Remove dislike
        newDislikedResults.delete(resultId);

        // Delete from database
        await (supabase
          .from('generation_feedback') as any)
          .delete()
          .eq('user_id', user.id)
          .eq('generation_result_id', resultId);
      } else {
        // Add dislike and remove like if exists
        newDislikedResults.add(resultId);
        newLikedResults.delete(resultId);

        // Show popup for feedback
        setFeedbackTextValue('');
        setFeedbackError(null);
        setSelectedResultForFeedback(resultId);
        setShowDislikePopup(true);
      }

      setLikedResults(newLikedResults);
      setDislikedResults(newDislikedResults);
    } catch (error) {
      console.error('Error handling dislike:', error);
      alert('Erro ao processar feedback. Tente novamente.');
    }
  };

  // Calculate credit cost
  const creditCost = customization
    ? calculateGenerationCredits(customization.aiTools).total
    : 2;

  // Check if any result has been saved as a model
  const hasAnySavedModel = generationResults.some(result => savedModelResultIds.has(result.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <MainHeader currentPage="criar" credits={userCredits} />

      <ProgressSteps
        currentStep={5}
        onBack={handleBackToCustomization}
        extraActions={
          generationResults.length > 0 && !isGenerating ? (
            <button
              type="button"
              onClick={hasAnySavedModel ? undefined : handleOpenSaveModelModal}
              disabled={isSavingModel || hasAnySavedModel}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${
                isSavingModel
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : hasAnySavedModel
                  ? 'bg-green-500/90 text-white cursor-default'
                  : 'bg-[#20202a] text-white hover:bg-[#2c2c38] active:scale-95'
              }`}
            >
              {hasAnySavedModel ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 3V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="8" cy="12" r="0.9" fill="currentColor" />
                  <circle cx="16" cy="12" r="0.9" fill="currentColor" />
                </svg>
              )}
              {isSavingModel ? 'Salvando...' : hasAnySavedModel ? 'Modelo Salvo' : 'Salvar modelo'}
            </button>
          ) : null
        }
      />

      {/* Main Content */}
      <div className="px-4 lg:px-12 2xl:px-16 py-8 max-w-[1600px] mx-auto">
        {/* Error State - Glassmorphic */}
        {error && (
          <div className="mb-6 p-4 bg-red-50/60 backdrop-blur-xl border border-red-200/40 rounded-3xl shadow-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-inter text-sm font-semibold text-red-900">Erro na Geração</h3>
                <p className="font-inter text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => handleGenerate()}
                  className="mt-3 font-inter text-sm font-medium text-red-700 hover:text-red-800 active:scale-[0.98] transition-all"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generating State - Enhanced Glassmorphic with Advanced Animations */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center min-h-[600px] relative">
            {/* Main Preview Area with Enhanced Loading Animation */}
            <div className="relative w-full max-w-2xl max-h-[70vh] aspect-[3/4] bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-gray-100/20 to-gray-50/30 animate-pulse" />

              {/* Shimmer Effect */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              {/* Center Content with Multiple AI Icons */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Outer Ring Pulse */}
                  <div className="absolute inset-0 -m-12 rounded-full border-2 border-gray-500/20 animate-ping" />
                  <div className="absolute inset-0 -m-8 rounded-full border-2 border-gray-600/30 animate-pulse" />

                  {/* Main AI Sparkle Icon with Enhanced Animation */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#c19044]/20 to-[#f4d9a3]/20 rounded-full blur-3xl animate-pulse" />
                    <svg className="w-20 h-20 text-[#c19044] relative z-10 animate-pulse" fill="none" viewBox="0 0 24 24">
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z"
                        className="animate-pulse"
                      />
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 4L19.5 5.5L21 6L19.5 6.5L19 8L18.5 6.5L17 6L18.5 5.5L19 4Z"
                      />
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 16L19.5 17.5L21 18L19.5 18.5L19 20L18.5 18.5L17 18L18.5 17.5L19 16Z"
                      />
                    </svg>
                  </div>

                  {/* Floating Mini Sparkles */}
                  <div className="absolute -top-6 -left-6 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2s' }}>
                    <svg className="w-6 h-6 text-[#d8b36b]/60" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3L13 7L17 8L13 9L12 13L11 9L7 8L11 7L12 3Z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-6 -right-6 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }}>
                    <svg className="w-6 h-6 text-[#bd8e45]/60" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3L13 7L17 8L13 9L12 13L11 9L7 8L11 7L12 3Z" />
                    </svg>
                  </div>
                  <div className="absolute top-0 -right-8 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '1.8s' }}>
                    <svg className="w-5 h-5 text-[#8a5a2d]/60" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3L13 7L17 8L13 9L12 13L11 9L7 8L11 7L12 3Z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Enhanced Wave Effect with Multiple Layers */}
              <div className="absolute bottom-0 left-0 right-0 h-40 overflow-hidden">
                {/* Wave Layer 1 */}
                <svg className="absolute bottom-0 w-full h-32 opacity-20" preserveAspectRatio="none" viewBox="0 0 1440 320">
                  <path
                    fill="url(#wave-gradient-1)"
                    d="M0,160L48,149.3C96,139,192,117,288,122.7C384,128,480,160,576,165.3C672,171,768,149,864,133.3C960,117,1056,107,1152,112C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    className="animate-[wave_4s_ease-in-out_infinite]"
                  />
                  <defs>
                    <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f5d8a2" />
                      <stop offset="100%" stopColor="#c18b3c" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Wave Layer 2 */}
                <svg className="absolute bottom-0 w-full h-28 opacity-25" preserveAspectRatio="none" viewBox="0 0 1440 320">
                  <path
                    fill="url(#wave-gradient-2)"
                    d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,165.3C672,149,768,139,864,149.3C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    className="animate-[wave_3s_ease-in-out_infinite_reverse]"
                  />
                  <defs>
                    <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#d9aa52" />
                      <stop offset="100%" stopColor="#a06a27" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Wave Layer 3 */}
                <svg className="absolute bottom-0 w-full h-24 opacity-30" preserveAspectRatio="none" viewBox="0 0 1440 320">
                  <path
                    fill="url(#wave-gradient-3)"
                    d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,133.3C672,117,768,107,864,112C960,117,1056,139,1152,138.7C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    className="animate-[wave_2.5s_ease-in-out_infinite]"
                  />
                  <defs>
                    <linearGradient id="wave-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a47135" />
                      <stop offset="100%" stopColor="#f2c87b" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Enhanced Loading Text with Progress Indicator */}
            <div className="mt-8 text-center max-w-md">
              <h2 className="font-inter text-2xl font-semibold text-gray-900 mb-3 flex items-center gap-2 justify-center">
                <span className="text-[#20202a]">
                  Gerando os melhores resultados
                </span>
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 bg-[#d8b36b] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-[#bd8e45] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-[#8a5a2d] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </h2>
              <p className="font-inter text-sm text-gray-600 mb-4">
                Nossa IA está criando a modelo perfeita para você
              </p>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/40 rounded-full overflow-hidden backdrop-blur-sm border border-[#f1d7a6]/40">
                <div className="h-full bg-gradient-to-r from-[#b67c34] via-[#e6c07c] to-[#f4dfba] rounded-full animate-[shimmer_1.5s_infinite]" style={{ width: '100%' }} />
              </div>

              {/* Process Steps */}
              <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-gray-500">
                <div className="bg-white/60 backdrop-blur-lg rounded-lg p-2 border border-[#f4d9a3]/40 shadow-[0_10px_30px_rgba(210,173,108,0.15)]">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c19244] to-[#a8732d] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="font-medium">Analisando</p>
                </div>
                <div className="bg-white/60 backdrop-blur-lg rounded-lg p-2 border border-[#f8e7c5]/40 animate-pulse shadow-[0_10px_30px_rgba(210,173,108,0.12)]">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f1c985] to-[#b67c34] flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping opacity-80" />
                    </div>
                  </div>
                  <p className="font-medium">Gerando</p>
                </div>
                <div className="bg-white/40 backdrop-blur-lg rounded-lg p-2 border border-[#f1d7a6]/30">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f7d8a9] to-[#c49541] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                  <p className="font-medium">Finalizando</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Display - Glassmorphic Layout */}
        {!isGenerating && generationResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 lg:gap-8">
            {/* Left: Image Preview - Smaller size with glassmorphic overlay */}
            <div className="space-y-4">
              {generationResults.map((result: any) => (
                <div key={result.id} className="relative w-full max-w-2xl mx-auto">
                  {/* Image container - max height to prevent overflow */}
                  <div className="relative w-full max-h-[75vh] aspect-[3/4] bg-white/75 backdrop-blur-2xl rounded-[36px] overflow-hidden shadow-[0_28px_70px_rgba(15,23,42,0.25)] border border-white/60">
                    {/* Skeleton Loader */}
                    {!loadedImages.has(result.id) && (
                      <div className="absolute inset-0 z-10">
                        {/* Animated Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 animate-pulse" />

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                        </div>

                        {/* Skeleton Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                          {/* Icon Placeholder */}
                          <div className="relative mb-6">
                            <div className="w-16 h-16 rounded-full bg-gray-200/60 animate-pulse flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="absolute inset-0 rounded-full border-2 border-gray-400/30 animate-ping" />
                          </div>

                          {/* Text Placeholder */}
                          <div className="space-y-2 w-full max-w-xs">
                            <div className="h-3 bg-gray-200/60 rounded-full animate-pulse" style={{ width: '80%', margin: '0 auto' }} />
                            <div className="h-3 bg-gray-200/60 rounded-full animate-pulse" style={{ width: '60%', margin: '0 auto' }} />
                          </div>

                          {/* Loading Dots */}
                          <div className="mt-4 flex gap-1.5">
                            <span className="w-2 h-2 bg-gray-500/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-600/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-700/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <Image
                      src={result.image_url}
                      alt="Resultado gerado"
                      fill
                      className={`object-contain transition-opacity duration-500 ${
                        loadedImages.has(result.id) ? 'opacity-100' : 'opacity-0'
                      }`}
                      priority
                      onLoadingComplete={() => {
                        setLoadedImages(prev => new Set([...prev, result.id]));
                        setLoadingImages(prev => {
                          const next = new Set(prev);
                          next.delete(result.id);
                          return next;
                        });
                      }}
                      onLoad={() => {
                        setLoadedImages(prev => new Set([...prev, result.id]));
                      }}
                    />

                    {regeneratingResultId === result.id && (
                      <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-gray-900">
                        <svg className="w-10 h-10 animate-spin text-gray-800" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-80"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4l4-4-4-4v4a12 12 0 00-12 12h4z"
                          />
                        </svg>
                        <p className="mt-3 font-inter text-sm font-medium">Gerando nova imagem...</p>
                      </div>
                    )}

                    {originalGarments.length > 0 && (
                      <div className="absolute bottom-4 left-4">
                        <div className="bg-white/45 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/40 p-2.5 w-[170px] ring-1 ring-white/30">
                          <span className="font-inter text-[10px] tracking-[0.25em] uppercase text-gray-600">
                            Original
                          </span>
                          <div className="mt-2 flex gap-1.5">
                            {originalGarments.slice(0, 2).map((garment) => (
                              <div
                                key={garment.id}
                                className="relative h-14 w-14 rounded-lg overflow-hidden bg-gray-100 border border-white/70 shadow-inner"
                              >
                                <Image
                                  src={garment.imageUrl}
                                  alt={pieceTypeBadgeLabel(garment.pieceType)}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* WhatsApp Share - Top Right */}
                    <div className="absolute top-4 right-4">
                      <WhatsAppShareButton
                        imageUrl={result.image_url}
                        className="rounded-full border-white/60 bg-white/80 px-4 py-2 text-xs font-semibold text-green-600 shadow-lg"
                      />
                    </div>

                    {/* Like/Dislike Bar - Bottom Right Glassmorphic */}
                    <div className="absolute bottom-4 right-4">
                      <div className="flex gap-2 bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-lg border border-white/40">
                        <button
                          onClick={() => handleLike(result.id)}
                          className={`flex items-center justify-center w-11 h-11 rounded-xl backdrop-blur-sm hover:bg-white/80 active:scale-95 transition-all shadow-sm ${
                            likedResults.has(result.id)
                              ? 'bg-green-500/80 hover:bg-green-500/90'
                              : 'bg-white/60'
                          }`}
                          aria-label="Gostei"
                        >
                          <svg className={`w-5 h-5 ${likedResults.has(result.id) ? 'text-white' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleDislike(result.id)}
                          className={`flex items-center justify-center w-11 h-11 rounded-xl backdrop-blur-sm hover:bg-white/80 active:scale-95 transition-all shadow-sm ${
                            dislikedResults.has(result.id)
                              ? 'bg-red-500/80 hover:bg-red-500/90'
                              : 'bg-white/60'
                          }`}
                          aria-label="Não gostei"
                        >
                          <svg className={`w-5 h-5 ${dislikedResults.has(result.id) ? 'text-white' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Metadata Sidebar - Glassmorphic */}
            <div className="space-y-4">
              {/* Header */}
              <div className="space-y-1">
                <h1 className="font-inter text-2xl font-semibold text-gray-900">
                  Imagem Gerada
                </h1>
                <p className="font-inter text-sm text-gray-500">
                  Criada com IA
                </p>
              </div>

              {/* Credits Card - Glassmorphic */}
              <div className="bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-xl rounded-3xl p-4 shadow-lg border border-white/40">
                <div className="flex items-center justify-between">
                  <span className="font-inter text-sm text-gray-600">Créditos utilizados</span>
                  <span className="font-inter text-lg font-semibold text-gray-900">{formatCreditCost(creditCost)}</span>
                </div>
              </div>

              {/* Customizations Card - Glassmorphic */}
              {customization && (
                <div className="bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-xl rounded-3xl p-4 space-y-3 shadow-lg border border-white/40">
                  <h3 className="font-inter text-sm font-semibold text-gray-900">
                    Personalizações
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-inter text-sm text-gray-600">Altura</span>
                      <span className="font-inter text-sm font-medium text-gray-900">{customization.height}cm</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-inter text-sm text-gray-600">Peso</span>
                      <span className="font-inter text-sm font-medium text-gray-900">{customization.weight}kg</span>
                    </div>
                    {customization.facialExpression && (
                      <div className="flex items-center justify-between">
                        <span className="font-inter text-sm text-gray-600">Expressão</span>
                        <span className="font-inter text-sm font-medium text-gray-900">{translateFacialExpression(customization.facialExpression)}</span>
                      </div>
                    )}
                    {customization.hairColor && (
                      <div className="flex items-center justify-between">
                        <span className="font-inter text-sm text-gray-600">Cor do cabelo</span>
                        <span className="font-inter text-sm font-medium text-gray-900">{translateHairColor(customization.hairColor)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons - Glassmorphic */}
              <div className="space-y-4 pt-2">
                {generationResults.map((result: any) => {
                  const isClean = result.is_purchased || result.has_watermark === false;
                  const isDownloading = downloadingResultId === result.id;
                  const isDisabled = isClean || isDownloading;

                  return (
                    <div
                      key={result.id}
                      className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-4 shadow-[0_24px_55px_rgba(15,23,42,0.14)] border border-white/60 space-y-3"
                    >
                      <button
                        onClick={() => handleDownload(result.id)}
                        disabled={isDisabled}
                        aria-disabled={isDisabled}
                        className={`w-full font-inter px-4 py-3.5 bg-gradient-to-r from-[#20202a] to-[#2a2a35] text-white text-[15px] font-medium rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all ${
                          isDisabled
                            ? 'opacity-60 cursor-not-allowed'
                            : 'hover:shadow-lg active:scale-[0.98]'
                        }`}
                      >
                        {isDownloading ? (
                          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
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
                              d="M4 12a8 8 0 018-8v4l5-5-5-5v4a12 12 0 00-12 12h4z"
                            />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v10m0 0l-3-3m3 3l3-3" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 18h14" />
                          </svg>
                        )}
                        <span>
                          {isClean ? "Imagem sem marca d'água" : isDownloading ? 'Liberando imagem...' : "Baixar sem marca d'água"}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedResultForImprovement(result.id);
                          setImprovementTextValue('');
                          setImprovementError(null);
                          setShowAIImprovementModal(true);
                        }}
                        className="w-full font-inter px-4 py-3.5 bg-gradient-to-r from-[#fdf4e3] via-[#f1d9a1] to-[#d3a45d] text-[#3f2f1d] text-[15px] font-semibold rounded-2xl hover:shadow-lg active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5 animate-pulse text-[#6d4b21]" fill="none" viewBox="0 0 24 24">
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z"
                          />
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 4L19.5 5.5L21 6L19.5 6.5L19 8L18.5 6.5L17 6L18.5 5.5L19 4Z"
                          />
                        </svg>
                        <span className="font-semibold">Melhore com a IA</span>
                        <span className="ml-1 text-[#6d4b21]/60">•</span>
                        <span className="ml-1 text-[#6d4b21] font-semibold">1 crédito</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* New Generation CTA - Glassmorphic */}
              <div className="bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-xl rounded-3xl p-5 space-y-3 shadow-lg border border-white/40">
                <div className="space-y-1">
                  <h3 className="font-inter text-base font-semibold text-gray-900">
                    Gostou do resultado?
                  </h3>
                  <p className="font-inter text-sm text-gray-600">
                    Crie novas imagens com diferentes roupas e poses
                  </p>
                </div>
                <button
                  onClick={handleNewGeneration}
                  className="w-full font-inter px-4 py-3 bg-gradient-to-r from-[#20202a] to-[#2a2a35] text-white text-[15px] font-medium rounded-2xl hover:shadow-lg active:scale-[0.98] transition-all shadow-md"
                >
                  Criar Nova Geração
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Glassmorphic */}
        {!isGenerating && generationResults.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white/60 backdrop-blur-xl rounded-full p-6 mb-4 shadow-lg border border-white/40">
              <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-inter text-xl font-semibold text-gray-900 mb-2">
              Nenhuma imagem gerada ainda
            </h2>
            <p className="font-inter text-sm text-gray-500 mb-6">
              Clique no botão abaixo para iniciar a geração
            </p>
            <button
              onClick={() => handleGenerate()}
              className="font-inter px-6 py-3 bg-gradient-to-r from-[#20202a] to-[#2a2a35] text-white text-[15px] font-medium rounded-2xl hover:shadow-lg active:scale-[0.98] transition-all shadow-md"
            >
              Gerar Imagens
            </button>
          </div>
        )}
      </div>

      {/* Dislike Feedback Popup - Glassmorphic Modal */}
      {isSaveModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-4xl rounded-[32px] bg-white/85 shadow-2xl p-6 md:p-8 backdrop-blur-xl border border-white/60">
            <button
              onClick={() => setIsSaveModelModalOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="space-y-5">
              <div>
                <h2 className="font-inter text-2xl font-bold text-gray-900">Modelo personalizado</h2>
                <p className="font-inter text-sm text-gray-600 mt-1">
                  Revise o resultado selecionado e dê um nome para reutilizar esta modelo nas futuras gerações.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[26px] border border-white/40 bg-white/70 backdrop-blur-xl shadow-lg p-4">
                  <div className="relative h-[420px] rounded-2xl overflow-hidden">
                    <Image
                      src={
                        generationResults.find((result) => result.id === modelSaveResultId)?.image_url ||
                        generationResults[0]?.image_url ||
                        ''
                      }
                      alt="Prévia do modelo"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-[0.3em]">
                      Prévia
                    </div>
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/50 bg-white/70 backdrop-blur-xl shadow-lg p-5 space-y-4">
                  <div className="space-y-2">
                    <label className="font-inter text-sm font-semibold text-gray-800 uppercase tracking-wide">
                      Nome da modelo
                    </label>
                    <input
                      type="text"
                      value={modelNameInput}
                      onChange={(e) => setModelNameInput(e.target.value)}
                      className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 font-inter text-sm focus:border-[#20202a] focus:ring-[#20202a] placeholder:text-gray-400 shadow-inner"
                      placeholder="Ex: Modelo cápsula outono"
                    />
                    <p className="text-xs text-gray-500">
                      Use um nome que facilite identificar esta modelo na etapa de poses.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-inter text-sm font-semibold text-gray-800 uppercase tracking-wide">
                        Faixa de idade
                      </label>
                      <span className="font-inter font-medium text-sm text-gray-600">
                        {modelAgeMin} - {modelAgeMax} anos
                      </span>
                    </div>

                    <div className="relative pt-2 pb-4">
                      {/* Slider track background */}
                      <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-200 rounded-full -translate-y-1/2" />

                      {/* Active range highlight */}
                      <div
                        className="absolute top-1/2 h-1.5 bg-[#20202a] rounded-full -translate-y-1/2"
                        style={{
                          left: `${((modelAgeMin - 1) / 79) * 100}%`,
                          right: `${100 - ((modelAgeMax - 1) / 79) * 100}%`,
                        }}
                      />

                      {/* Min range input */}
                      <input
                        type="range"
                        min={1}
                        max={80}
                        value={modelAgeMin}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value <= modelAgeMax) {
                            setModelAgeMin(value);
                          }
                        }}
                        className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#20202a] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#20202a] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:shadow-md top-1/2 -translate-y-1/2"
                      />

                      {/* Max range input */}
                      <input
                        type="range"
                        min={1}
                        max={80}
                        value={modelAgeMax}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= modelAgeMin) {
                            setModelAgeMax(value);
                          }
                        }}
                        className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#20202a] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#20202a] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:shadow-md top-1/2 -translate-y-1/2"
                      />
                    </div>

                    {/* Age range labels */}
                    <div className="flex justify-between text-xs text-gray-500 font-inter">
                      <span>1</span>
                      <span>80</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-sm text-gray-600">
                    Ao salvar, mantemos altura, peso, expressão, cor do cabelo, idade e pose desta modelo para reaproveitar
                    nas próximas gerações.
                  </div>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      onClick={() => setIsSaveModelModalOpen(false)}
                      className="rounded-xl border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white/80"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmSaveModel}
                      disabled={isSavingModel || !modelSaveResultId}
                      className={`rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-lg ${
                        isSavingModel || !modelSaveResultId
                          ? 'bg-gray-200 cursor-not-allowed'
                          : 'bg-[#20202a] hover:bg-[#2c2c38]'
                      }`}
                    >
                      {isSavingModel ? 'Salvando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDislikePopup && selectedResultForFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-inter text-xl font-semibold text-gray-900">
                  O que você não gostou?
                </h3>
                <p className="font-inter text-sm text-gray-600 mt-1">
                  {dailyDislikeCount < dailyDislikeLimit
                    ? `${dailyDislikeLimit - dailyDislikeCount} melhorias grátis restantes hoje`
                    : 'Limite diário atingido'
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDislikePopup(false);
                  setSelectedResultForFeedback(null);
                  setFeedbackTextValue('');
                  setFeedbackError(null);
                  // Remove dislike if user closes without submitting
                  const newDislikedResults = new Set(dislikedResults);
                  newDislikedResults.delete(selectedResultForFeedback);
                  setDislikedResults(newDislikedResults);
                }}
                className="rounded-lg p-2 hover:bg-gray-100/60 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {dailyDislikeCount >= dailyDislikeLimit ? (
              <div className="bg-red-50/60 backdrop-blur-sm border border-red-200/40 rounded-2xl p-4">
                <p className="font-inter text-sm text-red-800">
                  Você atingiu o limite de {dailyDislikeLimit} melhorias grátis por dia. Tente novamente amanhã!
                </p>
              </div>
            ) : (
              <>
                <textarea
                  placeholder="Descreva o que não gostou na imagem gerada..."
                  className="w-full h-32 px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-2xl font-inter text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d8b07c]/60 focus:border-transparent resize-none"
                  maxLength={500}
                  value={feedbackTextValue}
                  onChange={(event) => {
                    setFeedbackTextValue(event.target.value);
                    if (feedbackError) setFeedbackError(null);
                  }}
                />
                <p className="font-inter text-xs text-gray-500 text-right">
                  {feedbackTextValue.length}/500 caracteres
                </p>

                {feedbackError && (
                  <p className="font-inter text-sm text-red-600 bg-red-50/80 border border-red-100 rounded-xl px-3 py-2">
                    {feedbackError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDislikePopup(false);
                      setSelectedResultForFeedback(null);
                      setFeedbackTextValue('');
                      setFeedbackError(null);
                      // Remove dislike if user cancels
                      const newDislikedResults = new Set(dislikedResults);
                      newDislikedResults.delete(selectedResultForFeedback);
                      setDislikedResults(newDislikedResults);
                    }}
                    className="flex-1 font-inter px-4 py-3 bg-white/60 backdrop-blur-sm text-gray-700 text-sm font-medium border border-gray-200/60 rounded-2xl hover:bg-white/80 active:scale-[0.98] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedResultForFeedback) return;
                      if (!feedbackTextValue.trim()) {
                        setFeedbackError('Por favor, descreva o que não gostou.');
                        return;
                      }

                      setFeedbackError(null);
                      setIsSubmittingFeedback(true);

                      try {
                        const response = await fetch('/api/ai/regenerate-from-feedback', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            resultId: selectedResultForFeedback,
                            feedbackText: feedbackTextValue.trim(),
                          }),
                        });

                        const payload = await response.json();
                        if (!response.ok || !payload.success) {
                          throw new Error(payload.error || 'Erro ao processar feedback');
                        }

                        const targetResultId = selectedResultForFeedback;
                        setShowDislikePopup(false);
                        setSelectedResultForFeedback(null);
                        setFeedbackTextValue('');
                        setDislikedResults((prev) => {
                          const next = new Set(prev);
                          next.delete(targetResultId);
                          return next;
                        });
                        setRegeneratingResultId(targetResultId);

                        await handleGenerate({ keepExisting: true, regenerationReason: 'feedback' });
                      } catch (error: any) {
                        console.error('Error submitting feedback:', error);
                        setFeedbackError(error.message || 'Erro ao enviar feedback. Tente novamente.');
                      } finally {
                        setRegeneratingResultId(null);
                        setIsSubmittingFeedback(false);
                      }
                    }}
                    disabled={isSubmittingFeedback}
                    className={`flex-1 font-inter px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                      isSubmittingFeedback
                        ? 'bg-gray-400 text-white cursor-not-allowed opacity-80'
                        : 'bg-gradient-to-r from-[#f8ecda] via-[#e6cda3] to-[#c89a5c] text-[#3f2f1d] hover:shadow-lg active:scale-[0.98]'
                    }`}
                  >
                    {isSubmittingFeedback ? 'Gerando...' : 'Gerar Nova Imagem (Grátis)'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* AI Improvement Modal - Glassmorphic Modal */}
      {showAIImprovementModal && selectedResultForImprovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-inter text-xl font-semibold text-gray-900">
                  Melhore sua modelo com IA
                </h3>
                <p className="font-inter text-sm text-gray-600 mt-1">
                  Descreva livremente como deseja melhorar
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAIImprovementModal(false);
                  setSelectedResultForImprovement(null);
                  setImprovementTextValue('');
                  setImprovementError(null);
                }}
                className="rounded-lg p-2 hover:bg-gray-100/60 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gradient-to-br from-[#fbf4ea]/80 to-[#f3e0c4]/70 backdrop-blur-sm border border-[#f0e0c8]/60 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-[#8a6a3f]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="font-inter text-sm font-medium">
                  Esta melhoria custará 1 crédito
                </p>
              </div>
              <p className="font-inter text-xs text-[#a07b46] mt-1">
                Seus créditos atuais: {userCredits}
              </p>
            </div>

            {userCredits < 1 ? (
              <div className="bg-red-50/60 backdrop-blur-sm border border-red-200/40 rounded-2xl p-4">
                <p className="font-inter text-sm text-red-800">
                  Você não tem créditos suficientes. Por favor, recarregue sua conta.
                </p>
              </div>
            ) : (
              <>
                <textarea
                  placeholder="Ex: Deixar a modelo mais alta, mudar a cor do cabelo para loiro, fazer ela sorrir..."
                  className="w-full h-32 px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-2xl font-inter text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d8b07c]/60 focus:border-transparent resize-none"
                  maxLength={500}
                  value={improvementTextValue}
                  onChange={(event) => {
                    setImprovementTextValue(event.target.value);
                    if (improvementError) setImprovementError(null);
                  }}
                />
                <p className="font-inter text-xs text-gray-500 text-right">
                  {improvementTextValue.length}/500 caracteres
                </p>

                {improvementError && (
                  <p className="font-inter text-sm text-red-600 bg-red-50/80 border border-red-100 rounded-xl px-3 py-2">
                    {improvementError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAIImprovementModal(false);
                      setSelectedResultForImprovement(null);
                      setImprovementTextValue('');
                      setImprovementError(null);
                    }}
                    className="flex-1 font-inter px-4 py-3 bg-white/60 backdrop-blur-sm text-gray-700 text-sm font-medium border border-gray-200/60 rounded-2xl hover:bg-white/80 active:scale-[0.98] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedResultForImprovement) return;
                      if (!improvementTextValue.trim()) {
                        setImprovementError('Por favor, descreva como deseja melhorar a modelo.');
                        return;
                      }

                      setImprovementError(null);
                      setIsSubmittingImprovement(true);

                      try {
                        const response = await fetch('/api/ai/improve-generation', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            resultId: selectedResultForImprovement,
                            improvementText: improvementTextValue.trim(),
                          }),
                        });

                        const payload = await response.json();
                        if (!response.ok || !payload.success) {
                          throw new Error(payload.error || 'Erro ao melhorar imagem');
                        }

                        if (typeof payload.creditsRemaining === 'number') {
                          setUserCredits(payload.creditsRemaining);
                        }

                        const targetResultId = selectedResultForImprovement;
                        setShowAIImprovementModal(false);
                        setSelectedResultForImprovement(null);
                        setImprovementTextValue('');
                        setRegeneratingResultId(targetResultId);

                        await handleGenerate({ keepExisting: true, regenerationReason: 'improvement' });
                      } catch (error: any) {
                        console.error('Error improving generation:', error);
                        setImprovementError(error.message || 'Erro ao melhorar imagem. Tente novamente.');
                      } finally {
                        setRegeneratingResultId(null);
                        setIsSubmittingImprovement(false);
                      }
                    }}
                    disabled={isSubmittingImprovement}
                    className={`flex-1 font-inter px-4 py-3 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      isSubmittingImprovement
                        ? 'bg-gray-400 text-white cursor-not-allowed opacity-80'
                        : 'bg-gradient-to-r from-[#f8ecda] via-[#e6cda3] to-[#c89a5c] text-[#3f2f1d] hover:shadow-lg active:scale-[0.98]'
                    }`}
                  >
                    {isSubmittingImprovement ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-80"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4l4-4-4-4v4a12 12 0 00-12 12h4z"
                          />
                        </svg>
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z"
                          />
                        </svg>
                        <span>Melhorar com IA (1 crédito)</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center gap-3 bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-white/40">
              <div className="w-8 h-8 border-4 border-[#20202a]/30 border-t-[#20202a] rounded-full animate-spin" />
              <p className="font-inter text-sm text-gray-500">Carregando...</p>
            </div>
          </div>
        </div>
      }
    >
      <ResultadoContent />
    </Suspense>
  );
}

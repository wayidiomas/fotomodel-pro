'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Portal } from '@/components/ui/portal';
import { useToast, ToastContainer } from '@/components/ui/toast';
import {
  X,
  User,
  Users,
  Sparkles,
  Check,
  Search,
  Loader2,
  Upload,
  ImagePlus,
} from 'lucide-react';

// Types for database models
interface UserModel {
  id: string;
  model_name: string;
  image_url: string;
  thumbnail_url?: string;
  gender?: string;
  age_range?: string;
  height_cm?: number;
  weight_kg?: number;
  hair_color?: string;
  facial_expression?: string;
}

interface ModelPose {
  id: string;
  name?: string;
  image_url: string;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
  age_range: string;
  ethnicity: string;
  pose_category: string;
}

// Helper function to get full storage URL from relative path
const getStorageUrl = (path: string) => {
  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Build the Supabase storage URL for generated-images bucket
  const supabase = createClient();
  const { data } = supabase.storage.from('generated-images').getPublicUrl(path);
  return data.publicUrl;
};

// Quick model presets for users who don't have saved models
const MODEL_PRESETS = [
  {
    id: 'female-young',
    name: 'Modelo Feminina Jovem',
    gender: 'FEMALE' as const,
    ageRange: '20-30 anos',
    description: 'Mulher jovem, pose natural de catálogo',
    icon: '👩',
  },
  {
    id: 'female-mature',
    name: 'Modelo Feminina Madura',
    gender: 'FEMALE' as const,
    ageRange: '35-50 anos',
    description: 'Mulher elegante, pose sofisticada',
    icon: '👩‍💼',
  },
  {
    id: 'male-young',
    name: 'Modelo Masculino Jovem',
    gender: 'MALE' as const,
    ageRange: '20-30 anos',
    description: 'Homem jovem, pose casual',
    icon: '👨',
  },
  {
    id: 'male-mature',
    name: 'Modelo Masculino Maduro',
    gender: 'MALE' as const,
    ageRange: '35-50 anos',
    description: 'Homem elegante, pose executiva',
    icon: '👨‍💼',
  },
  {
    id: 'non-binary',
    name: 'Modelo Andrógino',
    gender: 'NON_BINARY' as const,
    ageRange: '20-35 anos',
    description: 'Aparência andrógina, pose moderna',
    icon: '🧑',
  },
];

export interface SelectedModel {
  type: 'user_model' | 'model_pose' | 'preset';
  id: string;
  name: string;
  imageUrl?: string;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
  ageRange?: string;
  heightCm?: number;
  weightKg?: number;
  hairColor?: string;
  facialExpression?: string;
}

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (model: SelectedModel) => void;
  selectedModelId?: string;
}

type TabType = 'presets' | 'my-models' | 'poses';

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectModel,
  selectedModelId,
}) => {
  const [activeTab, setActiveTab] = React.useState<TabType>('presets');
  const [userModels, setUserModels] = React.useState<UserModel[]>([]);
  const [modelPoses, setModelPoses] = React.useState<ModelPose[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [genderFilter, setGenderFilter] = React.useState<string>('all');

  // Pagination state for poses
  const [posesPage, setPosesPage] = React.useState(0);
  const [hasMorePoses, setHasMorePoses] = React.useState(true);
  const [isLoadingMorePoses, setIsLoadingMorePoses] = React.useState(false);
  const POSES_PER_PAGE = 24;
  const posesContainerRef = React.useRef<HTMLDivElement>(null);

  // Custom model upload states
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Model info popup states
  const [showModelInfoPopup, setShowModelInfoPopup] = React.useState(false);
  const [pendingUploadFile, setPendingUploadFile] = React.useState<File | null>(null);
  const [pendingFilePreview, setPendingFilePreview] = React.useState<string | null>(null);
  const [customModelName, setCustomModelName] = React.useState('');
  const [customModelAgeMin, setCustomModelAgeMin] = React.useState(20);
  const [customModelAgeMax, setCustomModelAgeMax] = React.useState(35);

  // Toast notifications
  const { toasts, addToast, removeToast } = useToast();

  // Fetch user models and initial poses
  React.useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Reset poses pagination when filters change (use debounced search)
  const [debouncedSearchForFetch, setDebouncedSearchForFetch] = React.useState('');
  const searchFetchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (searchFetchTimeoutRef.current) {
      clearTimeout(searchFetchTimeoutRef.current);
    }
    searchFetchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchForFetch(searchQuery);
    }, 400);

    return () => {
      if (searchFetchTimeoutRef.current) {
        clearTimeout(searchFetchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  React.useEffect(() => {
    if (isOpen && activeTab === 'poses') {
      setModelPoses([]);
      setPosesPage(0);
      setHasMorePoses(true);
      fetchPosesWithFilters(0, true);
    }
  }, [genderFilter, debouncedSearchForFetch, isOpen]);

  const fetchPosesWithFilters = async (page: number, reset: boolean = false) => {
    if (!reset && isLoadingMorePoses) return;

    const supabase = createClient();
    const from = page * POSES_PER_PAGE;
    const to = from + POSES_PER_PAGE - 1;

    try {
      if (!reset) setIsLoadingMorePoses(true);

      let query = supabase
        .from('model_poses')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Apply gender filter
      if (genderFilter !== 'all') {
        query = query.eq('gender', genderFilter);
      }

      // Apply search filter
      if (debouncedSearchForFetch) {
        query = query.or(`name.ilike.%${debouncedSearchForFetch}%,pose_category.ilike.%${debouncedSearchForFetch}%`);
      }

      const { data: poses, count, error } = await query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching poses:', error);
        return;
      }

      if (poses) {
        if (reset) {
          setModelPoses(poses);
        } else {
          setModelPoses((prev) => [...prev, ...poses]);
        }

        // Check if there are more poses to load
        const totalLoaded = (page + 1) * POSES_PER_PAGE;
        setHasMorePoses(count ? totalLoaded < count : poses.length === POSES_PER_PAGE);
        setPosesPage(page);
      }
    } catch (error) {
      console.error('Error fetching poses:', error);
    } finally {
      setIsLoadingMorePoses(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      // Fetch user's saved models
      const { data: models } = await supabase
        .from('user_models')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (models) {
        setUserModels(models);
      }

      // Fetch initial poses (first page)
      await fetchPosesWithFilters(0, true);
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePoses = () => {
    if (hasMorePoses && !isLoadingMorePoses) {
      fetchPosesWithFilters(posesPage + 1, false);
    }
  };

  // Infinite scroll handler for poses
  const handlePosesScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

      // Load more when scrolled to within 200px of bottom
      if (scrollBottom < 200 && hasMorePoses && !isLoadingMorePoses && activeTab === 'poses') {
        loadMorePoses();
      }
    },
    [hasMorePoses, isLoadingMorePoses, activeTab, posesPage]
  );

  const handleSelectPreset = (preset: typeof MODEL_PRESETS[0]) => {
    onSelectModel({
      type: 'preset',
      id: preset.id,
      name: preset.name,
      gender: preset.gender,
      ageRange: preset.ageRange,
    });
    onClose();
  };

  const handleSelectUserModel = (model: UserModel) => {
    onSelectModel({
      type: 'user_model',
      id: model.id,
      name: model.model_name,
      imageUrl: getStorageUrl(model.thumbnail_url || model.image_url),
      gender: (model.gender?.toUpperCase() as 'MALE' | 'FEMALE' | 'NON_BINARY') || 'FEMALE',
      ageRange: model.age_range,
      heightCm: model.height_cm,
      weightKg: model.weight_kg,
      hairColor: model.hair_color,
      facialExpression: model.facial_expression,
    });
    onClose();
  };

  const handleSelectPose = (pose: ModelPose) => {
    onSelectModel({
      type: 'model_pose',
      id: pose.id,
      name: pose.name || `Pose ${pose.pose_category}`,
      imageUrl: pose.image_url,
      gender: pose.gender,
      ageRange: pose.age_range,
    });
    onClose();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        title: 'Formato inválido',
        description: 'Por favor, selecione uma imagem válida (JPG, PNG ou WEBP).',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 10MB.',
      });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    // Store file and show popup
    setPendingUploadFile(file);
    setPendingFilePreview(previewUrl);
    setCustomModelName(`Modelo Personalizado ${new Date().toLocaleDateString('pt-BR')}`);
    setCustomModelAgeMin(20);
    setCustomModelAgeMax(35);
    setShowModelInfoPopup(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelUpload = () => {
    // Clean up preview URL
    if (pendingFilePreview) {
      URL.revokeObjectURL(pendingFilePreview);
    }
    setPendingUploadFile(null);
    setPendingFilePreview(null);
    setShowModelInfoPopup(false);
  };

  const handleConfirmUpload = async () => {
    if (!pendingUploadFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        addToast({
          type: 'error',
          title: 'Não autenticado',
          description: 'Você precisa estar autenticado para enviar modelos.',
        });
        setIsUploading(false);
        return;
      }

      // Create form data with metadata
      const formData = new FormData();
      formData.append('file', pendingUploadFile);
      formData.append('modelName', customModelName);
      formData.append('ageMin', customModelAgeMin.toString());
      formData.append('ageMax', customModelAgeMax.toString());

      // Upload to API endpoint
      const response = await fetch('/api/user-models/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar imagem');
      }

      // Clean up preview URL
      if (pendingFilePreview) {
        URL.revokeObjectURL(pendingFilePreview);
      }

      // Close popup and reset
      setPendingUploadFile(null);
      setPendingFilePreview(null);
      setShowModelInfoPopup(false);

      // Refresh user models list
      await fetchData();

      // Switch to "Meus Modelos" tab
      setActiveTab('my-models');

      // Show success toast
      addToast({
        type: 'success',
        title: 'Modelo salvo!',
        description: 'Seu modelo personalizado foi salvo com sucesso.',
      });
    } catch (error: any) {
      console.error('Error uploading custom model:', error);
      addToast({
        type: 'error',
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível fazer upload do modelo. Tente novamente.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#20202a]/5 to-[#20202a]/10">
              <Users className="h-5 w-5 text-[#20202a]" />
            </div>
            <div>
              <h2 className="font-inter text-lg font-semibold text-gray-900">
                Escolher Modelo
              </h2>
              <p className="font-inter text-xs text-gray-500">
                Selecione o tipo de modelo para sua geração
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-100 px-6 pt-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={cn(
              'px-4 py-2 font-inter text-sm font-medium transition-colors',
              activeTab === 'presets'
                ? 'border-b-2 border-[#20202a] text-[#20202a]'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <ImagePlus className="mb-0.5 mr-1.5 inline-block h-4 w-4" />
            Modelo Personalizado
          </button>
          <button
            onClick={() => setActiveTab('my-models')}
            className={cn(
              'px-4 py-2 font-inter text-sm font-medium transition-colors',
              activeTab === 'my-models'
                ? 'border-b-2 border-[#20202a] text-[#20202a]'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <User className="mb-0.5 mr-1.5 inline-block h-4 w-4" />
            Meus Modelos
            {userModels.length > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs">
                {userModels.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('poses')}
            className={cn(
              'px-4 py-2 font-inter text-sm font-medium transition-colors',
              activeTab === 'poses'
                ? 'border-b-2 border-[#20202a] text-[#20202a]'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Users className="mb-0.5 mr-1.5 inline-block h-4 w-4" />
            Galeria de Poses
          </button>
        </div>

        {/* Content */}
        <div
          ref={posesContainerRef}
          onScroll={handlePosesScroll}
          className="max-h-[60vh] overflow-y-auto p-6"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Custom Model Upload Tab */}
              {activeTab === 'presets' && (
                <div className="space-y-6">
                  {/* Upload Area */}
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={cn(
                        'relative w-full overflow-hidden rounded-3xl border-2 border-dashed bg-gradient-to-br p-12 transition-all',
                        isUploading
                          ? 'cursor-not-allowed border-gray-200 from-gray-50 to-gray-100'
                          : 'border-[#20202a]/20 from-[#f8f1e3]/30 to-[#ebe6d8]/30 hover:border-[#20202a]/40 hover:from-[#f8f1e3]/50 hover:to-[#ebe6d8]/50'
                      )}
                    >
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className={cn(
                          "flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg",
                          isUploading && "animate-pulse"
                        )}>
                          {isUploading ? (
                            <Loader2 className="h-10 w-10 animate-spin text-[#b08c4a]" />
                          ) : (
                            <ImagePlus className="h-10 w-10 text-[#20202a]" />
                          )}
                        </div>
                        <div className="text-center">
                          <h3 className="font-inter text-lg font-semibold text-gray-900">
                            {isUploading ? 'Processando...' : 'Enviar Foto do Modelo'}
                          </h3>
                          <p className="mt-1 font-inter text-sm text-gray-600">
                            {isUploading
                              ? 'Estamos processando sua imagem'
                              : 'Clique para selecionar uma imagem da pessoa'}
                          </p>
                          {!isUploading && (
                            <p className="mt-2 font-inter text-xs text-gray-500">
                              JPG, PNG ou WEBP até 10MB
                            </p>
                          )}
                        </div>
                        {isUploading && uploadProgress > 0 && (
                          <div className="w-full max-w-xs">
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full bg-gradient-to-r from-[#dbcba1] to-[#b08c4a] transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="mt-1 text-center font-inter text-xs text-gray-500">
                              {uploadProgress}%
                            </p>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Instructions */}
                  <div className="rounded-2xl border border-[#e6e0d3] bg-[#f7f2e7]/50 p-6">
                    <h4 className="mb-3 font-inter text-sm font-semibold text-gray-900">
                      Como funciona?
                    </h4>
                    <ul className="space-y-2 font-inter text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#b08c4a] text-xs font-bold text-white">
                          1
                        </span>
                        <span>Envie uma foto clara da pessoa que será o modelo</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#b08c4a] text-xs font-bold text-white">
                          2
                        </span>
                        <span>O modelo será salvo automaticamente em "Meus Modelos"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#b08c4a] text-xs font-bold text-white">
                          3
                        </span>
                        <span>Use o modelo personalizado para criar suas gerações de imagem</span>
                      </li>
                    </ul>
                  </div>

                  {/* Tips */}
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="font-inter text-sm font-medium text-amber-900">
                      💡 Dica: Para melhores resultados
                    </p>
                    <ul className="mt-2 space-y-1 font-inter text-xs text-amber-800">
                      <li>• Use fotos com boa iluminação</li>
                      <li>• Prefira fotos de corpo inteiro ou meio corpo</li>
                      <li>• Evite fotos muito escuras ou desfocadas</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* My Models Tab */}
              {activeTab === 'my-models' && (
                <>
                  {userModels.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="font-inter text-sm font-medium text-gray-900">
                        Nenhum modelo salvo
                      </p>
                      <p className="mt-1 font-inter text-xs text-gray-500">
                        Modelos gerados anteriormente aparecerão aqui
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {/* Filter out duplicates before rendering to avoid React key warnings */}
                      {Array.from(new Map(userModels.map((model) => [model.id, model])).values()).map((model) => (
                        <button
                          key={model.id}
                          onClick={() => handleSelectUserModel(model)}
                          className={cn(
                            'group relative overflow-hidden rounded-2xl border-2 transition-all',
                            selectedModelId === model.id
                              ? 'border-[#20202a]'
                              : 'border-transparent hover:border-gray-200'
                          )}
                        >
                          <div className="aspect-[3/4] bg-gray-100">
                            <Image
                              src={getStorageUrl(model.thumbnail_url || model.image_url)}
                              alt={model.model_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <p className="truncate font-inter text-sm font-medium text-white">
                              {model.model_name}
                            </p>
                            {model.gender && (
                              <p className="font-inter text-xs text-white/70">
                                {model.gender === 'FEMALE' ? 'Feminino' : model.gender === 'MALE' ? 'Masculino' : 'Não-binário'}
                              </p>
                            )}
                          </div>
                          {selectedModelId === model.id && (
                            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#20202a]">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Poses Tab */}
              {activeTab === 'poses' && (
                <>
                  {/* Filters */}
                  <div className="mb-4 flex flex-wrap gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar poses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 font-inter text-sm outline-none focus:border-[#20202a]"
                      />
                    </div>
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-inter text-sm outline-none focus:border-[#20202a]"
                    >
                      <option value="all">Todos</option>
                      <option value="FEMALE">Feminino</option>
                      <option value="MALE">Masculino</option>
                      <option value="NON_BINARY">Não-binário</option>
                    </select>
                  </div>

                  {modelPoses.length === 0 && !isLoadingMorePoses ? (
                    <div className="py-12 text-center">
                      <p className="font-inter text-sm text-gray-500">
                        {searchQuery || genderFilter !== 'all'
                          ? 'Nenhuma pose encontrada com esses filtros'
                          : 'Nenhuma pose disponível'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {/* Filter out duplicates before rendering to avoid React key warnings */}
                        {Array.from(new Map(modelPoses.map((pose) => [pose.id, pose])).values()).map((pose) => (
                          <button
                            key={pose.id}
                            onClick={() => handleSelectPose(pose)}
                            className={cn(
                              'group relative overflow-hidden rounded-xl border-2 transition-all',
                              selectedModelId === pose.id
                                ? 'border-[#20202a]'
                                : 'border-transparent hover:border-gray-200'
                            )}
                          >
                            <div className="aspect-[3/4] bg-gray-100">
                              <Image
                                src={pose.image_url}
                                alt={pose.name || 'Pose'}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 33vw, 25vw"
                              />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="truncate font-inter text-xs font-medium text-white">
                                {pose.name || pose.pose_category.replace(/_/g, ' ')}
                              </p>
                            </div>
                            {selectedModelId === pose.id && (
                              <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#20202a]">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Loading more indicator */}
                      {isLoadingMorePoses && (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          <span className="ml-2 font-inter text-sm text-gray-500">
                            Carregando mais poses...
                          </span>
                        </div>
                      )}

                      {/* End of list indicator */}
                      {!hasMorePoses && modelPoses.length > 0 && (
                        <div className="py-4 text-center">
                          <p className="font-inter text-xs text-gray-400">
                            Todas as {modelPoses.length} poses carregadas
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4">
          <p className="text-center font-inter text-xs text-gray-500">
            O modelo selecionado será usado na próxima geração de imagem
          </p>
        </div>
        </div>
      </div>
    </Portal>

    {/* Model Info Popup */}
    {showModelInfoPopup && pendingFilePreview && (
      <Portal>
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-4xl rounded-[32px] bg-white/85 shadow-2xl p-6 md:p-8 backdrop-blur-xl border border-white/60">
            <button
              onClick={handleCancelUpload}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="space-y-5">
              <div>
                <h2 className="font-inter text-2xl font-bold text-gray-900">Modelo personalizado</h2>
                <p className="font-inter text-sm text-gray-600 mt-1">
                  Revise a imagem selecionada e dê um nome para reutilizar este modelo nas futuras gerações.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Preview */}
                <div className="rounded-[26px] border border-white/40 bg-white/70 backdrop-blur-xl shadow-lg p-4">
                  <div className="relative h-[420px] rounded-2xl overflow-hidden">
                    <Image
                      src={pendingFilePreview}
                      alt="Prévia do modelo"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-[0.3em]">
                      Prévia
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="rounded-[26px] border border-white/50 bg-white/70 backdrop-blur-xl shadow-lg p-5 space-y-4">
                  {/* Model Name */}
                  <div className="space-y-2">
                    <label className="font-inter text-sm font-semibold text-gray-800 uppercase tracking-wide">
                      Nome do modelo
                    </label>
                    <input
                      type="text"
                      value={customModelName}
                      onChange={(e) => setCustomModelName(e.target.value)}
                      className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 font-inter text-sm focus:border-[#20202a] focus:ring-[#20202a] placeholder:text-gray-400 shadow-inner"
                      placeholder="Ex: Modelo cápsula outono"
                    />
                    <p className="text-xs text-gray-500">
                      Use um nome que facilite identificar este modelo na etapa de poses.
                    </p>
                  </div>

                  {/* Age Range */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-inter text-sm font-semibold text-gray-800 uppercase tracking-wide">
                        Faixa de idade
                      </label>
                      <span className="font-inter font-medium text-sm text-gray-600">
                        {customModelAgeMin} - {customModelAgeMax} anos
                      </span>
                    </div>

                    <div className="relative pt-2 pb-4">
                      {/* Slider track background */}
                      <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-200 rounded-full -translate-y-1/2" />

                      {/* Active range highlight */}
                      <div
                        className="absolute top-1/2 h-1.5 bg-[#20202a] rounded-full -translate-y-1/2"
                        style={{
                          left: `${((customModelAgeMin - 1) / 79) * 100}%`,
                          right: `${100 - ((customModelAgeMax - 1) / 79) * 100}%`,
                        }}
                      />

                      {/* Min range input */}
                      <input
                        type="range"
                        min={1}
                        max={80}
                        value={customModelAgeMin}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value <= customModelAgeMax) {
                            setCustomModelAgeMin(value);
                          }
                        }}
                        className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#20202a] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#20202a] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:shadow-md top-1/2 -translate-y-1/2"
                      />

                      {/* Max range input */}
                      <input
                        type="range"
                        min={1}
                        max={80}
                        value={customModelAgeMax}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= customModelAgeMin) {
                            setCustomModelAgeMax(value);
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

                  {/* Info box */}
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-sm text-gray-600">
                    Ao salvar, você poderá reutilizar este modelo nas próximas gerações de imagem.
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      onClick={handleCancelUpload}
                      className="rounded-xl border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white/80"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmUpload}
                      disabled={isUploading || !customModelName.trim()}
                      className={cn(
                        'rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-lg flex items-center justify-center gap-2',
                        isUploading || !customModelName.trim()
                          ? 'bg-gray-200 cursor-not-allowed'
                          : 'bg-[#20202a] hover:bg-[#2c2c38]'
                      )}
                    >
                      {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isUploading ? 'Salvando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    )}

    {/* Toast notifications */}
    <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

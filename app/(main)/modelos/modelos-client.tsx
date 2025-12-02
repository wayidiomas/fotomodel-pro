'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  X,
  Trash2,
  Sparkles,
  User,
  Calendar,
  Library,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserModel {
  id: string;
  model_name: string;
  image_url: string;
  thumbnail_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  facial_expression: string | null;
  hair_color: string | null;
  pose_name: string | null;
  gender: string | null;
  age_min: number | null;
  age_max: number | null;
  age_range: string | null;
  ethnicity: string | null;
  pose_category: string | null;
  garment_categories: string[];
  created_at: string;
}

interface SystemPose {
  id: string;
  name: string | null;
  image_url: string;
  gender: string | null;
  age_min: number | null;
  age_max: number | null;
  age_range: string | null;
  ethnicity: string | null;
  pose_category: string | null;
  garment_categories: string[];
  description: string | null;
  is_featured: boolean;
}

interface ModelosClientProps {
  userModels: UserModel[];
  systemPoses: SystemPose[];
  userCredits: number;
}

const SUPABASE_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/generated-images`
    : null;

const PLACEHOLDER_IMAGE = '/assets/images/generation-flow/clothing-items.png';

const resolvePublicImageUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  const bucketBase = SUPABASE_IMAGES_BUCKET;
  if (!bucketBase) return '';

  return `${bucketBase}/${path.replace(/^\/+/, '')}`;
};

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  NON_BINARY: 'Não-binário',
};

const ETHNICITY_LABELS: Record<string, string> = {
  CAUCASIAN: 'Caucasiano',
  AFRICAN: 'Africano',
  ASIAN: 'Asiático',
  HISPANIC: 'Hispânico',
  MIDDLE_EASTERN: 'Oriente Médio',
  MIXED: 'Miscigenado',
  OTHER: 'Outro',
};

type ActiveTab = 'my-models' | 'library';

export const ModelosClient: React.FC<ModelosClientProps> = ({
  userModels,
  systemPoses,
  userCredits,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('my-models');
  const [selectedModel, setSelectedModel] = React.useState<UserModel | SystemPose | null>(null);
  const [selectedType, setSelectedType] = React.useState<'user' | 'system'>('user');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterGender, setFilterGender] = React.useState<string | null>(null);
  const [filterAgeMin, setFilterAgeMin] = React.useState(1);
  const [filterAgeMax, setFilterAgeMax] = React.useState(80);

  // Filter user models
  const filteredUserModels = React.useMemo(() => {
    let filtered = userModels;

    if (searchTerm) {
      filtered = filtered.filter((model) =>
        model.model_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterGender) {
      filtered = filtered.filter((model) => model.gender === filterGender);
    }

    // Age filter
    filtered = filtered.filter((model) => {
      if (!model.age_min || !model.age_max) return true;
      return model.age_min <= filterAgeMax && model.age_max >= filterAgeMin;
    });

    return filtered;
  }, [userModels, searchTerm, filterGender, filterAgeMin, filterAgeMax]);

  // Filter system poses
  const filteredSystemPoses = React.useMemo(() => {
    let filtered = systemPoses;

    if (searchTerm) {
      filtered = filtered.filter((pose) =>
        pose.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterGender) {
      filtered = filtered.filter((pose) => pose.gender === filterGender);
    }

    // Age filter
    filtered = filtered.filter((pose) => {
      if (!pose.age_min || !pose.age_max) return true;
      return pose.age_min <= filterAgeMax && pose.age_max >= filterAgeMin;
    });

    return filtered;
  }, [systemPoses, searchTerm, filterGender, filterAgeMin, filterAgeMax]);

  const handleUseModel = (modelId: string, isUserModel: boolean) => {
    if (isUserModel) {
      router.push(`/criar?modelId=user-model:${modelId}`);
    } else {
      router.push(`/criar?poseId=${modelId}`);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) return;

    try {
      const response = await fetch(`/api/user-models/${modelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir modelo');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Erro ao excluir modelo. Tente novamente.');
    }
  };

  const handleViewDetails = (model: UserModel | SystemPose, type: 'user' | 'system') => {
    setSelectedModel(model);
    setSelectedType(type);
  };

  const currentModels = activeTab === 'my-models' ? filteredUserModels : filteredSystemPoses;
  const isUserTab = activeTab === 'my-models';

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-inter font-bold text-3xl text-gray-900 mb-2">
              Modelos e Poses
            </h1>
            <p className="font-inter text-base text-gray-600">
              Gerencie seus modelos personalizados ou escolha da biblioteca
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setActiveTab('my-models')}
              className={cn(
                'px-6 py-3 rounded-xl font-inter font-semibold text-sm transition-all',
                activeTab === 'my-models'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-white/60 backdrop-blur text-gray-600 hover:bg-white/80 border border-white/40'
              )}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Meus Modelos ({userModels.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={cn(
                'px-6 py-3 rounded-xl font-inter font-semibold text-sm transition-all',
                activeTab === 'library'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-white/60 backdrop-blur text-gray-600 hover:bg-white/80 border border-white/40'
              )}
            >
              <div className="flex items-center gap-2">
                <Library className="w-4 h-4" />
                Biblioteca ({systemPoses.length})
              </div>
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/40 bg-white/60 backdrop-blur focus:border-gray-400 focus:outline-none font-inter text-sm shadow-sm"
                />
              </div>

              {/* Gender Filter */}
              <select
                value={filterGender || ''}
                onChange={(e) => setFilterGender(e.target.value || null)}
                className="px-4 py-2.5 rounded-xl border border-white/40 bg-white/60 backdrop-blur focus:border-gray-400 focus:outline-none font-inter text-sm shadow-sm"
              >
                <option value="">Todos os gêneros</option>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Feminino</option>
                <option value="NON_BINARY">Não-binário</option>
              </select>
            </div>

            {/* Age Filter */}
            <div className="px-4 py-4 rounded-xl border border-white/40 bg-white/60 backdrop-blur shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-inter font-semibold text-sm text-gray-900">Idade</h3>
                <span className="font-inter font-medium text-sm text-gray-600">
                  {filterAgeMin} - {filterAgeMax} anos
                </span>
              </div>

              <div className="relative pt-2 pb-4">
                {/* Slider track background */}
                <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-200 rounded-full -translate-y-1/2" />

                {/* Active range highlight */}
                <div
                  className="absolute top-1/2 h-1.5 bg-[#20202a] rounded-full -translate-y-1/2"
                  style={{
                    left: `${((filterAgeMin - 1) / 79) * 100}%`,
                    right: `${100 - ((filterAgeMax - 1) / 79) * 100}%`,
                  }}
                />

                {/* Min range input */}
                <input
                  type="range"
                  min={1}
                  max={80}
                  value={filterAgeMin}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value <= filterAgeMax) {
                      setFilterAgeMin(value);
                    }
                  }}
                  className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#20202a] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#20202a] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:shadow-md top-1/2 -translate-y-1/2"
                />

                {/* Max range input */}
                <input
                  type="range"
                  min={1}
                  max={80}
                  value={filterAgeMax}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= filterAgeMin) {
                      setFilterAgeMax(value);
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
          </div>

          {/* Models/Poses Grid */}
          {currentModels.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {currentModels.map((item) => {
                  const isUser = 'model_name' in item;
                  const imageUrl = resolvePublicImageUrl(item.image_url) || PLACEHOLDER_IMAGE;
                  const displayName = isUser
                    ? (item as UserModel).model_name
                    : (item as SystemPose).name || 'Pose sem nome';
                  const createdDate = isUser ? new Date((item as UserModel).created_at) : null;

                  return (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-[30px] border border-white/40 bg-white/60 shadow-[0_20px_50px_rgba(20,20,40,0.1)] backdrop-blur transition-all duration-300 hover:shadow-[0_25px_60px_rgba(20,20,40,0.15)]"
                    >
                      {/* Image */}
                      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={displayName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />

                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                            <button
                              onClick={() => handleUseModel(item.id, isUser)}
                              className="flex-1 px-3 py-2 bg-white text-gray-900 rounded-lg font-inter font-semibold text-xs hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Usar
                            </button>
                            <button
                              onClick={() => handleViewDetails(item, isUser ? 'user' : 'system')}
                              className="flex-1 px-3 py-2 bg-white/90 text-gray-900 rounded-lg font-inter font-semibold text-xs hover:bg-white transition-colors"
                            >
                              Detalhes
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-inter font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                          {displayName}
                        </h3>
                        <p className="font-inter text-xs text-gray-500 mb-3">
                          {item.gender && GENDER_LABELS[item.gender]}
                          {item.age_min && item.age_max && ` · ${item.age_min}-${item.age_max} anos`}
                        </p>

                        {/* Quick Stats */}
                        {createdDate && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {createdDate.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Result count */}
              <div className="mt-8 text-center">
                <p className="font-inter text-sm text-gray-500">
                  Mostrando {currentModels.length}{' '}
                  {currentModels.length === 1
                    ? isUserTab
                      ? 'modelo'
                      : 'pose'
                    : isUserTab
                    ? 'modelos'
                    : 'poses'}
                </p>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="bg-white/60 backdrop-blur rounded-[32px] p-16 text-center shadow-sm border border-white/40">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                {isUserTab ? (
                  <User className="w-10 h-10 text-gray-400" />
                ) : (
                  <Library className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <h3 className="font-inter font-semibold text-xl text-gray-900 mb-3">
                {searchTerm || filterGender
                  ? `Nenhum${isUserTab ? ' modelo' : 'a pose'} encontrad${isUserTab ? 'o' : 'a'}`
                  : isUserTab
                  ? 'Você ainda não tem modelos salvos'
                  : 'Nenhuma pose disponível'}
              </h3>
              <p className="font-inter text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm || filterGender
                  ? 'Tente ajustar os filtros para ver mais resultados'
                  : isUserTab
                  ? 'Salve seus modelos favoritos durante a geração para reutilizá-los depois'
                  : 'A biblioteca de poses está sendo atualizada'}
              </p>
              {!searchTerm && !filterGender && isUserTab && (
                <button
                  onClick={() => router.push('/criar')}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-inter font-semibold text-sm hover:bg-gray-800 transition-colors"
                >
                  Criar primeira geração
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Image Preview */}
              <div className="relative lg:w-2/3 aspect-[3/4] bg-gray-100">
                <Image
                  src={resolvePublicImageUrl(selectedModel.image_url) || PLACEHOLDER_IMAGE}
                  alt={'model_name' in selectedModel ? selectedModel.model_name : selectedModel.name || 'Pose'}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Details Sidebar */}
              <div className="lg:w-1/3 p-6 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-inter font-bold text-xl text-gray-900 mb-1">
                      {'model_name' in selectedModel ? selectedModel.model_name : selectedModel.name || 'Pose'}
                    </h2>
                    <p className="font-inter text-sm text-gray-500">
                      {selectedType === 'user'
                        ? (selectedModel as UserModel).pose_name || 'Modelo personalizado'
                        : (selectedModel as SystemPose).description || 'Pose da biblioteca'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedModel(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Attributes */}
                <div className="flex-1 space-y-4 mb-6">
                  {selectedModel.gender && (
                    <div>
                      <p className="font-inter text-xs font-medium text-gray-500 mb-1">Gênero</p>
                      <p className="font-inter text-sm text-gray-900">
                        {GENDER_LABELS[selectedModel.gender]}
                      </p>
                    </div>
                  )}

                  {selectedModel.age_min && selectedModel.age_max && (
                    <div>
                      <p className="font-inter text-xs font-medium text-gray-500 mb-1">Idade</p>
                      <p className="font-inter text-sm text-gray-900">
                        {selectedModel.age_min}-{selectedModel.age_max} anos
                      </p>
                    </div>
                  )}

                  {selectedType === 'user' && (selectedModel as UserModel).height_cm && (
                    <div>
                      <p className="font-inter text-xs font-medium text-gray-500 mb-1">Altura</p>
                      <p className="font-inter text-sm text-gray-900">
                        {(selectedModel as UserModel).height_cm} cm
                      </p>
                    </div>
                  )}

                  {selectedType === 'user' && (selectedModel as UserModel).weight_kg && (
                    <div>
                      <p className="font-inter text-xs font-medium text-gray-500 mb-1">Peso</p>
                      <p className="font-inter text-sm text-gray-900">
                        {(selectedModel as UserModel).weight_kg} kg
                      </p>
                    </div>
                  )}

                  {selectedType === 'user' && (selectedModel as UserModel).facial_expression && (
                    <div>
                      <p className="font-inter text-xs font-medium text-gray-500 mb-1">Expressão</p>
                      <p className="font-inter text-sm text-gray-900">
                        {(selectedModel as UserModel).facial_expression}
                      </p>
                    </div>
                  )}

                  {selectedType === 'user' && (selectedModel as UserModel).hair_color && (
                    <div>
                      <p className="font-inter text-xs font-medium text-gray-500 mb-1">Cor do cabelo</p>
                      <p className="font-inter text-sm text-gray-900">
                        {(selectedModel as UserModel).hair_color}
                      </p>
                    </div>
                  )}

                  {selectedModel.ethnicity && (
                    <div>
                      <p className="font-inter text-xs font-medium text-gray-500 mb-1">Etnia</p>
                      <p className="font-inter text-sm text-gray-900">
                        {ETHNICITY_LABELS[selectedModel.ethnicity] || selectedModel.ethnicity}
                      </p>
                    </div>
                  )}

                  {selectedType === 'user' && (
                    <div>
                      <p className="font-inter text-xs font-medium text-gray-500 mb-1">Criado em</p>
                      <p className="font-inter text-sm text-gray-900">
                        {new Date((selectedModel as UserModel).created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      handleUseModel(selectedModel.id, selectedType === 'user');
                      setSelectedModel(null);
                    }}
                    className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl font-inter font-semibold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Usar em nova geração
                  </button>

                  {selectedType === 'user' && (
                    <button
                      onClick={() => {
                        handleDeleteModel(selectedModel.id);
                        setSelectedModel(null);
                      }}
                      className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-xl font-inter font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir modelo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

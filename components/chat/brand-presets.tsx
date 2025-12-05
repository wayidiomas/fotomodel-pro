'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Plus, Check, Settings, Trash2, User, Sun, Building2, TreePine } from 'lucide-react';

export interface BrandPreset {
  id: string;
  name: string;
  modelGender: 'female' | 'male' | 'any';
  modelAge: string[];
  backgroundStyle: 'studio' | 'lifestyle' | 'outdoor' | 'any';
  lightingStyle: 'natural' | 'studio' | 'warm' | 'cool';
  color?: string;
}

const DEFAULT_PRESETS: BrandPreset[] = [
  {
    id: 'summer-female',
    name: 'Verão Feminino',
    modelGender: 'female',
    modelAge: ['20-30'],
    backgroundStyle: 'outdoor',
    lightingStyle: 'natural',
    color: 'from-[#f6f0e3] to-[#ede6d8]',
  },
  {
    id: 'formal-male',
    name: 'Formal Masculino',
    modelGender: 'male',
    modelAge: ['30-40'],
    backgroundStyle: 'studio',
    lightingStyle: 'studio',
    color: 'from-[#f2f2f2] to-[#e8e8e8]',
  },
  {
    id: 'casual-young',
    name: 'Casual Jovem',
    modelGender: 'any',
    modelAge: ['18-25'],
    backgroundStyle: 'lifestyle',
    lightingStyle: 'natural',
    color: 'from-[#edeef2] to-[#e4e5e9]',
  },
];

interface BrandPresetsProps {
  presets?: BrandPreset[];
  selectedPresetId?: string;
  onSelectPreset: (preset: BrandPreset) => void;
  onCreatePreset?: (preset: Omit<BrandPreset, 'id'>) => void;
  onDeletePreset?: (presetId: string) => void;
  className?: string;
}

export const BrandPresets: React.FC<BrandPresetsProps> = ({
  presets = DEFAULT_PRESETS,
  selectedPresetId,
  onSelectPreset,
  onCreatePreset,
  onDeletePreset,
  className,
}) => {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newPreset, setNewPreset] = React.useState<Partial<BrandPreset>>({
    modelGender: 'any',
    modelAge: ['20-30'],
    backgroundStyle: 'studio',
    lightingStyle: 'natural',
  });

  const getGenderIcon = (gender: BrandPreset['modelGender']) => {
    return <User className="h-4 w-4" />;
  };

  const getBackgroundIcon = (bg: BrandPreset['backgroundStyle']) => {
    switch (bg) {
      case 'studio':
        return <Settings className="h-4 w-4" />;
      case 'lifestyle':
        return <Building2 className="h-4 w-4" />;
      case 'outdoor':
        return <TreePine className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const handleCreate = () => {
    if (newPreset.name && onCreatePreset) {
      onCreatePreset({
        ...newPreset,
        modelAge: newPreset.modelAge || [],
      } as Omit<BrandPreset, 'id'>);
      setShowCreateModal(false);
      setNewPreset({
        modelGender: 'any',
        modelAge: ['20-30'],
        backgroundStyle: 'studio',
        lightingStyle: 'natural',
      });
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-[#20202a]" />
          <h3 className="font-inter text-sm font-semibold text-gray-900">
            Presets da Marca
          </h3>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 font-inter text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          <Plus className="h-3 w-3" />
          Novo
        </button>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            className={cn(
              'group relative flex flex-col items-start rounded-xl border p-3 text-left transition-all',
              selectedPresetId === preset.id
                ? 'border-[#20202a] bg-[#20202a]/5 ring-1 ring-[#20202a]/20'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm',
              preset.color && `bg-gradient-to-br ${preset.color}`
            )}
          >
            {/* Selection Check */}
            {selectedPresetId === preset.id && (
              <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#20202a]">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}

            {/* Delete Button */}
            {onDeletePreset && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePreset(preset.id);
                }}
                className="absolute right-2 top-2 rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-100"
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </button>
            )}

            <p className="font-inter text-sm font-medium text-gray-900">
              {preset.name}
            </p>

            <div className="mt-2 flex flex-wrap gap-1">
              <span className="flex items-center gap-1 rounded bg-white/60 px-1.5 py-0.5 font-inter text-[10px] text-gray-600">
                {getGenderIcon(preset.modelGender)}
                {preset.modelGender === 'female' ? 'F' : preset.modelGender === 'male' ? 'M' : 'Uni'}
              </span>
              {(preset.modelAge || []).map((age) => (
                <span
                  key={age}
                  className="rounded bg-white/60 px-1.5 py-0.5 font-inter text-[10px] text-gray-600"
                >
                  {age}
                </span>
              ))}
              <span className="flex items-center gap-1 rounded bg-white/60 px-1.5 py-0.5 font-inter text-[10px] text-gray-600">
                {getBackgroundIcon(preset.backgroundStyle)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Info */}
      <p className="font-inter text-xs text-gray-500">
        Presets garantem consistência visual em todas as suas imagens
      </p>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-inter text-lg font-semibold text-gray-900">
                Novo Preset
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {/* Name */}
              <div>
                <label className="font-inter text-xs uppercase tracking-wide text-gray-500">
                  Nome do Preset
                </label>
                <input
                  type="text"
                  value={newPreset.name || ''}
                  onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-inter text-sm text-gray-900 outline-none focus:border-[#20202a]"
                  placeholder="Ex: Campanha Verão 2025"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="font-inter text-xs uppercase tracking-wide text-gray-500">
                  Gênero do Modelo
                </label>
                <div className="mt-2 flex gap-2">
                  {(['female', 'male', 'any'] as const).map((gender) => (
                    <button
                      key={gender}
                      onClick={() => setNewPreset({ ...newPreset, modelGender: gender })}
                      className={cn(
                        'flex-1 rounded-lg border px-3 py-2 font-inter text-sm transition-colors',
                        newPreset.modelGender === gender
                          ? 'border-[#20202a] bg-[#20202a] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {gender === 'female' ? 'Feminino' : gender === 'male' ? 'Masculino' : 'Qualquer'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div>
                <label className="font-inter text-xs uppercase tracking-wide text-gray-500">
                  Faixa Etária
                </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {['18-25', '25-35', '35-45', '45+'].map((age) => {
                const selected = (newPreset.modelAge || []).includes(age);
                return (
                  <button
                    key={age}
                    onClick={() => {
                      const current = newPreset.modelAge || [];
                      const next = selected
                        ? current.filter((a) => a !== age)
                        : [...current, age];
                      setNewPreset({ ...newPreset, modelAge: next });
                    }}
                    className={cn(
                      'rounded-lg border px-3 py-2 font-inter text-sm transition-colors text-center',
                      selected
                        ? 'border-[#20202a] bg-[#20202a] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {age}
                  </button>
                );
              })}
            </div>
              </div>

            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 font-inter text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newPreset.name}
                className="flex-1 rounded-xl bg-[#20202a] py-2.5 font-inter text-sm font-medium text-white transition-transform hover:scale-[1.01] disabled:opacity-50"
              >
                Criar Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

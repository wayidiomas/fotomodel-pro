'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Portal } from '@/components/ui/portal';
import type { AgeRange } from './model-characteristics-selector';

export interface SaveModelData {
  modelName: string;
  gender: string | null;
  ageRange: string | null;
  heightCm: number | null;
  weightKg: number | null;
}

const AGE_RANGES: { value: AgeRange; label: string; description: string }[] = [
  { value: '0-2', label: '0-2 anos', description: 'Bebê' },
  { value: '2-10', label: '2-10 anos', description: 'Criança' },
  { value: '10-15', label: '10-15 anos', description: 'Pré-adolescente' },
  { value: '15-20', label: '15-20 anos', description: 'Adolescente' },
  { value: '20-30', label: '20-30 anos', description: 'Jovem adulto' },
  { value: '30-40', label: '30-40 anos', description: 'Adulto' },
  { value: '40-50', label: '40-50 anos', description: 'Meia idade' },
  { value: '50-60', label: '50-60 anos', description: 'Maduro' },
  { value: '60+', label: '60+ anos', description: 'Sênior' },
];

interface SaveModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: SaveModelData) => Promise<void>;
  initialData?: Partial<SaveModelData>;
}

export const SaveModelModal: React.FC<SaveModelModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialData,
}) => {
  const [modelName, setModelName] = React.useState(
    initialData?.modelName || `Modelo ${new Date().toLocaleDateString('pt-BR')}`
  );
  const [gender, setGender] = React.useState<string | null>(initialData?.gender || null);
  const [ageRange, setAgeRange] = React.useState<string | null>(initialData?.ageRange || null);
  const [heightCm, setHeightCm] = React.useState<string>(
    initialData?.heightCm?.toString() || ''
  );
  const [weightKg, setWeightKg] = React.useState<string>(
    initialData?.weightKg?.toString() || ''
  );
  const [isSaving, setIsSaving] = React.useState(false);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;

      // Prevent scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restore scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!modelName.trim()) {
      alert('Por favor, digite um nome para o modelo.');
      return;
    }

    setIsSaving(true);
    try {
      await onConfirm({
        modelName: modelName.trim(),
        gender,
        ageRange,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
      });
      onClose();
    } catch (error) {
      console.error('Error saving model:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-freight text-2xl font-medium text-gray-900">
              Salvar Modelo
            </h3>
            <p className="mt-1 font-inter text-sm text-gray-600">
              Confirme as informações do modelo
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Nome do Modelo */}
          <div>
            <label className="font-inter text-xs font-medium uppercase tracking-wide text-gray-700">
              Nome do Modelo *
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-2.5 font-inter text-sm text-gray-900 outline-none transition-colors focus:border-[#20202a]"
              placeholder="Ex: Modelo Feminino Campanha"
              required
            />
          </div>

          {/* Gênero */}
          <div>
            <label className="font-inter text-xs font-medium uppercase tracking-wide text-gray-700">
              Gênero
            </label>
            <div className="mt-2 flex gap-2">
              {['Feminino', 'Masculino'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGender(option)}
                  className={cn(
                    'flex-1 rounded-xl border-2 px-3 py-2 font-inter text-sm font-medium transition-all',
                    gender === option
                      ? 'border-[#20202a] bg-[#20202a] text-white'
                      : 'border-white/60 bg-white/60 text-gray-700 hover:bg-white'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Faixa Etária */}
          <div>
            <label className="font-inter text-xs font-medium uppercase tracking-wide text-gray-700">
              Faixa Etária
            </label>
            <select
              value={ageRange || ''}
              onChange={(e) => setAgeRange(e.target.value || null)}
              className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-2.5 font-inter text-sm text-gray-900 outline-none transition-colors focus:border-[#20202a]"
            >
              <option value="">Não especificado</option>
              {AGE_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label} - {range.description}
                </option>
              ))}
            </select>
          </div>

          {/* Altura e Peso */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-inter text-xs font-medium uppercase tracking-wide text-gray-700">
                Altura (cm)
              </label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-2.5 font-inter text-sm text-gray-900 outline-none transition-colors focus:border-[#20202a]"
                placeholder="170"
                min="100"
                max="250"
              />
            </div>
            <div>
              <label className="font-inter text-xs font-medium uppercase tracking-wide text-gray-700">
                Peso (kg)
              </label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-2.5 font-inter text-sm text-gray-900 outline-none transition-colors focus:border-[#20202a]"
                placeholder="60"
                min="30"
                max="200"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 rounded-2xl border border-white/60 bg-white/70 py-2.5 font-inter text-sm font-medium text-gray-700 transition-colors hover:bg-white disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-2xl bg-gradient-to-r from-[#20202a] to-[#2a2a35] py-2.5 font-inter text-sm font-medium text-white transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </Portal>
  );
};

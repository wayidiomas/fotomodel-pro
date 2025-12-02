'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { BackgroundSelector, type BackgroundSelection } from './background-selector';
import type { Tables } from '@/types/database.types';

type BackgroundPreset = Tables<'background_presets'>;

interface BackgroundStepProps {
  enabled: boolean;
  selection: BackgroundSelection | null;
  backgrounds: BackgroundPreset[];
  onToggle: (enabled: boolean) => void;
  onSelectionChange: (selection: BackgroundSelection | null) => void;
}

export function BackgroundStep({
  enabled,
  selection,
  backgrounds,
  onToggle,
  onSelectionChange,
}: BackgroundStepProps) {
  const isOriginalSelection = selection?.type === 'original';

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      onSelectionChange(null);
    }
    onToggle(checked);
  };

  const handleKeepOriginal = () => {
    onToggle(false);
    onSelectionChange({ type: 'original' });
  };

  const handlePersonalize = () => {
    if (!enabled) {
      onToggle(true);
    }
    if (selection?.type === 'original') {
      onSelectionChange(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Cenário e Background</h3>
            <p className="text-xs text-gray-500">
              Escolha manter o fundo original da peça ou personalize com presets, upload ou IA.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleKeepOriginal}
            className={cn(
              'flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all',
              isOriginalSelection
                ? 'border-[#c8b081] bg-[#f8f1e3] text-[#6d4b21] shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-[#d6c299]'
            )}
          >
            Manter fundo original
          </button>
          <button
            type="button"
            onClick={handlePersonalize}
            className={cn(
              'flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all',
              enabled && !isOriginalSelection
                ? 'border-[#20202a] bg-[#20202a] text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-[#20202a]/40'
            )}
          >
            Personalizar fundo
          </button>
        </div>
        {isOriginalSelection && (
          <div className="rounded-xl border border-[#f4e5c8] bg-[#fff9ee] px-4 py-3 text-xs text-[#6d4b21]">
            Vamos manter o cenário original das peças enviadas, preservando luz e ambiente da foto.
          </div>
        )}
      </div>

      {enabled && !isOriginalSelection ? (
        <BackgroundSelector
          value={selection}
          onChange={(next) => {
            onSelectionChange(next);
            if (next) {
              onToggle(true);
            }
          }}
          backgrounds={backgrounds}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            Use esta etapa para alinhar o cenário com sua campanha. Ative a personalização para liberar as opções.
          </p>
          <button
            type="button"
            onClick={handlePersonalize}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#20202a] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2c2c38]"
          >
            Ativar personalização de fundo
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BackgroundSelection } from './background-selector';
import { LogoUploader, type LogoUpload } from './logo-uploader';

export interface AIToolsSelection {
  removeBackground: boolean;
  changeBackground: {
    enabled: boolean;
    selection: BackgroundSelection | null;
  };
  addLogo: {
    enabled: boolean;
    logo: LogoUpload | null;
  };
}

interface AIToolsPanelProps {
  value: AIToolsSelection;
  onChange: (value: AIToolsSelection) => void;
  className?: string;
}

/**
 * Panel component for AI editing tools
 * Displays toggle switches for each tool with cost indicators
 * Shows expandable sections for tools that require additional input
 */
export function AIToolsPanel({
  value,
  onChange,
  className,
}: AIToolsPanelProps) {
  const hasChargeableBackground =
    value.changeBackground.enabled &&
    value.changeBackground.selection &&
    value.changeBackground.selection.type !== 'original';

  // Calculate total credits
  const totalCredits = React.useMemo(() => {
    let total = 0;
    if (value.removeBackground) total += 1;
    if (hasChargeableBackground) total += 1;
    if (value.addLogo.enabled && value.addLogo.logo) total += 1;
    return total;
  }, [value, hasChargeableBackground]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Ferramentas de IA
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Cada ferramenta custa 1 crédito adicional
          </p>
        </div>

        {/* Total credits badge */}
        {totalCredits > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#20202a] text-white rounded-full">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1L9 5L13 6L10 9L11 13L7 11L3 13L4 9L1 6L5 5L7 1Z"
                fill="currentColor"
              />
            </svg>
            <span className="text-xs font-semibold">{totalCredits} crédito{totalCredits !== 1 && 's'}</span>
          </div>
        )}
      </div>

      {/* Background summary */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Background personalizado</span>
                {hasChargeableBackground && (
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Ativo
                  </span>
                )}
                {value.changeBackground.selection?.type === 'original' && (
                  <span className="text-xs text-[#6d4b21] bg-[#f7efdd] px-2 py-0.5 rounded-full">
                    Fundo original
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {value.changeBackground.selection?.type === 'original'
                  ? 'Usaremos o fundo original das peças enviadas.'
                  : value.changeBackground.enabled && value.changeBackground.selection
                  ? 'Configurado na etapa “Background”. Será aplicado automaticamente após a geração.'
                  : 'Nenhum cenário definido. Usaremos o estúdio padrão Fotomodel.'}
              </p>
            </div>
            <span className="text-[11px] text-gray-500">
            Gerencie na etapa “Background”
          </span>
        </div>
      </div>

      {/* Tools list */}
      <div className="space-y-3">
        {/* 1. Remove Background */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  Remover Fundo
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  1 crédito
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Remove o fundo da imagem, deixando-o transparente
              </p>
            </div>
            <input
              type="checkbox"
              checked={value.removeBackground}
              onChange={(e) =>
                onChange({ ...value, removeBackground: e.target.checked })
              }
              className="ml-4 w-5 h-5 rounded border-gray-300 text-[#20202a] focus:ring-[#20202a]"
            />
          </label>
        </div>

        {/* 2. Add Logo */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  Inserir Logo da Marca
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  1 crédito
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Adiciona o logo da sua marca na imagem ou roupa
              </p>
            </div>
            <input
              type="checkbox"
              checked={value.addLogo.enabled}
              onChange={(e) =>
                onChange({
                  ...value,
                  addLogo: {
                    ...value.addLogo,
                    enabled: e.target.checked,
                  },
                })
              }
              className="ml-4 w-5 h-5 rounded border-gray-300 text-[#20202a] focus:ring-[#20202a]"
            />
          </label>

          {/* Expandable logo uploader */}
          {value.addLogo.enabled && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <LogoUploader
                value={value.addLogo.logo}
                onChange={(logo) =>
                  onChange({
                    ...value,
                    addLogo: {
                      ...value.addLogo,
                      logo,
                    },
                  })
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

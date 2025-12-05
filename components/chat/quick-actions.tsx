'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  User,
  ImageIcon,
  Palette,
  Sparkles,
  Layers,
  Eraser,
  Sun,
  Building2,
  TreePine,
  Coffee,
  SlidersHorizontal,
  Check,
  Wand2,
  PenTool,
  Upload,
} from 'lucide-react';
import { CustomActionModal, CustomActionType, CustomActionResult } from './custom-action-modal';
import {
  QuickActionId,
  QuickActionContext,
  getQuickActionPrompt,
  buildQuickActionRequest,
} from '@/lib/chat/quick-action-prompts';

export interface QuickAction {
  id: QuickActionId | string;
  title: string;
  description: string;
  icon: React.ReactNode;
  prompt: string; // Fallback prompt (Portuguese for display)
  category: 'model' | 'background' | 'style' | 'edit';
  color: string;
  isCustom?: boolean; // If true, opens modal instead of applying directly
  customType?: CustomActionType; // Type for custom modal
}

// Re-export for external use
export { getQuickActionPrompt, buildQuickActionRequest };
export type { QuickActionId, QuickActionContext };

/**
 * Helper to get the optimized English prompt for a quick action
 * Use this when sending to the Gemini API
 */
export function getOptimizedPromptForAction(
  action: QuickAction,
  context: {
    garmentCount?: number;
    hasBackground?: boolean;
    hasModel?: boolean;
    hasExistingImage?: boolean;
    customDescription?: string;
  }
): string {
  // Check if it's a known action ID
  const knownActionIds: QuickActionId[] = [
    'add-model-female',
    'add-model-male',
    'background-studio',
    'background-lifestyle-office',
    'background-lifestyle-cafe',
    'background-outdoor',
    'background-custom',
    'style-summer',
    'color-variants',
    'create-look',
    'style-custom',
    'remove-background',
    'enhance-quality',
    'edit-custom',
  ];

  if (knownActionIds.includes(action.id as QuickActionId)) {
    const fullContext: QuickActionContext = {
      hasGarmentImage: (context.garmentCount ?? 0) > 0,
      garmentCount: context.garmentCount ?? 0,
      hasBackgroundImage: context.hasBackground ?? false,
      hasModelImage: context.hasModel ?? false,
      hasExistingGeneration: context.hasExistingImage ?? false,
      customDescription: context.customDescription,
      customBackgroundDescription: context.customDescription,
    };

    return getQuickActionPrompt(action.id as QuickActionId, fullContext);
  }

  // Fallback to the action's prompt (for custom dynamic actions)
  return action.prompt;
}

const QUICK_ACTIONS: QuickAction[] = [
  // Modelo
  {
    id: 'add-model-female',
    title: 'Modelo Feminina',
    description: 'Adicionar modelo feminina vestindo a roupa',
    icon: <User className="h-5 w-5" />,
    prompt: 'Adicione uma modelo feminina profissional vestindo esta roupa. Pose natural de catálogo.',
    category: 'model',
    color: 'from-[#f8f1e3] to-[#ebe6d8]',
  },
  {
    id: 'add-model-male',
    title: 'Modelo Masculino',
    description: 'Adicionar modelo masculino vestindo a roupa',
    icon: <User className="h-5 w-5" />,
    prompt: 'Adicione um modelo masculino profissional vestindo esta roupa. Pose natural de catálogo.',
    category: 'model',
    color: 'from-[#e9ecf2] to-[#dfe3ea]',
  },
  // Fundo
  {
    id: 'background-studio',
    title: 'Fundo Estúdio',
    description: 'Fundo branco/cinza profissional',
    icon: <ImageIcon className="h-5 w-5" />,
    prompt: 'Mude para um fundo de estúdio fotográfico profissional, branco ou cinza claro.',
    category: 'background',
    color: 'from-[#f2f2f2] to-[#e8e8e8]',
  },
  {
    id: 'background-lifestyle-office',
    title: 'Escritório',
    description: 'Ambiente corporativo moderno',
    icon: <Building2 className="h-5 w-5" />,
    prompt: 'Coloque em um ambiente de escritório moderno e elegante.',
    category: 'background',
    color: 'from-[#f1f0ed] to-[#e6e4df]',
  },
  {
    id: 'background-lifestyle-cafe',
    title: 'Cafeteria',
    description: 'Ambiente casual e aconchegante',
    icon: <Coffee className="h-5 w-5" />,
    prompt: 'Coloque em uma cafeteria moderna e aconchegante.',
    category: 'background',
    color: 'from-[#f6f0e3] to-[#ebe4d6]',
  },
  {
    id: 'background-outdoor',
    title: 'Ar Livre',
    description: 'Ambiente externo natural',
    icon: <TreePine className="h-5 w-5" />,
    prompt: 'Coloque em um ambiente externo natural, com boa iluminação.',
    category: 'background',
    color: 'from-[#eef2ed] to-[#e4e8e1]',
  },
  {
    id: 'background-custom',
    title: 'Fundo Personalizado',
    description: 'Descreva ou envie uma imagem',
    icon: <Upload className="h-5 w-5" />,
    prompt: '',
    category: 'background',
    color: 'from-[#e8f4f8] to-[#d9eef4]',
    isCustom: true,
    customType: 'background',
  },
  // Estilo
  {
    id: 'style-summer',
    title: 'Clima Verão',
    description: 'Iluminação quente e ensolarada',
    icon: <Sun className="h-5 w-5" />,
    prompt: 'Aplique uma atmosfera de verão com iluminação quente e ensolarada.',
    category: 'style',
    color: 'from-[#f5f1e6] to-[#ebe4d7]',
  },
  {
    id: 'color-variants',
    title: 'Variantes de Cor',
    description: 'Gerar em outras cores',
    icon: <Palette className="h-5 w-5" />,
    prompt: 'Gere variações desta peça em cores diferentes: preto, branco, azul marinho e vermelho.',
    category: 'style',
    color: 'from-[#ede8f2] to-[#e4dfeb]',
  },
  {
    id: 'create-look',
    title: 'Montar Look',
    description: 'Combinar com outras peças',
    icon: <Layers className="h-5 w-5" />,
    prompt: 'Sugira um look completo combinando esta peça com outras roupas e acessórios.',
    category: 'style',
    color: 'from-[#f3ede7] to-[#e9e1d9]',
  },
  {
    id: 'style-custom',
    title: 'Estilo Personalizado',
    description: 'Descreva o estilo desejado',
    icon: <PenTool className="h-5 w-5" />,
    prompt: '',
    category: 'style',
    color: 'from-[#f0e8f5] to-[#e6dced]',
    isCustom: true,
    customType: 'style',
  },
  // Edição
  {
    id: 'remove-background',
    title: 'Remover Fundo',
    description: 'Fundo transparente/branco',
    icon: <Eraser className="h-5 w-5" />,
    prompt: 'Remova o fundo da imagem, deixando apenas a modelo/roupa com fundo branco limpo.',
    category: 'edit',
    color: 'from-[#f4f2f0] to-[#ece9e5]',
  },
  {
    id: 'enhance-quality',
    title: 'Melhorar Qualidade',
    description: 'Aumentar nitidez e detalhes',
    icon: <Sparkles className="h-5 w-5" />,
    prompt: 'Melhore a qualidade da imagem: aumente a nitidez, melhore as cores e os detalhes da roupa.',
    category: 'edit',
    color: 'from-[#edf2f4] to-[#e3e8ea]',
  },
  {
    id: 'edit-custom',
    title: 'Edição Livre',
    description: 'Descreva suas edições',
    icon: <Wand2 className="h-5 w-5" />,
    prompt: '',
    category: 'edit',
    color: 'from-[#f5f0e8] to-[#ebe4d9]',
    isCustom: true,
    customType: 'edit',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Todas' },
  { id: 'model', label: 'Modelo' },
  { id: 'background', label: 'Fundo' },
  { id: 'style', label: 'Estilo' },
  { id: 'edit', label: 'Edição' },
];

interface QuickActionsProps {
  onSelectAction: (action: QuickAction) => void;
  onCustomAction?: (result: CustomActionResult) => void;
  hasAttachment?: boolean;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onSelectAction,
  onCustomAction,
  hasAttachment = false,
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [showOnlyAvailable, setShowOnlyAvailable] = React.useState(false);
  const [customModalOpen, setCustomModalOpen] = React.useState(false);
  const [customModalType, setCustomModalType] = React.useState<CustomActionType>('edit');

  const filteredActions = React.useMemo(() => {
    return QUICK_ACTIONS.filter((action) => {
      if (selectedCategory !== 'all' && action.category !== selectedCategory) return false;
      const available = hasAttachment || action.category === 'model';
      if (showOnlyAvailable && !available) return false;
      return true;
    });
  }, [selectedCategory, showOnlyAvailable, hasAttachment]);

  const groupedActions = React.useMemo(() => {
    const groups: Record<string, QuickAction[]> = { model: [], background: [], style: [], edit: [] };
    filteredActions.forEach((action) => {
      groups[action.category]?.push(action);
    });
    return groups;
  }, [filteredActions]);

  const handleActionClick = (action: QuickAction) => {
    if (action.isCustom && action.customType) {
      setCustomModalType(action.customType);
      setCustomModalOpen(true);
    } else {
      onSelectAction(action);
    }
  };

  const handleCustomConfirm = (result: CustomActionResult) => {
    if (onCustomAction) {
      onCustomAction(result);
    } else {
      // Fallback: create a QuickAction from the result
      const fakeAction: QuickAction = {
        id: `custom-${result.type}-${Date.now()}`,
        title: result.type === 'edit' ? 'Edição Livre' : result.type === 'style' ? 'Estilo Personalizado' : 'Fundo Personalizado',
        description: result.prompt.slice(0, 50) + (result.prompt.length > 50 ? '...' : ''),
        icon: <Wand2 className="h-5 w-5" />,
        prompt: result.prompt,
        category: result.type === 'edit' ? 'edit' : result.type === 'style' ? 'style' : 'background',
        color: 'from-[#f5f0e8] to-[#ebe4d9]',
      };
      onSelectAction(fakeAction);
    }
  };

  return (
    <div className={cn('space-y-1.5 max-w-5xl w-full mx-auto', className)}>
      {/* Header - Compact */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-[#20202a]" />
            <h3 className="font-inter text-[11px] font-semibold text-gray-900">Ações Rápidas</h3>
          </div>
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex items-center gap-1 rounded-md border border-white/50 bg-white/80 px-1 py-0.5 shadow-sm backdrop-blur">
            <SlidersHorizontal className="h-2.5 w-2.5 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-5 rounded border border-gray-200 bg-white px-1 text-[9px] font-semibold text-gray-700 outline-none focus:border-[#20202a]"
            >
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowOnlyAvailable((prev) => !prev)}
            className={cn(
              'flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold transition',
              showOnlyAvailable
                ? 'border-[#20202a] bg-[#20202a] text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            )}
          >
            <Check className="h-2.5 w-2.5" />
            Disponíveis
          </button>
        </div>
      </div>

      {/* Sections by category - Compact */}
      {(['model', 'background', 'style', 'edit'] as const).map((catId) => {
        const actions = groupedActions[catId];
        if (!actions || actions.length === 0) return null;

        const categoryLabel = CATEGORIES.find((c) => c.id === catId)?.label || '';

        return (
          <div key={catId} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <p className="font-inter text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                {categoryLabel}
              </p>
              {!hasAttachment && catId !== 'model' && (
                <span className="rounded-full bg-amber-50 px-1 py-0.5 text-[8px] font-semibold text-amber-700">
                  Envie imagem
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1 md:grid-cols-5 lg:grid-cols-6">
              {actions.map((action) => {
                const available = hasAttachment || action.category === 'model';
                const isCustomAction = action.isCustom;

                return (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action)}
                    disabled={!available}
                    className={cn(
                      'group relative flex flex-col gap-0.5 rounded-lg border bg-white/55 p-1.5 text-left shadow-sm backdrop-blur-lg transition-all',
                      'hover:-translate-y-0.5 hover:shadow-md',
                      isCustomAction
                        ? 'border-dashed border-[#20202a]/30 hover:border-[#20202a]/60'
                        : 'border-white/60',
                      !available && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-md border [&>svg]:h-3 [&>svg]:w-3',
                        isCustomAction
                          ? 'border-[#20202a]/20 bg-[#20202a]/5 text-[#20202a]'
                          : 'border-[#e6e0d3] bg-[#f7f2e7] text-[#2c261d]'
                      )}
                    >
                      {action.icon}
                    </div>
                    <p className="font-inter text-[9px] font-semibold text-[#0f172a] line-clamp-1">
                      {action.title}
                    </p>
                    {!available && (
                      <span className="absolute right-1 top-1 rounded-full bg-gray-100 px-0.5 py-0.5 text-[7px] font-semibold text-gray-500">
                        ↑
                      </span>
                    )}
                    {available && isCustomAction && (
                      <span className="absolute right-1 top-1 rounded-full bg-[#20202a]/10 px-0.5 py-0.5 text-[7px] font-semibold text-[#20202a]">
                        +
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Empty state - Compact */}
      {filteredActions.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-200 bg-white/70 p-2 text-center">
          <Sparkles className="h-3 w-3 text-gray-500" />
          <p className="font-inter text-[10px] font-semibold text-gray-800">Nenhuma ação</p>
          <p className="font-inter text-[9px] text-gray-600">
            Ajuste filtro ou envie imagem
          </p>
        </div>
      )}

      {/* Tip - Compact */}
      <div className="rounded-md border border-[#e6e0d3] bg-[#f7f2e7] px-2 py-1 text-[#2c261d]">
        <p className="font-inter text-[9px]">
          <strong className="font-semibold">Dica:</strong> Envie foto e clique em ação. Use + para personalizar.
        </p>
      </div>

      {/* Custom Action Modal */}
      <CustomActionModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onConfirm={handleCustomConfirm}
        type={customModalType}
      />
    </div>
  );
};

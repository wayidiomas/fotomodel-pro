'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Shirt,
  User,
  ImageIcon,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export interface ChatAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
}

interface ChatActionBarProps {
  onUploadGarment: () => void;
  onSelectFromWardrobe?: () => void; // Deprecated - handled by onUploadGarment modal
  onSelectModel: () => void;
  onUploadBackground: () => void;
  garmentCount?: number;
  modelSelected?: boolean;
  backgroundSelected?: boolean;
  className?: string;
  forceCollapsed?: boolean; // Force collapse from parent
  isNewConversation?: boolean; // If true, keep expanded with golden pulsing border
}

export const ChatActionBar: React.FC<ChatActionBarProps> = ({
  onUploadGarment,
  onSelectModel,
  onUploadBackground,
  garmentCount = 0,
  modelSelected = false,
  backgroundSelected = false,
  className,
  forceCollapsed = false,
  isNewConversation = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  // Auto-collapse when forceCollapsed is true
  React.useEffect(() => {
    if (forceCollapsed) {
      setIsExpanded(false);
    }
  }, [forceCollapsed]);

  // Keep expanded if it's a new conversation
  React.useEffect(() => {
    if (isNewConversation) {
      setIsExpanded(true);
    }
  }, [isNewConversation]);

  // When forceCollapsed is true or isNewConversation controls expansion
  const effectiveExpanded = forceCollapsed ? false : (isNewConversation ? true : isExpanded);

  // Determine which action should have golden pulsing border (progressive flow)
  const getActionHighlight = (actionId: string): 'golden' | 'gray' | 'none' => {
    if (!isNewConversation) return 'none';

    // Progressive flow logic
    if (garmentCount === 0) {
      // Step 1: Need to add garment first
      return actionId === 'add-garment' ? 'golden' : 'gray';
    } else if (!modelSelected) {
      // Step 2: Garment added, need to select model
      return actionId === 'select-model' ? 'golden' : 'gray';
    } else {
      // Step 3: Both garment and model selected, background is optional (costs +1 credit)
      return actionId === 'upload-background' ? 'golden' : 'none';
    }
  };

  const actions: ChatAction[] = [
    {
      id: 'add-garment',
      label: 'Adicionar Peça',
      description: 'Upload ou vestuário',
      icon: <Shirt className="h-5 w-5" />,
      onClick: onUploadGarment,
      badge: garmentCount > 0 ? `${garmentCount}` : undefined,
    },
    {
      id: 'select-model',
      label: 'Escolher Modelo',
      description: 'Selecionar tipo de modelo',
      icon: <User className="h-5 w-5" />,
      onClick: onSelectModel,
      badge: modelSelected ? '✓' : undefined,
    },
    {
      id: 'upload-background',
      label: 'Fundo Personalizado',
      description: 'Subir imagem de fundo',
      icon: <ImageIcon className="h-5 w-5" />,
      onClick: onUploadBackground,
      badge: backgroundSelected
        ? '✓'
        : isNewConversation && garmentCount > 0 && modelSelected
          ? '+1 crédito'
          : undefined,
    },
  ];

  return (
    <div className={cn('w-full', className)}>
      {/* Toggle Button */}
      <button
        onClick={() => !isNewConversation && setIsExpanded(!isExpanded)}
        disabled={forceCollapsed || isNewConversation}
        className={cn(
          "mb-2 flex w-full items-center justify-between rounded-xl bg-white/60 px-3 py-2 backdrop-blur-sm transition-colors hover:bg-white/80",
          forceCollapsed && "cursor-not-allowed opacity-60",
          isNewConversation && "cursor-default"
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#20202a]" />
          <span className="font-inter text-sm font-medium text-gray-700">
            Ações Rápidas
          </span>
          {garmentCount > 0 && (
            <span className="rounded-full bg-[#20202a] px-2 py-0.5 font-inter text-xs text-white">
              {garmentCount} peça{garmentCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {effectiveExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Actions Grid */}
      {effectiveExpanded && (
        <div className="grid grid-cols-3 gap-2">
          {actions.map((action) => {
            const highlight = getActionHighlight(action.id);

            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  'group relative flex flex-col items-center gap-2 rounded-2xl border-2 bg-white/80 p-3 text-center shadow-sm backdrop-blur-sm transition-all',
                  'hover:-translate-y-0.5 hover:shadow-md',
                  action.disabled && 'cursor-not-allowed opacity-50',
                  highlight === 'golden' && 'border-amber-400',
                  highlight === 'gray' && 'border-gray-300',
                  highlight === 'none' && 'border-white/60 hover:border-[#20202a]/20'
                )}
                style={
                  highlight === 'golden'
                    ? {
                        animation: 'pulse-golden-border 2s ease-in-out infinite',
                      }
                    : highlight === 'gray'
                      ? {
                          animation: 'pulse-gray-border 2s ease-in-out infinite',
                        }
                      : undefined
                }
              >
                {/* Badge */}
                {action.badge && (
                  <span
                    className={cn(
                      'absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 font-inter text-xs font-medium',
                      action.badge === '+1 crédito'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md'
                        : 'bg-[#20202a] text-white'
                    )}
                  >
                    {action.badge}
                  </span>
                )}

                {/* Icon */}
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 shadow-sm transition-colors group-hover:from-[#20202a]/5 group-hover:to-[#20202a]/10 group-hover:text-[#20202a]">
                  {action.icon}
                </div>

                {/* Text */}
                <div>
                  <p className="font-inter text-xs font-medium text-gray-900">
                    {action.label}
                  </p>
                  <p className="hidden font-inter text-[10px] text-gray-500 sm:block">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

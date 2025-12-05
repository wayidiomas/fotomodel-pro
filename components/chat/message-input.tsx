'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import type { ChatAttachment } from './chat-interface';
import { ChatActionBar } from './chat-action-bar';
import { ModelSelectorModal, SelectedModel } from './model-selector-modal';
import { WardrobeSelectorModal, SelectedGarment } from './wardrobe-selector-modal';
import {
  ModelCharacteristicsSelector,
  ModelCharacteristics,
} from './model-characteristics-selector';
import { UploadGarmentModal, UploadedGarment } from './upload-garment-modal';

interface MessageInputProps {
  conversationId: string | null;
  onSendMessage: (content: string, attachments: ChatAttachment[]) => Promise<boolean>;
  isLoading: boolean;
  userCredits: number;
  draft: {
    message: string;
    attachments: ChatAttachment[];
  };
  onDraftChange: (draft: { message: string; attachments: ChatAttachment[] }) => void;
  isNewConversation?: boolean; // If true, keep quick actions expanded with golden border
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  onSendMessage,
  isLoading,
  userCredits,
  draft,
  onDraftChange,
  isNewConversation = false,
}) => {
  const [message, setMessage] = React.useState(draft.message || '');
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>(draft.attachments || []);
  const [isFocused, setIsFocused] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Modal states
  const [showModelSelector, setShowModelSelector] = React.useState(false);
  const [showWardrobeSelector, setShowWardrobeSelector] = React.useState(false);
  const [showUploadGarmentModal, setShowUploadGarmentModal] = React.useState(false);

  // Model characteristics (optional)
  const [modelCharacteristics, setModelCharacteristics] = React.useState<ModelCharacteristics>({});
  const [showCharacteristics, setShowCharacteristics] = React.useState(false);
  const [characteristicsExpanded, setCharacteristicsExpanded] = React.useState(false);

  // File input ref for background
  const backgroundInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-collapse characteristics when loading starts
  React.useEffect(() => {
    if (isLoading) {
      setCharacteristicsExpanded(false);
    }
  }, [isLoading]);

  // Helper to get characteristics summary text
  const getCharacteristicsSummary = () => {
    const parts: string[] = [];
    if (modelCharacteristics.gender) {
      parts.push(modelCharacteristics.gender === 'FEMALE' ? 'Feminino' : 'Masculino');
    }
    if (modelCharacteristics.ageRange) {
      parts.push(modelCharacteristics.ageRange);
    }
    if (modelCharacteristics.bodySize) {
      const bodySizeLabels: Record<string, string> = {
        slim: 'Magro',
        average: 'Médio',
        athletic: 'Atlético',
        curvy: 'Curvilíneo',
        plus: 'Plus Size',
      };
      parts.push(bodySizeLabels[modelCharacteristics.bodySize] || modelCharacteristics.bodySize);
    }
    return parts.length > 0 ? parts.join(' • ') : 'Não definido';
  };

  const lastMessageRef = React.useRef<string>('');

  // Track draft from parent to detect external changes
  const lastParentDraftRef = React.useRef<string>('');
  const isInternalUpdateRef = React.useRef(false);

  // Sync draft from parent to local state (only when parent draft ACTUALLY changes externally)
  React.useEffect(() => {
    const draftMessage = draft.message || '';
    const draftAttachments = draft.attachments || [];

    const parentDraftSerialized = JSON.stringify({
      conversationId,
      message: draftMessage,
      attachments: draftAttachments,
    });

    // If this is the same draft we already processed, skip
    if (parentDraftSerialized === lastParentDraftRef.current) {
      return;
    }

    // If this update was triggered by our own onDraftChange, skip
    if (isInternalUpdateRef.current) {
      lastParentDraftRef.current = parentDraftSerialized;
      isInternalUpdateRef.current = false;
      return;
    }

    // External change from parent - update local state
    lastParentDraftRef.current = parentDraftSerialized;
    setMessage(draftMessage);
    setAttachments(draftAttachments);
  }, [draft, conversationId]);

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Auto-focus when message changes externally (e.g., from improve request)
  React.useEffect(() => {
    if (message && message !== lastMessageRef.current && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.setSelectionRange(message.length, message.length);
    }
    lastMessageRef.current = message;
  }, [message]);

  const lastNotifiedRef = React.useRef<string>('');
  React.useEffect(() => {
    const serialized = JSON.stringify({ message, attachments });
    if (serialized === lastNotifiedRef.current) {
      return;
    }
    lastNotifiedRef.current = serialized;

    // Mark as internal update so the sync effect doesn't re-apply these changes
    isInternalUpdateRef.current = true;
    onDraftChange({ message, attachments });
  }, [message, attachments, onDraftChange]);

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (isLoading) return;

    const success = await onSendMessage(message.trim(), attachments);

    if (success) {
      setMessage('');
      setAttachments([]);
      setModelCharacteristics({});
      setShowCharacteristics(false);
      setCharacteristicsExpanded(false);
      // Close all modals
      setShowModelSelector(false);
      setShowWardrobeSelector(false);
      setShowUploadGarmentModal(false);
      textareaRef.current?.focus();
      onDraftChange({ message: '', attachments: [] });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handler for garment uploaded from computer via modal
  const handleGarmentFromComputer = (garment: UploadedGarment) => {
    setAttachments((prev) => [
      ...prev,
      {
        type: 'garment',
        url: garment.previewUrl,
        base64Data: garment.base64Data,
        mimeType: garment.mimeType,
        metadata: {
          name: garment.name,
          category: garment.category,
          garmentType: garment.category,
          description: garment.description,
        },
      },
    ]);
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];

      setAttachments((prev) => [
        ...prev,
        {
          type: 'background',
          url: base64String,
          base64Data,
          mimeType: file.type,
        },
      ]);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handler for selecting a model
  const handleSelectModel = (model: SelectedModel) => {
    const modelAttachment: ChatAttachment = {
      type: 'model',
      referenceId: model.id,
      url: model.imageUrl || '',
      metadata: {
        name: model.name,
        gender: model.gender,
        ageRange: model.ageRange || modelCharacteristics.ageRange,
        heightCm: model.heightCm,
        weightKg: model.weightKg,
        bodySize: modelCharacteristics.bodySize,
      },
    };

    // Use functional update to avoid stale closure issues
    // This preserves improve_reference and other non-model attachments
    setAttachments((prev) => {
      const filteredAttachments = prev.filter((a) => a.type !== 'model');
      return [...filteredAttachments, modelAttachment];
    });
    // Show characteristics section after selecting model
    setShowCharacteristics(true);
  };

  // Update characteristics in existing model attachment
  React.useEffect(() => {
    if (!modelCharacteristics.ageRange && !modelCharacteristics.bodySize) return;

    // Use functional update to find model index from current state, not stale closure
    setAttachments((prev) => {
      const modelIndex = prev.findIndex((a) => a.type === 'model');
      if (modelIndex === -1) return prev;

      const updated = [...prev];
      updated[modelIndex] = {
        ...updated[modelIndex],
        metadata: {
          ...updated[modelIndex].metadata,
          ageRange: modelCharacteristics.ageRange || updated[modelIndex].metadata?.ageRange,
          bodySize: modelCharacteristics.bodySize,
        },
      };
      return updated;
    });
  }, [modelCharacteristics]);

  // Handler for selecting garments from wardrobe
  const handleSelectFromWardrobe = (garments: SelectedGarment[]) => {
    const garmentAttachments: ChatAttachment[] = garments.map((garment) => ({
      type: 'garment' as const,
      referenceId: garment.uploadId,
      url: garment.thumbnailUrl || garment.imageUrl,
      metadata: {
        name: garment.name,
        category: garment.category,
        garmentType: garment.garmentType,
      },
    }));

    // Use functional update to avoid stale closure issues
    // This preserves improve_reference and other non-garment attachments
    setAttachments((prev) => {
      const nonGarmentAttachments = prev.filter((a) => a.type !== 'garment');
      return [...nonGarmentAttachments, ...garmentAttachments];
    });
  };

  // Computed values for action bar
  const garmentCount = attachments.filter((a) => a.type === 'garment').length;
  const modelSelected = attachments.some((a) => a.type === 'model');
  const backgroundSelected = attachments.some((a) => a.type === 'background');
  const selectedModelId = attachments.find((a) => a.type === 'model')?.referenceId;

  return (
    <div className="sticky bottom-4 z-20 px-4 pb-4 md:px-8">
      <div className="mx-auto max-w-5xl rounded-[24px] border border-white/50 bg-white/75 px-3 py-2.5 shadow-[0_16px_38px_rgba(15,23,42,0.1)] backdrop-blur-2xl">
        {/* Attachments Preview - Compact horizontal strip */}
        {attachments.length > 0 && (
          <div className="mb-2 flex items-center gap-3 overflow-x-auto pb-1 pt-1">
            <span className="flex-shrink-0 font-inter text-xs text-gray-500">
              Selecionados:
            </span>
            {attachments.map((attachment, idx) => (
              <div
                key={idx}
                className="group relative h-12 w-12 flex-shrink-0"
              >
                <div className="h-full w-full overflow-hidden rounded-lg border border-white/60 bg-white/80 shadow">
                  <img
                    src={attachment.url}
                    alt={`Anexo ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 px-0.5 py-px">
                    <p className="truncate text-center font-inter text-[8px] text-white">
                      {attachment.type === 'garment'
                        ? 'Roupa'
                        : attachment.type === 'model'
                          ? 'Modelo'
                          : (attachment.type as any) === 'improve_reference'
                            ? 'Editar'
                            : 'Fundo'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 shadow-md transition-transform hover:scale-110"
                >
                  <svg
                    className="h-2.5 w-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Bar - Collapse when loading */}
        <ChatActionBar
          onUploadGarment={() => setShowUploadGarmentModal(true)}
          onSelectModel={() => setShowModelSelector(true)}
          onUploadBackground={() => backgroundInputRef.current?.click()}
          garmentCount={garmentCount}
          modelSelected={modelSelected}
          backgroundSelected={backgroundSelected}
          forceCollapsed={isLoading}
          isNewConversation={isNewConversation}
          className="mb-2"
        />

        {/* Model Characteristics Selector (optional) - Collapsible */}
        {(showCharacteristics || modelSelected) && (
          <div className="mb-2 overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-sm">
            {/* Collapsed Header - Always visible */}
            <button
              onClick={() => setCharacteristicsExpanded(!characteristicsExpanded)}
              className="flex w-full items-center justify-between px-3 py-2 transition-colors hover:bg-white/50"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-gray-500" />
                <span className="font-inter text-xs font-medium text-gray-700">
                  Personalizar modelo
                </span>
                <span className="font-inter text-xs text-gray-400">
                  {getCharacteristicsSummary()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(modelCharacteristics.gender || modelCharacteristics.ageRange || modelCharacteristics.bodySize) && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setModelCharacteristics({});
                      if (!modelSelected) setShowCharacteristics(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        e.preventDefault();
                        setModelCharacteristics({});
                        if (!modelSelected) setShowCharacteristics(false);
                      }
                    }}
                    className="cursor-pointer font-inter text-xs text-gray-400 hover:text-gray-600"
                  >
                    Limpar
                  </span>
                )}
                {characteristicsExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {characteristicsExpanded && (
              <div className="border-t border-white/60 px-3 pb-3 pt-2">
                <ModelCharacteristicsSelector
                  value={modelCharacteristics}
                  onChange={setModelCharacteristics}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        )}

        {/* Hidden file input for background */}
        <input
          ref={backgroundInputRef}
          type="file"
          accept="image/*"
          onChange={handleBackgroundUpload}
          className="hidden"
        />

        {/* Input Area */}
        <div
          className={cn(
            'rounded-3xl border-2 bg-white/80 shadow-lg backdrop-blur-lg transition-colors',
            isFocused
              ? 'border-[#20202a]'
              : isNewConversation && garmentCount > 0 && modelSelected
                ? 'border-amber-400'
                : 'border-white/50'
          )}
          style={
            isNewConversation && garmentCount > 0 && modelSelected && !isFocused
              ? {
                  animation: 'pulse-golden-border 2s ease-in-out infinite',
                }
              : undefined
          }
        >
          <div className="flex items-end gap-2 p-2.5">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
              disabled={isLoading}
              className="flex-1 resize-none bg-transparent font-inter text-sm text-gray-900 placeholder-gray-400 outline-none disabled:opacity-50"
              rows={1}
              style={{ maxHeight: '200px' }}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isLoading || (!message.trim() && attachments.length === 0)}
              className={cn(
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                isLoading || (!message.trim() && attachments.length === 0)
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'bg-[#20202a] text-white hover:bg-[#20202a]/90'
              )}
            >
              {isLoading ? (
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Compact Footer - Credits only */}
          <div className="flex items-center justify-end px-3 py-1.5">
            <div className="flex items-center gap-1">
              <svg
                className="h-3 w-3 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-inter text-[10px] text-gray-500">
                {userCredits} créditos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Selector Modal */}
      <ModelSelectorModal
        isOpen={showModelSelector}
        onClose={() => setShowModelSelector(false)}
        onSelectModel={handleSelectModel}
        selectedModelId={selectedModelId}
      />

      {/* Wardrobe Selector Modal */}
      <WardrobeSelectorModal
        isOpen={showWardrobeSelector}
        onClose={() => setShowWardrobeSelector(false)}
        onSelectGarments={handleSelectFromWardrobe}
        selectedIds={attachments
          .filter((a) => a.type === 'garment' && a.referenceId)
          .map((a) => a.referenceId as string)}
        multiSelect={true}
        maxSelection={2}
      />

      {/* Upload Garment Modal */}
      <UploadGarmentModal
        isOpen={showUploadGarmentModal}
        onClose={() => setShowUploadGarmentModal(false)}
        onSelectComputer={handleGarmentFromComputer}
        onSelectWardrobe={() => {
          setShowUploadGarmentModal(false);
          setShowWardrobeSelector(true);
        }}
      />
    </div>
  );
};

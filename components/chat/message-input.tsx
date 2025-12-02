'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ChatAttachment } from './chat-interface';

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
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  onSendMessage,
  isLoading,
  userCredits,
  draft,
  onDraftChange,
}) => {
  const [message, setMessage] = React.useState(draft.message || '');
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>(draft.attachments || []);
  const [isFocused, setIsFocused] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const lastDraftRef = React.useRef<string>('');
  React.useEffect(() => {
    const serialized = JSON.stringify({
      conversationId,
      message: draft.message || '',
      attachments: draft.attachments || [],
    });

    if (serialized === lastDraftRef.current) {
      return;
    }

    lastDraftRef.current = serialized;
    setMessage(draft.message || '');
    setAttachments(draft.attachments || []);
  }, [draft, conversationId]);

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const lastNotifiedRef = React.useRef<string>('');
  React.useEffect(() => {
    const serialized = JSON.stringify({ message, attachments });
    if (serialized === lastNotifiedRef.current) {
      return;
    }
    lastNotifiedRef.current = serialized;
    onDraftChange({ message, attachments });
  }, [message, attachments, onDraftChange]);

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (isLoading) return;

    const success = await onSendMessage(message.trim(), attachments);

    if (success) {
      setMessage('');
      setAttachments([]);
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

  const handleGarmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1]; // Remove data:image/...;base64, prefix

      setAttachments((prev) => [
        ...prev,
        {
          type: 'garment',
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

  return (
    <div className="border-t border-white/40 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl px-4 py-4">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="group relative h-20 w-20 overflow-hidden rounded-lg border border-white/60 bg-white/80 shadow"
              >
                <img
                  src={attachment.url}
                  alt={`Anexo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <svg
                    className="h-3 w-3 text-white"
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
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                  <p className="truncate font-inter text-[10px] text-white">
                    {attachment.type === 'garment' ? 'Roupa' : 'Fundo'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div
          className={cn(
            'rounded-3xl border-2 border-white/50 bg-white/80 shadow-xl backdrop-blur-lg transition-colors',
            isFocused ? 'border-[#20202a]' : 'border-white/50'
          )}
        >
          <div className="flex items-end gap-2 p-3">
            {/* Attachment Buttons */}
            <div className="flex gap-1">
              {/* Garment Upload */}
              <label
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                title="Adicionar roupa"
              >
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGarmentUpload}
                  className="hidden"
                />
              </label>

              {/* Background Upload */}
              <label
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                title="Adicionar fundo"
              >
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  className="hidden"
                />
              </label>
            </div>

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

          {/* Footer Info */}
          <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
            <p className="font-inter text-xs text-gray-500">
              Shift + Enter para nova linha
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <svg
                  className="h-3.5 w-3.5 text-gray-400"
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
                <span className="font-inter text-xs text-gray-600">
                  {userCredits} créditos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-2 text-center font-inter text-xs text-gray-500">
          A IA irá fazer perguntas antes de gerar (gratuito). Geração: 2 créditos
        </p>
      </div>
    </div>
  );
};

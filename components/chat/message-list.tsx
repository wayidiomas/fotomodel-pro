'use client';

import * as React from 'react';
import { ChatMessage as ChatMessageComponent } from './chat-message';
import type { ChatMessage } from './chat-interface';

interface EditContext {
  imageUrl: string;
  referenceId: string;
}

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  userId: string;
  onImproveRequest?: (imageUrl: string, generationId: string) => void;
  editContext?: EditContext | null;
  onClearEditContext?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  userId,
  onImproveRequest,
  editContext,
  onClearEditContext,
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 bg-gradient-to-b from-[#f7f6f1]/70 via-white/50 to-transparent">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="space-y-6">
          {/* Edit Context - Shows the image being edited from /criar flow */}
          {editContext && messages.length === 0 && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#20202a] to-[#2a2a35] text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z"
                  />
                </svg>
              </div>
              <div className="flex-1 space-y-3">
                <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow">
                  <p className="font-inter text-sm text-gray-900">
                    Aqui está a imagem que você quer editar. Descreva as alterações desejadas:
                  </p>
                </div>
                <div className="relative w-fit overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-lg">
                  <img
                    src={editContext.imageUrl}
                    alt="Imagem para edição"
                    className="max-h-[400px] w-auto object-contain"
                  />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
                      <svg className="h-3.5 w-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                      Imagem original
                    </span>
                  </div>
                  {onClearEditContext && (
                    <button
                      onClick={onClearEditContext}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label="Remover imagem"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="font-inter text-xs text-gray-500">
                  Exemplos: "mude a cor da camisa para azul", "coloque num fundo de praia", "deixe a modelo com cabelo mais curto"
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              userId={userId}
              onImproveRequest={onImproveRequest}
            />
          ))}

          {messages.length === 0 && !isLoading && (
            <div className="text-center font-inter text-sm text-gray-500">
              Nenhuma mensagem ainda. Envie sua primeira mensagem para começar.
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#20202a] to-[#2a2a35] text-white">
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="flex-1 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

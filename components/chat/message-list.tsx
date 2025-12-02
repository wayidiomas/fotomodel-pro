'use client';

import * as React from 'react';
import { ChatMessage as ChatMessageComponent } from './chat-message';
import type { ChatMessage } from './chat-interface';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  userId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, userId }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white/15 to-transparent">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {messages.length === 0 && !isLoading ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-[32px] border border-white/60 bg-white/75 py-12 text-center shadow-[0_30px_50px_rgba(15,23,42,0.12)] backdrop-blur-3xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#20202a] to-[#2a2a35] text-white">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-inter text-lg font-semibold text-gray-900">
              Comece sua conversa
            </h3>
            <p className="mx-auto max-w-sm font-inter text-sm text-gray-600">
              Descreva o que você deseja criar. A IA irá fazer perguntas para entender melhor
              antes de gerar a imagem.
            </p>
            <div className="mt-6 grid max-w-md grid-cols-1 gap-2">
              <div className="rounded-2xl border border-white/60 bg-white/90 p-3 text-left shadow-sm">
                <p className="font-inter text-xs font-medium text-gray-700">
                  Exemplo: "Quero uma modelo usando uma blusa vermelha e calça jeans"
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/90 p-3 text-left shadow-sm">
                <p className="font-inter text-xs font-medium text-gray-700">
                  Exemplo: "Crie uma modelo feminina com vestido florido em fundo branco"
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="space-y-6">
            {messages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} userId={userId} />
            ))}

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
        )}
      </div>
    </div>
  );
};

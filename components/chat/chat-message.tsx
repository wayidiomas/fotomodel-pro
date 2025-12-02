'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { WhatsAppShareButton } from './whatsapp-share-button';
import type { ChatMessage as ChatMessageType } from './chat-interface';

interface ChatMessageProps {
  message: ChatMessageType;
  userId: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, userId }) => {
  const isUser = message.role === 'user';
  const isPlaceholder = message.metadata?.placeholder === 'generation';
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [parallaxOffset, setParallaxOffset] = React.useState({ x: 0, y: 0 });

  // Extract generation result image if exists
  const generationImage = message.generations?.generation_results?.[0];

  const handleParallaxMove = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 30;
    const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 30;
    setParallaxOffset({ x: offsetX, y: offsetY });
  }, []);

  const resetParallax = React.useCallback(() => {
    setParallaxOffset({ x: 0, y: 0 });
  }, []);

  React.useEffect(() => {
    if (!isPreviewOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPreviewOpen(false);
        resetParallax();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen, resetParallax]);

  return (
    <div
      className={cn(
        'flex items-start gap-4',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-lg',
          isUser
            ? 'bg-gradient-to-br from-white to-gray-100'
            : 'bg-gradient-to-br from-[#20202a] to-[#2a2a35]'
        )}
      >
        {isUser ? (
          <svg
            className="h-5 w-5 text-gray-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5 text-white"
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
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex-1 space-y-2', isUser && 'flex flex-col items-end')}>
        {/* Text Content */}
        <div
          className={cn(
            'rounded-3xl px-5 py-4 shadow-xl border border-white/40 backdrop-blur-lg',
            isUser
              ? 'bg-gradient-to-br from-[#20202a] to-[#2a2a35] text-white'
              : isPlaceholder
                ? 'bg-white/60 text-gray-700'
                : 'bg-white/80 text-gray-900'
          )}
        >
          <p className="whitespace-pre-wrap font-inter text-sm leading-relaxed">
            {message.content}
          </p>

          {/* Credit Badge */}
          {message.credits_charged > 0 && (
            <div className="mt-2 flex items-center gap-1.5 border-t border-gray-200 pt-2">
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
              <span className="font-inter text-xs text-gray-500">
                {message.credits_charged} {message.credits_charged === 1 ? 'crédito' : 'créditos'}
              </span>
            </div>
          )}
        </div>

        {/* Generated Image */}
        {isPlaceholder && (
          <div className="max-w-sm overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-inner backdrop-blur-md">
            <div className="relative aspect-[3/4]">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200/70 via-white/40 to-gray-100/80" />
              <div className="absolute inset-8 rounded-2xl border border-dashed border-gray-300/80" />
              <div className="absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1 font-inter text-xs text-gray-600 shadow">
                Preparando a imagem...
              </div>
            </div>
          </div>
        )}

        {generationImage && (
          <div className="max-w-sm overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-lg backdrop-blur-xl">
            <div
              className="relative aspect-[3/4] group cursor-zoom-in"
              onClick={() => setIsPreviewOpen(true)}
            >
              <Image
                src={generationImage.image_url.startsWith('data:')
                  ? generationImage.image_url
                  : `/api/storage/public/${generationImage.image_url}`}
                alt="Imagem gerada"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, 448px"
              />

              <div className="absolute inset-0 bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-inter text-gray-900 shadow">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35m-2.65 1.35a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" />
                  </svg>
                  Ampliar
                </div>
              </div>

              {/* Watermark indicator */}
              {generationImage.has_watermark ? (
                <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2.5 py-1 backdrop-blur-sm text-white text-xs font-inter">
                  Preview
                </div>
              ) : (
                <div className="absolute bottom-2 right-2 rounded-md bg-[#20202a]/80 px-2.5 py-1 backdrop-blur-sm text-white text-xs font-inter">
                  Sem marca
                </div>
              )}
            </div>

            {/* Image Actions */}
            <div className="flex items-center justify-between border-t border-white/60 p-3">
              <button className="flex items-center gap-1.5 rounded-full border border-white/60 px-3 py-1.5 font-inter text-xs font-medium text-gray-700 transition-colors hover:bg-white/70">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Baixar sem marca
              </button>

              <WhatsAppShareButton imageUrl={generationImage.image_url} />
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            'font-inter text-xs text-gray-400',
            isUser && 'text-right'
          )}
        >
          {new Date(message.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {isPreviewOpen && generationImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,#ffffff26,transparent_50%),linear-gradient(135deg,rgba(245,246,252,0.65),rgba(13,16,32,0.75))] backdrop-blur-[34px] backdrop-saturate-[165%]"
          onClick={() => {
            setIsPreviewOpen(false);
            resetParallax();
          }}
        >
          <div
            className="relative z-10 w-full max-w-5xl rounded-[38px] border border-white/30 bg-white/15 shadow-[0_40px_110px_rgba(7,9,15,0.45)] ring-1 ring-white/30 overflow-hidden transition-transform duration-500 scale-100"
            style={{ aspectRatio: '3 / 4', maxHeight: '85vh' }}
            onClick={(event) => event.stopPropagation()}
            onMouseMove={handleParallaxMove}
            onMouseLeave={resetParallax}
          >
            <Image
              src={generationImage.image_url.startsWith('data:')
                ? generationImage.image_url
                : `/api/storage/public/${generationImage.image_url}`}
              alt="Visualização ampliada"
              fill
              className="object-contain transition-transform duration-200 ease-out bg-transparent"
              style={{
                transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0) scale(1.04)`,
              }}
              sizes="(max-width: 1024px) 90vw, 1024px"
            />

            <button
              onClick={() => {
                setIsPreviewOpen(false);
                resetParallax();
              }}
              className="absolute top-5 right-5 rounded-full bg-white/20 text-white w-11 h-11 flex items-center justify-center backdrop-blur-md border border-white/40 transition-all hover:bg-white/30"
              aria-label="Fechar visualização"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

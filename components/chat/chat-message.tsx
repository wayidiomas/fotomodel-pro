'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage as ChatMessageType } from './chat-interface';
import { GenerationSkeleton } from './generation-skeleton';
import { SaveModelModal, SaveModelData } from './save-model-modal';
import { Bookmark, BookmarkCheck, Sparkles } from 'lucide-react';
import { Portal } from '@/components/ui/portal';
import { useToast, ToastContainer } from '@/components/ui/toast';

interface ChatMessageProps {
  message: ChatMessageType;
  userId: string;
  onImproveRequest?: (imageUrl: string, generationId: string) => void;
}

/**
 * Helper to get the correct image URL from generation results
 * Handles both full URLs (already complete) and relative paths
 */
function getGeneratedImageUrl(imageUrl: string): string {
  // Already a data URL or full URL - use directly
  if (
    imageUrl.startsWith('data:') ||
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://')
  ) {
    return imageUrl;
  }

  // Relative path - construct full Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/generated-images/${imageUrl}`;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, userId, onImproveRequest }) => {
  const isUser = message.role === 'user';
  const isPlaceholder = message.metadata?.placeholder === 'generation';
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [parallaxOffset, setParallaxOffset] = React.useState({ x: 0, y: 0 });

  // Toast notifications
  const { toasts, addToast, removeToast } = useToast();

  // Prevent body scroll when preview is open
  React.useEffect(() => {
    if (isPreviewOpen) {
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
  }, [isPreviewOpen]);

  // Like state
  const [isLiked, setIsLiked] = React.useState(false);
  const [isLiking, setIsLiking] = React.useState(false);

  // Save model state
  const [isSavingModel, setIsSavingModel] = React.useState(false);
  const [isModelSaved, setIsModelSaved] = React.useState(false);
  const [showSaveModelModal, setShowSaveModelModal] = React.useState(false);

  // Save image state
  const [isSavingImage, setIsSavingImage] = React.useState(false);
  const [isImageSaved, setIsImageSaved] = React.useState(false);

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

  // Handle like button click
  const handleLike = React.useCallback(async () => {
    if (!generationImage?.id || isLiking) return;

    setIsLiking(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Você precisa estar autenticado');
        return;
      }

      if (isLiked) {
        // Remove like
        await supabase
          .from('generation_feedback')
          .delete()
          .eq('user_id', user.id)
          .eq('generation_result_id', generationImage.id);
        setIsLiked(false);
      } else {
        // Add like
        await supabase
          .from('generation_feedback')
          .upsert({
            user_id: user.id,
            generation_result_id: generationImage.id,
            feedback_type: 'like',
            feedback_text: null,
          }, {
            onConflict: 'user_id,generation_result_id',
          });
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error handling like:', error);
      alert('Erro ao processar feedback. Tente novamente.');
    } finally {
      setIsLiking(false);
    }
  }, [generationImage?.id, isLiked, isLiking]);

  // Handle save model button click - opens modal
  const handleSaveModel = React.useCallback(() => {
    if (!generationImage?.id || isModelSaved) return;
    setShowSaveModelModal(true);
  }, [generationImage?.id, isModelSaved]);

  // Handle save model confirmation from modal
  const handleConfirmSaveModel = React.useCallback(async (data: SaveModelData) => {
    if (!generationImage?.id) return;

    setIsSavingModel(true);
    try {
      const response = await fetch('/api/user-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationResultId: generationImage.id,
          imageUrl: generationImage.image_url,
          thumbnailUrl: generationImage.thumbnail_url,
          modelName: data.modelName,
          gender: data.gender,
          ageRange: data.ageRange,
          heightCm: data.heightCm,
          weightKg: data.weightKg,
        }),
      });

      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || 'Erro ao salvar modelo.');
      }

      setIsModelSaved(true);
      setShowSaveModelModal(false); // Close modal automatically

      // Show success toast
      addToast({
        type: 'success',
        title: 'Modelo salvo com sucesso!',
        description: `"${data.modelName}" foi adicionado aos seus modelos.`,
        duration: 4000,
      });
    } catch (error: any) {
      console.error('Error saving model:', error);

      // Show error toast
      addToast({
        type: 'error',
        title: 'Erro ao salvar modelo',
        description: error.message || 'Não foi possível salvar o modelo. Tente novamente.',
        duration: 5000,
      });

      throw error;
    } finally {
      setIsSavingModel(false);
    }
  }, [generationImage, addToast]);

  // Handle save image to gallery
  const handleSaveImage = React.useCallback(async () => {
    if (!generationImage?.id || isSavingImage || isImageSaved) return;

    setIsSavingImage(true);
    try {
      const response = await fetch('/api/gallery/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationResultId: generationImage.id,
          imageUrl: generationImage.image_url,
          thumbnailUrl: generationImage.thumbnail_url,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar imagem.');
      }

      setIsImageSaved(true);

      // Show success toast
      addToast({
        type: 'success',
        title: 'Imagem salva!',
        description: 'A imagem foi adicionada à sua galeria.',
        duration: 4000,
      });
    } catch (error: any) {
      console.error('Error saving image:', error);

      // Show error toast
      addToast({
        type: 'error',
        title: 'Erro ao salvar imagem',
        description: error.message || 'Não foi possível salvar a imagem. Tente novamente.',
        duration: 5000,
      });
    } finally {
      setIsSavingImage(false);
    }
  }, [generationImage, isSavingImage, isImageSaved, addToast]);

  // Handle improve with AI
  const handleImprove = React.useCallback(() => {
    if (!generationImage?.image_url || !message.generation_id) return;
    onImproveRequest?.(generationImage.image_url, message.generation_id);
  }, [generationImage, message.generation_id, onImproveRequest]);

  React.useEffect(() => {
    if (!isPreviewOpen) return;

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPreviewOpen(false);
        resetParallax();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isPreviewOpen, resetParallax]);

  // Load like status on mount
  React.useEffect(() => {
    const loadLikeStatus = async () => {
      if (!generationImage?.id) return;

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('generation_feedback')
          .select('feedback_type')
          .eq('user_id', user.id)
          .eq('generation_result_id', generationImage.id)
          .single();

        if (data?.feedback_type === 'like') {
          setIsLiked(true);
        }
      } catch (error) {
        // Silently fail - just means no like exists
      }
    };

    loadLikeStatus();
  }, [generationImage?.id]);

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
        {/* Text Content - hide when placeholder since GenerationSkeleton shows its own message */}
        {!isPlaceholder && (
          <div
            className={cn(
              'rounded-3xl px-5 py-4 shadow-xl border border-white/40 backdrop-blur-lg',
              isUser
                ? 'bg-gradient-to-br from-[#20202a] to-[#2a2a35] text-white'
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
        )}

        {/* Generation Skeleton - shown when placeholder */}
        {isPlaceholder && <GenerationSkeleton message={message.content} />}

        {generationImage && (
          <div className="max-w-sm overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-lg backdrop-blur-xl">
            <div
              className="relative aspect-[3/4] group cursor-zoom-in"
              onClick={() => setIsPreviewOpen(true)}
            >
              <Image
                src={getGeneratedImageUrl(generationImage.image_url)}
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

            </div>

            {/* Image Actions */}
            <div className="flex items-center justify-between border-t border-white/60 p-3">
              {/* Melhorar com IA */}
              <button
                onClick={handleImprove}
                className="flex items-center gap-1.5 rounded-full border border-white/60 bg-gradient-to-r from-[#fdf4e3] via-[#f1d9a1] to-[#d3a45d] px-3 py-1.5 font-inter text-xs font-semibold text-[#3f2f1d] transition-all hover:scale-[1.02] active:scale-95 shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Melhorar com IA
              </button>

              {/* Like, Save Model & Save Image buttons with glassmorphism */}
              <div className="flex gap-2 bg-white/80 backdrop-blur-xl rounded-2xl p-2 border border-white/40 shadow-sm">
                {/* Like */}
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-xl backdrop-blur-sm hover:bg-white/80 active:scale-95 transition-all shadow-sm",
                    isLiked
                      ? "bg-red-500/80 hover:bg-red-500/90"
                      : "bg-white/60"
                  )}
                  aria-label="Curtir"
                  title="Curtir"
                >
                  <svg
                    className={cn("w-4 h-4", isLiked ? "text-white fill-current" : "text-gray-700")}
                    fill={isLiked ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>

                {/* Save Model */}
                <button
                  onClick={handleSaveModel}
                  disabled={isSavingModel || isModelSaved}
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-xl backdrop-blur-sm hover:bg-white/80 active:scale-95 transition-all shadow-sm",
                    isModelSaved
                      ? "bg-[#20202a]/80 hover:bg-[#20202a]/90"
                      : "bg-white/60"
                  )}
                  aria-label={isModelSaved ? "Modelo salvo" : "Salvar modelo"}
                  title={isModelSaved ? "Modelo salvo" : "Salvar modelo"}
                >
                  {isModelSaved ? (
                    <BookmarkCheck className="w-4 h-4 text-white" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-gray-700" />
                  )}
                </button>

                {/* Save Image */}
                <button
                  onClick={handleSaveImage}
                  disabled={isSavingImage || isImageSaved}
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-xl backdrop-blur-sm hover:bg-white/80 active:scale-95 transition-all shadow-sm",
                    isImageSaved
                      ? "bg-green-500/80 hover:bg-green-500/90"
                      : "bg-white/60"
                  )}
                  aria-label={isImageSaved ? "Imagem salva" : "Salvar imagem"}
                  title={isImageSaved ? "Imagem salva" : "Salvar imagem"}
                >
                  {isImageSaved ? (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-gray-700"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                  )}
                </button>
              </div>
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
        <Portal>
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setIsPreviewOpen(false);
              resetParallax();
            }}
          >
          {/* Main content wrapper */}
          <div className="flex h-full items-center justify-center gap-6 px-6 py-8">
            {/* Image preview */}
            <div
              className="relative w-full max-w-3xl rounded-3xl border border-white/20 bg-gradient-to-b from-white/95 to-white/90 shadow-2xl overflow-hidden"
              style={{ aspectRatio: '3 / 4', maxHeight: '90vh' }}
              onClick={(event) => event.stopPropagation()}
              onMouseMove={handleParallaxMove}
              onMouseLeave={resetParallax}
            >
              <Image
                src={getGeneratedImageUrl(generationImage.image_url)}
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
                className="absolute top-4 right-4 rounded-full bg-gray-900/80 text-white w-10 h-10 flex items-center justify-center backdrop-blur-sm border border-gray-800 transition-all hover:bg-gray-900 shadow-lg"
                aria-label="Fechar visualização"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sidebar with actions */}
            <div
              className="hidden lg:flex flex-col gap-3 p-5 rounded-2xl border border-white/20 bg-white/95 backdrop-blur-lg shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="font-inter text-sm font-semibold text-gray-800 mb-1">Ações</h3>

              {/* Melhorar com IA */}
              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  resetParallax();
                  handleImprove();
                }}
                className="flex items-center gap-3 rounded-xl border border-[#d3a45d]/30 bg-gradient-to-r from-[#fdf4e3] via-[#f1d9a1] to-[#d3a45d] px-4 py-2.5 font-inter text-sm font-semibold text-[#3f2f1d] transition-all hover:scale-[1.02] active:scale-95 shadow-md"
              >
                <Sparkles className="h-4 w-4" />
                <span>Melhorar com IA</span>
              </button>

              {/* Like */}
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-2.5 font-inter text-sm font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-sm",
                  isLiked
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                )}
              >
                <svg
                  className={cn("w-4 h-4", isLiked ? "fill-current" : "")}
                  fill={isLiked ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{isLiked ? 'Curtido' : 'Curtir'}</span>
              </button>

              {/* Save Model */}
              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  resetParallax();
                  handleSaveModel();
                }}
                disabled={isSavingModel || isModelSaved}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-2.5 font-inter text-sm font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-sm",
                  isModelSaved
                    ? "bg-[#20202a] text-white border-[#20202a]"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                )}
              >
                {isModelSaved ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
                <span>{isModelSaved ? 'Modelo Salvo' : 'Salvar Modelo'}</span>
              </button>

              {/* Save Image */}
              <button
                onClick={handleSaveImage}
                disabled={isSavingImage || isImageSaved}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-2.5 font-inter text-sm font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-sm",
                  isImageSaved
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                )}
              >
                {isImageSaved ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                )}
                <span>{isImageSaved ? 'Imagem Salva' : 'Salvar Imagem'}</span>
              </button>
            </div>
          </div>
          </div>
        </Portal>
      )}

      {/* Save Model Modal */}
      <SaveModelModal
        isOpen={showSaveModelModal}
        onClose={() => setShowSaveModelModal(false)}
        onConfirm={handleConfirmSaveModel}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Portal } from '@/components/ui/portal';
import type { Conversation } from './chat-interface';

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onUpdateConversation: (id: string, title: string) => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
  availableProjects: string[];
  projectFilter: string | null;
  onProjectFilterChange: (project: string | null) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onUpdateConversation,
  isOpen,
  onToggle,
  availableProjects,
  projectFilter,
  onProjectFilterChange,
}) => {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState('');
  const editInputRef = React.useRef<HTMLInputElement>(null);

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  // Focus input when editing starts
  React.useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setPendingDeleteId(conversationId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    setShowDeleteConfirm(false);
    setDeletingId(pendingDeleteId);
    await onDeleteConversation(pendingDeleteId);
    setDeletingId(null);
    setPendingDeleteId(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
  };

  const handleStartEdit = (e: React.MouseEvent, conversationId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingId(conversationId);
    setEditingTitle(currentTitle || 'Sem título');
  };

  const handleSaveEdit = async (conversationId: string) => {
    if (!editingTitle.trim()) {
      setEditingTitle('Sem título');
    }

    try {
      await onUpdateConversation(conversationId, editingTitle.trim() || 'Sem título');
      setEditingId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error updating conversation title:', error);
      alert('Erro ao atualizar título. Tente novamente.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, conversationId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(conversationId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data inválida';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return 'Data inválida';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <>
      {/* Toggle Button (mobile) */}
      <button
        onClick={onToggle}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-lg md:hidden"
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          'flex w-72 flex-col border-r border-[#e6e0d3] bg-[#f7f6f1]/90 backdrop-blur-2xl shadow-xl transition-transform duration-300',
          'fixed left-0 top-0 bottom-0 z-30 h-screen md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-white/40 px-3 py-3">
          <h2 className="font-freight text-xl font-medium text-gray-900">Conversas</h2>
          <button
            onClick={onCreateConversation}
            className="flex h-9 items-center gap-2 rounded-full bg-[#20202a] px-3 font-inter text-sm font-medium text-white transition-transform hover:scale-[1.01]"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nova
          </button>
        </div>

        {availableProjects.length > 0 && (
          <div className="flex-shrink-0 border-b border-white/40 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-freight text-base font-semibold uppercase tracking-wide text-gray-700">
                Projetos
              </p>
              <button
                onClick={onCreateConversation}
                className="flex h-8 items-center gap-1.5 rounded-full bg-[#20202a] px-3 font-inter text-xs font-medium text-white transition-transform hover:scale-[1.02]"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Nova
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => onProjectFilterChange(null)}
                className={cn(
                  'rounded-full px-3 py-1 font-inter text-xs transition-colors',
                  projectFilter === null
                    ? 'bg-[#20202a] text-white'
                    : 'bg-white/70 text-gray-700 hover:bg-white'
                )}
              >
                Todos
              </button>
              {availableProjects.map((project) => (
                <button
                  key={project}
                  onClick={() => onProjectFilterChange(project)}
                  className={cn(
                    'rounded-full px-3 py-1 font-inter text-xs transition-colors',
                    projectFilter === project
                      ? 'bg-[#20202a] text-white'
                      : 'bg-white/70 text-gray-700 hover:bg-white'
                  )}
                >
                  {project}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            <div className="space-y-1 p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => !deletingId && onSelectConversation(conversation.id)}
                  className={cn(
                    'group relative w-full rounded-lg p-3 transition-colors cursor-pointer',
                    currentConversationId === conversation.id
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50',
                    deletingId === conversation.id && 'opacity-50 pointer-events-none'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Title - Editable or Display */}
                      {editingId === conversation.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, conversation.id)}
                            onBlur={() => handleSaveEdit(conversation.id)}
                            className="w-full rounded border border-gray-300 px-2 py-1 font-inter text-sm font-medium text-gray-900 focus:border-[#20202a] focus:outline-none"
                          />
                        </div>
                      ) : (
                        <p className="truncate font-inter text-sm font-medium text-gray-900">
                          {conversation.title || 'Sem título'}
                        </p>
                      )}

                      {conversation.metadata?.project && (
                        <p className="font-inter text-[11px] uppercase tracking-wide text-gray-500">
                          {conversation.metadata.project}
                        </p>
                      )}
                      <p className="mt-0.5 font-inter text-xs text-gray-500">
                        {formatDate(conversation.updated_at)}
                      </p>
                    </div>

                    {/* Edit and Delete Buttons */}
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      {/* Edit Button */}
                      <button
                        onClick={(e) => handleStartEdit(e, conversation.id, conversation.title || 'Sem título')}
                        className="rounded p-1 hover:bg-gray-200 active:scale-95 transition-transform"
                        disabled={deletingId === conversation.id || editingId === conversation.id}
                        aria-label="Editar conversa"
                      >
                        <svg
                          className="h-4 w-4 text-gray-400 hover:text-[#20202a]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteClick(e, conversation.id)}
                        className="rounded p-1 hover:bg-gray-200 active:scale-95 transition-transform"
                        disabled={deletingId === conversation.id || editingId === conversation.id}
                        aria-label="Deletar conversa"
                      >
                        <svg
                          className="h-4 w-4 text-gray-400 hover:text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="font-inter text-sm font-medium text-gray-900">
                Nenhuma conversa ainda
              </p>
              <p className="mt-1 font-inter text-xs text-gray-500">
                Comece uma nova conversa com a IA
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex-shrink-0 border-t border-white/40 bg-white/60 p-4">
          <div className="rounded-2xl border border-white/50 bg-white/80 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 text-[#20202a]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l3 3" />
              </svg>
              <p className="font-inter text-xs font-semibold">Dica: Conversas são gratuitas</p>
            </div>
            <p className="mt-1 font-inter text-xs text-gray-600">
              Você só paga quando gerar uma imagem
            </p>
          </div>
        </div>
      </div>

      {/* Overlay (mobile) */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleCancelDelete}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#e6e0d3] bg-white p-6 shadow-2xl">
              {/* Icon */}
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>

              {/* Title */}
              <h3 className="mb-2 text-center font-freight text-lg font-semibold text-gray-900">
                Deletar conversa?
              </h3>

              {/* Description */}
              <p className="mb-6 text-center font-inter text-sm text-gray-600">
                Esta ação não pode ser desfeita. A conversa e todas as mensagens serão permanentemente removidas.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 font-inter text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 rounded-full bg-red-600 px-4 py-2.5 font-inter text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

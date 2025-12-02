'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Conversation } from './chat-interface';

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
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
  isOpen,
  onToggle,
  availableProjects,
  projectFilter,
  onProjectFilterChange,
}) => {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();

    if (window.confirm('Tem certeza que deseja deletar esta conversa?')) {
      setDeletingId(conversationId);
      await onDeleteConversation(conversationId);
      setDeletingId(null);
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
        className="fixed left-4 top-20 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-lg md:hidden"
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
          'flex w-80 flex-col border-r border-white/30 bg-white/70 backdrop-blur-2xl shadow-xl transition-transform duration-300',
          'fixed inset-y-16 left-0 z-40 md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/40 p-4">
          <h2 className="font-inter text-lg font-semibold text-gray-900">Conversas</h2>
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
          <div className="border-b border-white/40 px-4 pb-3">
            <p className="font-inter text-xs uppercase tracking-wide text-gray-500">
              Projetos
            </p>
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
                      <p className="truncate font-inter text-sm font-medium text-gray-900">
                        {conversation.title || 'Sem título'}
                      </p>
                      {conversation.metadata?.project && (
                        <p className="font-inter text-[11px] uppercase tracking-wide text-gray-500">
                          {conversation.metadata.project}
                        </p>
                      )}
                      <p className="mt-0.5 font-inter text-xs text-gray-500">
                        {formatDate(conversation.updated_at)}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(e, conversation.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                      disabled={deletingId === conversation.id}
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
        <div className="border-t border-white/40 bg-white/60 p-4">
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
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
};

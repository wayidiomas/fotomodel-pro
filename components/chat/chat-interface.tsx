'use client';

import * as React from 'react';
import { ChatSidebar } from './chat-sidebar';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { PromptSuggestions } from './prompt-suggestions';

const DRAFT_STORAGE_KEY = 'chat:drafts:v1';

type DraftState = {
  message: string;
  attachments: ChatAttachment[];
};

const draftsAreEqual = (a?: DraftState, b?: DraftState) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.message !== b.message) return false;
  if (a.attachments.length !== b.attachments.length) return false;
  for (let i = 0; i < a.attachments.length; i++) {
    const attA = a.attachments[i];
    const attB = b.attachments[i];
    if (attA.type !== attB.type) return false;
    if (attA.url !== attB.url) return false;
    if (attA.base64Data !== attB.base64Data) return false;
    if (attA.mimeType !== attB.mimeType) return false;
    if ((attA.referenceId || null) !== (attB.referenceId || null)) return false;
  }
  return true;
};

export interface Conversation {
  id: string;
  title: string | null;
  metadata: {
    project?: string | null;
    [key: string]: any;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  generation_id?: string | null;
  credits_charged: number;
  metadata?: any;
  created_at: string;
  generations?: {
    id: string;
    generation_results: Array<{
      id: string;
      image_url: string;
      thumbnail_url?: string;
    }>;
  };
}

export interface ChatAttachment {
  type: 'garment' | 'background' | 'model';
  referenceId?: string;
  url: string;
  base64Data?: string;
  mimeType?: string;
  metadata?: {
    name?: string;
    gender?: string;
    ageRange?: string;
    heightCm?: number;
    weightKg?: number;
    [key: string]: any;
  };
}

interface ChatInterfaceProps {
  userId: string;
  userCredits: number;
  initialConversations: Conversation[];
  initialConversationId?: string | null;
  onCreditsChange?: (credits: number) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userId,
  userCredits,
  initialConversations,
  initialConversationId,
  onCreditsChange,
}) => {
  const [conversations, setConversations] = React.useState<Conversation[]>(initialConversations);
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [credits, setCredits] = React.useState(userCredits);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [projectFilter, setProjectFilter] = React.useState<string | null>(null);
  const [showNewConversationModal, setShowNewConversationModal] = React.useState(false);
  const [newConversationName, setNewConversationName] = React.useState('');
  const [newConversationProject, setNewConversationProject] = React.useState('');
  const [drafts, setDrafts] = React.useState<Record<string, DraftState>>({});
  const [improveContext, setImproveContext] = React.useState<{
    imageUrl: string;
    generationId: string;
  } | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDrafts(Array.isArray(parsed) ? {} : parsed || {});
      }
    } catch (error) {
      console.error('Erro ao carregar rascunhos do chat:', error);
    }
  }, []);

  const persistDrafts = React.useCallback((nextDrafts: Record<string, DraftState>) => {
    if (typeof window === 'undefined') return;
    try {
      // Remove large data from attachments to avoid localStorage quota issues
      const draftsToStore = Object.entries(nextDrafts).reduce((acc, [key, draft]) => {
        acc[key] = {
          message: draft.message,
          attachments: draft.attachments
            // Filter out background attachments as they're too large for localStorage
            .filter((att) => att.type !== 'background')
            .map((att) => {
              // Remove base64Data but keep all other properties including URL
              const { base64Data, ...attWithoutBase64 } = att;
              return attWithoutBase64;
            }),
        };
        return acc;
      }, {} as Record<string, DraftState>);

      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftsToStore));
    } catch (error) {
      console.error('Erro ao salvar rascunhos do chat:', error);
      // If still fails, try to clear old drafts
      try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }, []);

  const updateDraft = React.useCallback(
    (key: string, draft: DraftState) => {
      setDrafts((prev) => {
        const cleanDraft: DraftState = {
          message: draft.message || '',
          attachments: (draft.attachments || []).map((att) => ({ ...att })),
        };

        const isEmpty = !cleanDraft.message && cleanDraft.attachments.length === 0;
        const previousDraft = prev[key];

        if (isEmpty) {
          if (!previousDraft) {
            return prev;
          }
          const next = { ...prev };
          delete next[key];
          persistDrafts(next);
          return next;
        }

        if (draftsAreEqual(previousDraft, cleanDraft)) {
          return prev;
        }

        const next = { ...prev, [key]: cleanDraft };
        persistDrafts(next);
        return next;
      });
    },
    [persistDrafts]
  );

  const clearDraft = React.useCallback(
    (key: string) => {
      if (!key) return;
      setDrafts((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        persistDrafts(next);
        return next;
      });
    },
    [persistDrafts]
  );

  const conversationDraftKey = currentConversationId || '__new__';
  const currentDraft = drafts[conversationDraftKey] || { message: '', attachments: [] };

  // Extract edit context from improve_reference attachment in draft
  const editContext = React.useMemo(() => {
    const improveRef = currentDraft.attachments.find(
      (a: any) => a.type === 'improve_reference'
    );
    if (improveRef) {
      return {
        imageUrl: improveRef.url,
        referenceId: improveRef.referenceId || '',
      };
    }
    return null;
  }, [currentDraft.attachments]);

  // Clear edit context (remove improve_reference from draft)
  const handleClearEditContext = React.useCallback(() => {
    const filteredAttachments = currentDraft.attachments.filter(
      (a: any) => a.type !== 'improve_reference'
    );
    updateDraft(conversationDraftKey, {
      ...currentDraft,
      attachments: filteredAttachments,
    });
  }, [currentDraft, conversationDraftKey, updateDraft]);

  const availableProjects = React.useMemo(() => {
    const projects = new Set<string>();
    conversations.forEach((conversation) => {
      const project = conversation.metadata?.project;
      if (project && project.trim()) {
        projects.add(project.trim());
      }
    });
    return Array.from(projects).sort((a, b) => a.localeCompare(b));
  }, [conversations]);

  const filteredConversations = React.useMemo(() => {
    if (!projectFilter) return conversations;
    return conversations.filter(
      (conversation) => (conversation.metadata?.project || '').trim() === projectFilter
    );
  }, [conversations, projectFilter]);

  // Load messages when conversation changes
  React.useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  React.useEffect(() => {
    onCreditsChange?.(credits);
  }, [credits, onCreditsChange]);

  const loadMessages = async (conversationId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async (options?: { title?: string; project?: string; initialMessage?: string }) => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: options?.title?.trim()
            ? options.title.trim()
            : options?.initialMessage
              ? options.initialMessage.slice(0, 50) + (options.initialMessage.length > 50 ? '...' : '')
              : 'Nova conversa',
          project: options?.project?.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.conversation) {
        setConversations((prev) => [data.conversation, ...prev]);
        setCurrentConversationId(data.conversation.id);
        clearDraft('__new__');
        clearDraft(conversationDraftKey);
        return data.conversation.id;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
    return null;
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setConversations((prev) => {
          const next = prev.filter((conversation) => conversation.id !== conversationId);
          if (
            projectFilter &&
            !next.some(
              (conversation) => (conversation.metadata?.project || '').trim() === projectFilter
            )
          ) {
            setProjectFilter(null);
          }
          return next;
        });
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null);
        }
        clearDraft(conversationId);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const updateConversation = async (conversationId: string, title: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      const data = await response.json();

      if (data.success && data.conversation) {
        // Update the conversation in the local state
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, title: data.conversation.title, updated_at: data.conversation.updated_at }
              : conversation
          )
        );
      } else {
        throw new Error(data.error || 'Erro ao atualizar título');
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error; // Re-throw so the sidebar can handle it
    }
  };

  const handleSuggestionClick = async (prompt: string) => {
    // Create conversation if needed and send the suggested prompt
    let conversationId = currentConversationId;

    if (!conversationId) {
      conversationId = await createConversation({ initialMessage: prompt });
      if (!conversationId) {
        return;
      }
    }

    // Send the suggestion as a message
    await sendMessage(prompt, []);
  };

  const handleOpenNewConversation = () => {
    setNewConversationName('');
    setNewConversationProject(projectFilter || '');
    setShowNewConversationModal(true);
  };

  const handleCreateConversationSubmit = async () => {
    const title = newConversationName.trim();
    const project = newConversationProject.trim();
    const createdId = await createConversation({
      title: title || 'Projeto sem nome',
      project: project || undefined,
    });

    if (createdId) {
      setShowNewConversationModal(false);
      if (project) {
        setProjectFilter(project);
      }
      setNewConversationName('');
      setNewConversationProject('');
    }
  };

  const handleImproveRequest = React.useCallback((imageUrl: string, generationId: string) => {
    setImproveContext({ imageUrl, generationId });
    // Update draft with improve attachment
    updateDraft(conversationDraftKey, {
      message: 'O que você gostaria de melhorar nesta imagem? ',
      attachments: [{
        type: 'improve_reference' as any,
        url: imageUrl,
        referenceId: generationId,
        metadata: {
          generationId,
          imageUrl,
        },
      }],
    });
  }, [conversationDraftKey, updateDraft]);

  const sendMessage = async (
    content: string,
    attachments: ChatAttachment[] = []
  ): Promise<boolean> => {
    setErrorMessage(null); // Clear any previous errors
    let conversationId = currentConversationId;

    // Create conversation if doesn't exist
    if (!conversationId) {
      conversationId = await createConversation({ initialMessage: content });
      if (!conversationId) {
        return false;
      }
    }

    setIsLoading(true);

    const hasGarmentAttachment = attachments.some((attachment) => attachment.type === 'garment');
    const hasImproveReference = attachments.some((attachment) => (attachment as any).type === 'improve_reference');
    // Check if conversation has previous generations (continuous improvement scenario)
    const hasPreviousGeneration = messages.some((msg) => msg.generation_id);

    // Show generation placeholder when:
    // 1. User attached a garment (new generation)
    // 2. OR user is using improve reference (clicked "Melhorar com IA")
    // 3. OR conversation already has generations (continuous improvement via text)
    const willGenerateImage = hasGarmentAttachment || hasImproveReference || hasPreviousGeneration;

    let placeholderId: string | null = null;
    if (willGenerateImage && (!currentConversationId || conversationId === currentConversationId)) {
      placeholderId = `pending-${Date.now()}`;

      // Customize message based on context
      let placeholderContent = 'Gerando sua imagem...';
      if (hasGarmentAttachment) {
        placeholderContent = 'Gerando a imagem com a peça enviada...';
      } else if (hasImproveReference || hasPreviousGeneration) {
        placeholderContent = 'Aplicando as alterações solicitadas...';
      }

      const placeholderMessage: ChatMessage = {
        id: placeholderId,
        conversation_id: conversationId,
        role: 'assistant',
        content: placeholderContent,
        credits_charged: 0,
        metadata: { placeholder: 'generation' },
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, placeholderMessage]);
    }

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, attachments }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload messages to get both user and assistant messages
        await loadMessages(conversationId);

        // Update credits if charged
        if (data.creditsRemaining !== undefined) {
          setCredits(data.creditsRemaining);
        }

        updateDraft(conversationId, { message: '', attachments: [] });
        updateDraft('__new__', { message: '', attachments: [] });

        // Clear improve context after successful generation
        setImproveContext(null);

        return true;
      } else {
        // Handle errors (insufficient credits, etc.)
        setErrorMessage(data.error || 'Erro ao enviar mensagem');

        if (data.error && data.message) {
          // Add error message to chat
          await loadMessages(conversationId);
        }
        return false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setErrorMessage('Erro de conexão. Tente novamente.');
      return false;
    } finally {
      if (placeholderId) {
        setMessages((prev) => prev.filter((message) => message.id !== placeholderId));
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 bg-[#f5f4f0]">
      {/* Sidebar */}
      <ChatSidebar
        conversations={filteredConversations}
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        onCreateConversation={handleOpenNewConversation}
        onDeleteConversation={deleteConversation}
        onUpdateConversation={updateConversation}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        availableProjects={availableProjects}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
      />

      {/* Main Chat Area */}
      <div
        className="m-0 flex flex-1 flex-col rounded-none border-t border-[#e6e0d3]/70 bg-white/94 shadow-[0_16px_45px_rgba(15,23,42,0.12)] backdrop-blur-2xl md:ml-72"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 18%, rgba(214,192,150,0.10), transparent 32%), radial-gradient(circle at 85% 10%, rgba(190,170,130,0.08), transparent 32%), radial-gradient(circle at 30% 75%, rgba(200,180,140,0.08), transparent 38%)',
        }}
      >
        {/* Error Message Banner */}
        {errorMessage && (
          <div className="border-b border-red-200/40 bg-white/70 backdrop-blur-md px-4 py-3 shadow-sm">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 text-red-700">
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="font-inter text-sm">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="rounded-md p-1 transition-colors hover:bg-red-100/60"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          userId={userId}
          onImproveRequest={handleImproveRequest}
          editContext={editContext}
          onClearEditContext={handleClearEditContext}
        />

        {/* Input */}
        <MessageInput
          conversationId={currentConversationId}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          userCredits={credits}
          draft={currentDraft}
          onDraftChange={(draft) => updateDraft(conversationDraftKey, draft)}
          isNewConversation={messages.length === 0}
        />
      </div>

      {showNewConversationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-freight text-xl font-medium text-gray-900">Nova conversa</h3>
                <p className="font-inter text-sm text-gray-600">
                  Defina um nome e, se quiser, associe a um projeto.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNewConversationModal(false);
                  setNewConversationName('');
                  setNewConversationProject('');
                }}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
                aria-label="Fechar modal"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="font-inter text-xs uppercase tracking-wide text-gray-500">
                  Nome da conversa
                </label>
                <input
                  type="text"
                  value={newConversationName}
                  onChange={(event) => setNewConversationName(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-2 font-inter text-sm text-gray-900 outline-none focus:border-[#20202a]"
                  placeholder="Ex: Campanha Outono 2025"
                />
              </div>

              <div>
                <label className="font-inter text-xs uppercase tracking-wide text-gray-500">
                  Projeto (opcional)
                </label>
                <input
                  type="text"
                  value={newConversationProject}
                  onChange={(event) => setNewConversationProject(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-2 font-inter text-sm text-gray-900 outline-none focus:border-[#20202a]"
                  placeholder="Ex: Loja Central"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowNewConversationModal(false);
                  setNewConversationName('');
                  setNewConversationProject('');
                }}
                className="flex-1 rounded-2xl border border-white/60 bg-white/70 py-2.5 font-inter text-sm font-medium text-gray-700 transition-colors hover:bg-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateConversationSubmit}
                className="flex-1 rounded-2xl bg-gradient-to-r from-[#20202a] to-[#2a2a35] py-2.5 font-inter text-sm font-medium text-white transition-transform hover:scale-[1.01]"
              >
                Criar conversa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

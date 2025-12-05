'use client';

import * as React from 'react';
import { ChatInterface } from '@/components/chat';
import { ProductEditor } from '@/components/chat/product-editor';
import { MainHeader } from '@/components/shared';
import { MessageSquare, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/components/chat/chat-interface';
import type { ChatAttachment } from '@/components/chat/chat-interface';

type ViewMode = 'editor' | 'chat';

interface ChatShellProps {
  userId: string;
  initialCredits: number;
  initialConversations: Conversation[];
  initialConversationId?: string | null;
}

export function ChatShell({ userId, initialCredits, initialConversations, initialConversationId }: ChatShellProps) {
  const [credits, setCredits] = React.useState(initialCredits);
  const [viewMode, setViewMode] = React.useState<ViewMode>('chat');
  const [isLoading, setIsLoading] = React.useState(false);

  // Shared message handler for ProductEditor
  const handleSendMessage = async (content: string, attachments: ChatAttachment[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      // This would call the same API as ChatInterface
      // For now, simulate the call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f5f1]">
      <MainHeader currentPage="chat" credits={credits} />

      {/* Content */}
      <div className="flex-1">
        <div className="w-full bg-gradient-to-br from-[#f5f4f0] via-white to-[#e8e2d7]">
          <ChatInterface
            userId={userId}
            userCredits={credits}
            initialConversations={initialConversations}
            initialConversationId={initialConversationId}
            onCreditsChange={setCredits}
          />
        </div>
      </div>
    </div>
  );
}

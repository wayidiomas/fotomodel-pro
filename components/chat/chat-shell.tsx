'use client';

import * as React from 'react';
import { ChatInterface } from '@/components/chat';
import { MainHeader } from '@/components/shared';
import type { Conversation } from '@/components/chat/chat-interface';

interface ChatShellProps {
  userId: string;
  initialCredits: number;
  initialConversations: Conversation[];
}

export function ChatShell({ userId, initialCredits, initialConversations }: ChatShellProps) {
  const [credits, setCredits] = React.useState(initialCredits);

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-[#f7f8fb] via-white to-[#e0ecff]">
      <MainHeader currentPage="chat" credits={credits} />
      <ChatInterface
        userId={userId}
        userCredits={credits}
        initialConversations={initialConversations}
        onCreditsChange={setCredits}
      />
    </div>
  );
}

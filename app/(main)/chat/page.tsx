import { createClient } from '@/lib/supabase/server';
import { ChatShell } from '@/components/chat';

/**
 * Chat Page - Geração Livre (BETA)
 *
 * Interface de chat conversacional para geração de imagens de moda.
 * - Sidebar com lista de conversas
 * - Interface estilo ChatGPT
 * - Upload de vestuário e backgrounds
 * - Agente decisor que coleta informações antes de gerar
 * - Custo: 0 créditos (conversação), 2 créditos (geração), 1 crédito (refinamento)
 */

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string }>;
}) {
  const params = await searchParams;
  const initialConversationId = params.conversationId || null;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Middleware should redirect
  }

  // Fetch user data with credits
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('credits, full_name')
    .eq('id', user.id)
    .single();

  // Fetch existing conversations
  const { data: conversations } = await (supabase
    .from('chat_conversations') as any)
    .select('id, title, metadata, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
    .limit(50);

  return (
    <ChatShell
      userId={user.id}
      initialCredits={userData?.credits || 0}
      initialConversations={conversations || []}
      initialConversationId={initialConversationId}
    />
  );
}

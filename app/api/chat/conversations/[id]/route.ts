/**
 * API Route: Single Chat Conversation
 *
 * DELETE - Soft delete conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/chat/conversations/[id]
 * Soft delete a conversation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = id;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verify ownership and soft delete
    const { error } = await (supabase
      .from('chat_conversations') as any)
      .update({ is_deleted: true })
      .eq('id', conversationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting conversation:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar conversa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversa deletada com sucesso',
    });
  } catch (error) {
    console.error('Error in DELETE /api/chat/conversations/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

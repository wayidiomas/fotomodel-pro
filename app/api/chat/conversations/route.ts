/**
 * API Route: Chat Conversations
 *
 * GET  - List user's chat conversations
 * POST - Create new chat conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/chat/conversations
 * List all conversations for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Fetch conversations with message count
    const { data: conversations, error } = await (supabase
      .from('chat_conversations') as any)
      .select(`
        id,
        title,
        metadata,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar conversas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversations: conversations || [],
    });
  } catch (error) {
    console.error('Error in GET /api/chat/conversations:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations
 * Create new conversation
 *
 * Body: { title?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, project } = body;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Create conversation
    const { data: conversation, error } = await (supabase
      .from('chat_conversations') as any)
      .insert({
        user_id: user.id,
        title: title?.trim() || 'Nova Conversa',
        metadata: {
          project: project?.trim() || null,
        },
      })
      .select('id, title, metadata, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json(
        { error: 'Erro ao criar conversa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Error in POST /api/chat/conversations:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

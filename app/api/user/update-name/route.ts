import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/user/update-name
 * Updates the user's full name
 */
export async function PATCH(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nome inválido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Update user's full name
    const { error: updateError } = await (supabase
      .from('users') as any)
      .update({ full_name: name.trim() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user name:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar nome' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Nome atualizado com sucesso',
    });
  } catch (error) {
    console.error('Error in update-name route:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

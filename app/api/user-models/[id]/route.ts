import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const modelId = params.id;

    // Verify model belongs to user
    const { data: model, error: fetchError } = await (supabase
      .from('user_models') as any)
      .select('id, user_id')
      .eq('id', modelId)
      .single();

    if (fetchError || !model) {
      return NextResponse.json(
        { success: false, error: 'Modelo não encontrado' },
        { status: 404 }
      );
    }

    if (model.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para excluir este modelo' },
        { status: 403 }
      );
    }

    // Delete model
    const { error: deleteError } = await (supabase
      .from('user_models') as any)
      .delete()
      .eq('id', modelId);

    if (deleteError) {
      console.error('Error deleting user model:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir modelo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Modelo excluído com sucesso',
    });
  } catch (error) {
    console.error('Error in DELETE user-models API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro inesperado',
      },
      { status: 500 }
    );
  }
}

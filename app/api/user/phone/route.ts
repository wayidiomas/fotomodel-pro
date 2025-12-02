/**
 * API Route: User Phone Number
 *
 * GET  - Get user's phone number
 * POST - Update user's phone number
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user/phone
 * Get user's phone number
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

    // Fetch user phone
    const { data: userData, error } = await (supabase
      .from('users') as any)
      .select('phone')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user phone:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar número' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      phone: userData?.phone || null,
    });
  } catch (error) {
    console.error('Error in GET /api/user/phone:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/phone
 * Update user's phone number
 *
 * Body: { phone: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Número de telefone inválido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Update phone number
    const { error } = await (supabase
      .from('users') as any)
      .update({ phone: phone.trim() })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating user phone:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar número' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      phone: phone.trim(),
    });
  } catch (error) {
    console.error('Error in POST /api/user/phone:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

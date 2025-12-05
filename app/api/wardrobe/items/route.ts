import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0', 10);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Fetch paginated wardrobe items with upload data
    const { data: items, error, count } = await supabase
      .from('wardrobe_items')
      .select(
        `
        *,
        upload:user_uploads(*)
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching wardrobe items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      );
    }

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0;
    const hasMore = page < totalPages - 1;

    return NextResponse.json({
      items: items || [],
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total: count || 0,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Wardrobe items API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get item ID from request body
    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Try using the RPC function first (SECURITY DEFINER, bypasses RLS)
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('soft_delete_wardrobe_item', { item_id: itemId });

    if (rpcError) {
      // If RPC function doesn't exist yet (migration not applied),
      // fall back to direct update with proper error handling
      console.error('RPC error (may fall back to direct update):', rpcError.message);

      // Fallback: Try direct update
      const { error: updateError } = await supabase
        .from('wardrobe_items')
        .update({ is_deleted: true })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error deleting wardrobe item:', updateError);

        // Check if it's an RLS error and provide a helpful message
        if (updateError.code === '42501') {
          return NextResponse.json(
            { error: 'Por favor, aplique a migração mais recente do banco de dados para habilitar a exclusão de peças.' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { error: updateError.message || 'Failed to delete item' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wardrobe item DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Fetch paginated generations - MINIMAL fields only (no input_data)
    const { data: generations, error: generationsError, count } = await (supabase
      .from('generations') as any)
      .select(
        `
        id,
        created_at,
        credits_used,
        generation_results!inner (
          id,
          image_url,
          thumbnail_url,
          is_purchased,
          created_at
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (generationsError) {
      console.error('Error fetching generations:', generationsError);
      return NextResponse.json(
        { error: 'Failed to fetch generations' },
        { status: 500 }
      );
    }

    // Fast serialization - no category enrichment
    const sanitizedGenerations = (generations || []).map((gen: any) => ({
      id: gen.id,
      created_at: gen.created_at,
      credits_used: gen.credits_used,
      generation_results: gen.generation_results.map((result: any) => ({
        id: result.id,
        image_url: result.image_url,
        thumbnail_url: result.thumbnail_url,
        is_purchased: result.is_purchased,
        created_at: result.created_at,
      })),
    }));

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0;
    const hasMore = page < totalPages - 1;

    return NextResponse.json({
      generations: sanitizedGenerations,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total: count || 0,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Gallery API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

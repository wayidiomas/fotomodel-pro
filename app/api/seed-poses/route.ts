import { NextResponse } from 'next/server';
import { seedModelPoses } from '@/lib/generation-flow/seed-poses';

/**
 * API Route to seed model poses
 * GET /api/seed-poses
 *
 * This endpoint populates the model_poses table with initial data.
 * It's safe to call multiple times - it will skip if data already exists.
 */
export async function GET() {
  try {
    const result = await seedModelPoses();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to seed poses',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      count: result.count,
    });
  } catch (error) {
    console.error('Error in seed-poses API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

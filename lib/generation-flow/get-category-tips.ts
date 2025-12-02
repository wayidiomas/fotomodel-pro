import { createClient } from '@/lib/supabase/server';
import type { CategoryTip } from './types';

export async function getCategoryTips(categorySlug: string): Promise<CategoryTip | null> {
  const supabase = await createClient();

  // Fetch the category tip with related data
  const { data: tipData, error: tipError } = await (supabase
    .from('category_tips') as any)
    .select('*')
    .eq('category_slug', categorySlug)
    .eq('is_deleted', false)
    .single();

  if (tipError || !tipData) {
    console.error('Error fetching category tip:', tipError);
    return null;
  }

  // Fetch avoid items
  const { data: avoidItems, error: avoidError } = await (supabase
    .from('category_tip_avoid_items') as any)
    .select('item_text')
    .eq('tip_id', tipData.id)
    .order('display_order', { ascending: true });

  if (avoidError) {
    console.error('Error fetching avoid items:', avoidError);
    return null;
  }

  // Fetch good example images
  const { data: goodImages, error: goodImagesError } = await (supabase
    .from('category_tip_images') as any)
    .select('image_url')
    .eq('tip_id', tipData.id)
    .eq('image_type', 'good')
    .order('display_order', { ascending: true });

  if (goodImagesError) {
    console.error('Error fetching good images:', goodImagesError);
    return null;
  }

  // Fetch bad example images
  const { data: badImages, error: badImagesError } = await (supabase
    .from('category_tip_images') as any)
    .select('image_url')
    .eq('tip_id', tipData.id)
    .eq('image_type', 'bad')
    .order('display_order', { ascending: true });

  if (badImagesError) {
    console.error('Error fetching bad images:', badImagesError);
    return null;
  }

  // Transform to CategoryTip interface
  return {
    goodDescription: tipData.good_description,
    goodExamples: goodImages.map((img: any) => img.image_url),
    avoidTitle: tipData.avoid_title,
    avoidItems: avoidItems.map((item: any) => item.item_text),
    badExamples: badImages.map((img: any) => img.image_url),
  };
}

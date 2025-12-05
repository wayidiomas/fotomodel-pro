/**
 * POST /api/user/import-bubble-wardrobe
 * Imports wardrobe items from Bubble to Supabase for migrated users
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Bubble API Configuration
const BUBBLE_API_URL = process.env.BUBBLE_API_URL || 'https://elias-57540.bubbleapps.io/version-live/api/1.1';
const BUBBLE_API_TOKEN = process.env.BUBBLE_API_TOKEN || 'a7ba4699d25b72985084c92773db7048';

interface BubbleVestuario {
  _id: string;
  Categoria?: string;
  Subcategoria?: string;
  Dono?: string;
  Imagem?: string;
  'Coleção'?: string;
  'Created Date'?: string;
  'Modified Date'?: string;
}

async function bubbleRequest(endpoint: string) {
  const url = `${BUBBLE_API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'api_key_fotomodel': `Bearer ${BUBBLE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Bubble API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getBubbleUserByPhone(phone: string) {
  // Remove '+' from phone and create Bubble email
  const cleanPhone = phone.replace(/\+/g, '');
  const bubbleEmail = `${cleanPhone}@fotomodel.com`;

  console.log(`🔍 Searching for Bubble user with email: ${bubbleEmail}`);

  // Use constraints with 'equals' (text contains doesn't work with Email txt field)
  const constraints = JSON.stringify([
    {
      key: 'Email txt',
      constraint_type: 'equals',
      value: bubbleEmail,
    },
  ]);

  const endpoint = `/obj/user?constraints=${encodeURIComponent(constraints)}&limit=1`;
  const data = await bubbleRequest(endpoint);

  if (data.response.results.length === 0) {
    console.log(`❌ Bubble user not found with email: ${bubbleEmail}`);
    return null;
  }

  const user = data.response.results[0];
  console.log(`✅ Found Bubble user: ${user.Nome || 'No name'} (${user['Email txt']})`);

  return user;
}

async function getVestuarioByBubbleUser(bubbleUserId: string): Promise<BubbleVestuario[]> {
  const constraints = JSON.stringify([
    {
      key: 'Dono',
      constraint_type: 'equals',
      value: bubbleUserId,
    },
  ]);

  const endpoint = `/obj/${encodeURIComponent('vestuário')}?constraints=${encodeURIComponent(constraints)}&limit=1000`;
  const data = await bubbleRequest(endpoint);

  return data.response.results;
}

function mapCategoria(categoria?: string, subcategoria?: string): string {
  const categoryMap: Record<string, string> = {
    'Vestido': 'vestido',
    'Calça': 'calca',
    'Camisa': 'camisa',
    'Blusa': 'blusa',
    'Saia': 'saia',
    'Shorts': 'short',
    'Jaqueta': 'jaqueta',
    'Casaco': 'casaco',
    'Blazer': 'blazer',
    'Top': 'top',
    'Regata': 'regata',
  };

  const slug = categoryMap[categoria || ''] || 'outros';

  if (subcategoria) {
    return `${slug}-${subcategoria.toLowerCase().replace(/\s+/g, '-')}`;
  }

  return slug;
}

function fixImageUrl(bubbleUrl?: string): string | null {
  if (!bubbleUrl) return null;
  if (bubbleUrl.startsWith('//')) {
    return 'https:' + bubbleUrl;
  }
  return bubbleUrl;
}

function generateFileName(categoria: string | undefined, index: number): string {
  const timestamp = Date.now();
  const categorySlug = categoria?.toLowerCase().replace(/\s+/g, '-') || 'peca';
  return `${categorySlug}-${timestamp}-${index}.jpg`;
}

function determinePieceType(categorySlug: string): 'upper' | 'lower' | 'full' {
  if (categorySlug.includes('calca') || categorySlug.includes('short') || categorySlug.includes('saia')) {
    return 'lower';
  }
  if (categorySlug.includes('vestido')) {
    return 'full';
  }
  return 'upper';
}

export async function POST() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user data from Supabase
    const { data: userData, error: fetchError } = await (supabase
      .from('users') as any)
      .select('phone, migrated_from_bubble, bubble_wardrobe_imported')
      .eq('id', user.id)
      .single();

    if (fetchError || !userData) {
      console.error('Error fetching user data:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Check if user is from Bubble
    if (!userData.migrated_from_bubble) {
      return NextResponse.json({
        success: false,
        message: 'User is not migrated from Bubble',
      });
    }

    // Check if wardrobe already imported
    if (userData.bubble_wardrobe_imported) {
      return NextResponse.json({
        success: true,
        message: 'Wardrobe already imported',
        itemsImported: 0,
      });
    }

    // Check if user has phone number
    if (!userData.phone) {
      console.error('User has no phone number:', user.id);
      return NextResponse.json(
        { error: 'User has no phone number' },
        { status: 400 }
      );
    }

    console.log(`🔍 Importing wardrobe for user ${user.id} (phone: ${userData.phone})`);

    // 1. Find user in Bubble by phone
    const bubbleUser = await getBubbleUserByPhone(userData.phone);

    if (!bubbleUser) {
      console.log(`⚠️  User not found in Bubble: ${userData.phone}`);
      // Mark as imported anyway to avoid retry loops
      await (supabase
        .from('users') as any)
        .update({ bubble_wardrobe_imported: true })
        .eq('id', user.id);

      return NextResponse.json({
        success: true,
        message: 'User not found in Bubble',
        itemsImported: 0,
      });
    }

    console.log(`✅ Found Bubble user: ${bubbleUser.Nome || 'Sem nome'} (ID: ${bubbleUser._id})`);

    // 2. Get wardrobe items from Bubble
    const vestuario = await getVestuarioByBubbleUser(bubbleUser._id);

    if (vestuario.length === 0) {
      console.log(`ℹ️  No wardrobe items found for this user`);
      // Mark as imported
      await (supabase
        .from('users') as any)
        .update({ bubble_wardrobe_imported: true })
        .eq('id', user.id);

      return NextResponse.json({
        success: true,
        message: 'No wardrobe items to import',
        itemsImported: 0,
      });
    }

    console.log(`📦 Found ${vestuario.length} wardrobe items to import`);

    // 3. Import each item to Supabase
    let importedCount = 0;
    const errors = [];

    for (let index = 0; index < vestuario.length; index++) {
      const item = vestuario[index];
      const imageUrl = fixImageUrl(item.Imagem);

      if (!imageUrl) {
        console.warn(`⚠️  Skipping item ${item._id} - no image URL`);
        continue;
      }

      const categorySlug = mapCategoria(item.Categoria, item.Subcategoria);
      const fileName = generateFileName(item.Categoria, index);
      const pieceType = determinePieceType(categorySlug);

      try {
        // Insert into user_uploads
        const { data: uploadData, error: uploadError } = await (supabase
          .from('user_uploads') as any)
          .insert({
            user_id: user.id,
            file_path: imageUrl,
            file_name: fileName,
            file_size: 0,
            mime_type: 'image/jpeg',
            thumbnail_path: imageUrl,
            status: 'ready',
            metadata: {
              garmentType: 'single',
              pieceType: pieceType,
              bubbleMetadata: {
                bubble_id: item._id,
                categoria: item.Categoria,
                subcategoria: item.Subcategoria,
                colecao: item['Coleção'],
              },
            },
            created_at: item['Created Date'] || new Date().toISOString(),
            updated_at: item['Modified Date'] || new Date().toISOString(),
          })
          .select('id')
          .single();

        if (uploadError || !uploadData) {
          console.error(`❌ Error inserting upload for item ${item._id}:`, uploadError);
          errors.push({ itemId: item._id, error: uploadError?.message });
          continue;
        }

        // Insert into wardrobe_items
        const { error: wardrobeError } = await (supabase
          .from('wardrobe_items') as any)
          .insert({
            user_id: user.id,
            upload_id: uploadData.id,
            category_slug: categorySlug,
            garment_type: 'single',
            piece_type: pieceType,
            metadata: {
              bubbleMetadata: {
                bubble_id: item._id,
                bubble_user_id: bubbleUser._id,
                categoria: item.Categoria,
                subcategoria: item.Subcategoria,
                colecao: item['Coleção'],
              },
            },
            created_at: item['Created Date'] || new Date().toISOString(),
            updated_at: item['Modified Date'] || new Date().toISOString(),
          });

        if (wardrobeError) {
          console.error(`❌ Error inserting wardrobe item ${item._id}:`, wardrobeError);
          errors.push({ itemId: item._id, error: wardrobeError.message });
          continue;
        }

        importedCount++;
        console.log(`✅ Imported item ${index + 1}/${vestuario.length}: ${item.Categoria || 'Sem categoria'}`);
      } catch (error) {
        console.error(`❌ Error importing item ${item._id}:`, error);
        errors.push({ itemId: item._id, error: String(error) });
      }
    }

    // 4. Mark wardrobe as imported
    const { error: updateError } = await (supabase
      .from('users') as any)
      .update({ bubble_wardrobe_imported: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error marking wardrobe as imported:', updateError);
    }

    console.log(`✅ Import completed: ${importedCount}/${vestuario.length} items imported`);

    return NextResponse.json({
      success: true,
      message: 'Wardrobe imported successfully',
      itemsImported: importedCount,
      totalItems: vestuario.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in import-bubble-wardrobe:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

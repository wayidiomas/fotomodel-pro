import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MainHeader } from '@/components/shared/main-header';
import { CurtidasClient } from './curtidas-client';

export const metadata = {
  title: 'Minhas Curtidas | Fotomodel Pro',
  description: 'Veja todas as imagens que você curtiu.',
};

export default async function CurtidasPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch user credits
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('credits')
    .eq('id', user.id)
    .single();

  // Fetch liked images with generation_results data
  const { data: likedItems, error } = await (supabase
    .from('generation_feedback') as any)
    .select(`
      id,
      created_at,
      generation_result:generation_results (
        id,
        image_url,
        thumbnail_url,
        created_at,
        generation:generations (
          id,
          created_at
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('feedback_type', 'like')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching liked items:', error);
  }

  // Filter out any null results and format
  const formattedItems = (likedItems || [])
    .filter((item: any) => item.generation_result)
    .map((item: any) => ({
      id: item.id,
      resultId: item.generation_result.id,
      imageUrl: item.generation_result.image_url,
      thumbnailUrl: item.generation_result.thumbnail_url,
      likedAt: item.created_at,
      generatedAt: item.generation_result.created_at,
    }));

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle at 12% 18%, rgba(214,192,150,0.14), transparent 32%), radial-gradient(circle at 85% 10%, rgba(190,170,130,0.12), transparent 32%), radial-gradient(circle at 30% 75%, rgba(200,180,140,0.1), transparent 38%)',
      }}
    >
      <MainHeader currentPage="curtidas" credits={userData?.credits || 0} />
      <CurtidasClient items={formattedItems} />
    </div>
  );
}

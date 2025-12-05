import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MainHeader } from '@/components/shared/main-header';
import { getStoragePublicUrl } from '@/lib/storage/upload';
import HistoricoClient, { type AuditEntry } from './historico-client';

const ENTRIES_LIMIT = 250; // safety cap for merged audit feed

export const metadata = {
  title: 'Histórico | Fotomodel Pro',
  description: 'Auditoria completa das suas ações: uploads, gerações e modelos.',
};

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // All queries in parallel for faster loading
  const [userDataResult, uploadsResult, generationsResult, userModelsResult] = await Promise.all([
    // 1. Credits for header badge
    (supabase.from('users') as any)
      .select('credits')
      .eq('id', user.id)
      .single(),

    // 2. Fetch uploads - minimal fields
    (supabase.from('user_uploads') as any)
      .select('id, file_name, thumbnail_path, file_path, created_at, status, metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(ENTRIES_LIMIT),

    // 3. Fetch generations with results - NO input_data (huge JSON)
    (supabase.from('generations') as any)
      .select(`
        id,
        created_at,
        credits_used,
        status,
        generation_results (
          id,
          image_url,
          thumbnail_url,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(ENTRIES_LIMIT),

    // 4. Fetch models - minimal fields
    (supabase.from('user_models') as any)
      .select('id, model_name, thumbnail_url, created_at, gender, age_range')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(ENTRIES_LIMIT),
  ]);

  const userData = userDataResult.data;
  const uploads = uploadsResult.data;
  const generations = generationsResult.data;
  const userModels = userModelsResult.data;

  const entries: AuditEntry[] = [];

  (uploads || []).forEach((upload: any) => {
    const imageUrl = getStoragePublicUrl(upload.thumbnail_path || upload.file_path) || '';
    entries.push({
      id: `upload-${upload.id}`,
      type: 'upload',
      title: upload.file_name || 'Upload',
      subtitle: upload.status || 'enviado',
      createdAt: upload.created_at,
      imageUrl,
      meta: upload.metadata?.garmentMetadata?.category || '',
    });
  });

  (generations || []).forEach((gen: any) => {
    (gen.generation_results || []).forEach((result: any) => {
      const imageUrl = getStoragePublicUrl(result.thumbnail_url || result.image_url) || '';
      entries.push({
        id: `gen-${gen.id}-${result.id}`,
        type: 'generation',
        title: 'Geração concluída',
        subtitle: gen.status || 'concluída',
        createdAt: result.created_at || gen.created_at,
        imageUrl: imageUrl || '',
        meta: gen.credits_used ? `${gen.credits_used} créditos` : undefined,
      });
    });
  });

  (userModels || []).forEach((model: any) => {
    const imageUrl = getStoragePublicUrl(model.thumbnail_url) || '';
    entries.push({
      id: `model-${model.id}`,
      type: 'model',
      title: model.model_name || 'Modelo salvo',
      subtitle: [model.gender, model.age_range].filter(Boolean).join(' • ') || 'Modelo',
      createdAt: model.created_at,
      imageUrl: imageUrl || '',
      meta: 'Modelo salvo',
    });
  });

  // Sort and paginate
  const sorted = entries.sort((a, b) => {
    const aDate = new Date(a.createdAt || '').getTime();
    const bDate = new Date(b.createdAt || '').getTime();
    return bDate - aDate;
  });

  const page = Math.max(1, Number(resolvedSearchParams?.page || '1'));
  const perPage = 18;
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const start = (page - 1) * perPage;
  const paginatedEntries = sorted.slice(start, start + perPage);

  return (
    <div className="min-h-screen bg-[#f5f4f0] animate-gradient-slow" style={{
      backgroundImage:
        'radial-gradient(circle at 12% 18%, rgba(214,192,150,0.14), transparent 32%), radial-gradient(circle at 85% 10%, rgba(190,170,130,0.12), transparent 32%), radial-gradient(circle at 30% 75%, rgba(200,180,140,0.1), transparent 38%)',
    }}>
      <MainHeader currentPage="historico" credits={userData?.credits || 0} />

      <HistoricoClient
        entries={paginatedEntries}
        totalCount={sorted.length}
        page={page}
        totalPages={totalPages}
        perPage={perPage}
      />
    </div>
  );
}

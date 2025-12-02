import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui';
import {
  ArrowRight,
  Hanger,
  FlatSurface,
  Reload,
  MenuDots,
  GridView,
  ListView,
} from '@/components/icons';
import { getAIToolIcon } from '@/lib/ai-tools-icons';
import { DashboardClient } from './dashboard-client';
import { Logo } from '@/components/shared/logo';
import { getStoragePublicUrl } from '@/lib/storage/upload';

/**
 * Dashboard Page (Server Component)
 *
 * Página principal do dashboard com:
 * - Header com navegação e créditos
 * - Cards de ações principais (Cabide e Superfície Plana)
 * - Ferramentas de IA
 * - Downloads recentes
 * - Seção "Somente para você" com timer
 */

const NAV_LINKS = [
  { name: 'Dashboard', href: '/dashboard', active: true },
  { name: 'Criar', href: '/criar', active: false },
  { name: 'Chat', href: '/chat', active: false, badge: 'BETA' as const },
  { name: 'Vestuário', href: '/vestuario', active: false },
  { name: 'Galeria', href: '/galeria', active: false },
  { name: 'Modelos', href: '/modelos', active: false },
  { name: 'Histórico', href: '/historico', active: false },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Middleware should redirect, but safeguard
  }

  // Fetch user data with credits
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('credits, full_name, phone')
    .eq('id', user.id)
    .single();

  // Fetch AI tools from database
  const { data: aiTools } = await (supabase
    .from('ai_tools') as any)
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('display_order', { ascending: true });

  // Fetch recent downloads
  const { data: recentDownloads } = await (supabase
    .from('user_downloads') as any)
    .select(`
      *,
      generation_results (
        image_url,
        thumbnail_url
      )
    `)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('downloaded_at', { ascending: false })
    .limit(12);

  // Fetch incomplete generations (for "Somente para você")
  const { data: incompleteGenerations } = await (supabase
    .from('generations') as any)
    .select(`
      *,
      generation_results!inner (
        id,
        image_url,
        thumbnail_url,
        has_watermark,
        is_purchased
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .eq('generation_results.is_purchased', false)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(12);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 items-center justify-between px-8">
          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center">
              <Logo variant="header" className="h-8 w-auto" />
            </Link>

            <nav className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-inter font-medium transition-colors ${
                    link.active
                      ? 'bg-gray-200/50 text-[#20202a]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {link.name}
                    {link.badge && (
                      <span className="rounded-full bg-[#20202a] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        {link.badge}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Credits + Actions */}
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-slate-200 px-3 py-1">
              <span className="font-inter text-sm font-semibold text-[#020817]">
                {userData?.credits || 0} créditos
              </span>
            </div>
            <Button
              variant="outline"
              className="h-9 gap-2 rounded-md border-slate-200 px-4 text-sm font-inter font-medium"
            >
              <Reload className="h-4 w-4" />
              Recarregar
            </Button>
            <button className="rounded-md p-2 hover:bg-gray-100">
              <MenuDots className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1728px] space-y-8 px-7 py-10">
        {/* Top Cards - Cabide e Superfície Plana */}
        <div className="grid grid-cols-2 gap-6">
          {/* Cabide Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#eae6de] p-8">
            <div className="relative z-10 flex gap-10">
              {/* Lado Esquerdo: Conteúdo */}
              <div className="flex-1 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                  <Hanger className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h3 className="font-inter text-2xl font-bold text-black">Cabide</h3>
                  <p className="mt-2 font-inter text-base text-black">
                    Crie a(o) modelo a partir de foto da roupa no cabide.
                  </p>
                </div>
                <Link href="/criar/cabide" className="inline-block">
                  <Button className="gap-2 rounded-md bg-[#20202a] px-4 py-2.5 font-inter text-sm font-medium text-white shadow hover:bg-[#20202a]/90">
                    Começar agora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Lado Direito: Imagens */}
              <div className="relative flex-1">
                {/* Container das 2 roupas no cabide */}
                <div className="relative h-[249px] w-[193px]">
                  <Image
                    src="/assets/images/cabide-roupa-superior.png"
                    alt="Blusa vermelha no cabide"
                    width={115}
                    height={156}
                    className="absolute left-[78px] top-0"
                  />
                  <Image
                    src="/assets/images/cabide-roupa-inferior.png"
                    alt="Shorts jeans no cabide"
                    width={115}
                    height={156}
                    className="absolute left-0 top-[69px]"
                  />
                </div>

                {/* Seta curvada */}
                <Image
                  src="/assets/images/cabide-seta.svg"
                  alt="Seta indicando transformação"
                  width={72}
                  height={90}
                  className="absolute left-[163px] top-[90px]"
                  style={{ transform: 'rotate(104.203deg)' }}
                />

                {/* Modelo vestido */}
                <Image
                  src="/assets/images/cabide-modelo.png"
                  alt="Modelo usando a roupa"
                  width={169}
                  height={274}
                  className="absolute right-0 top-0"
                />
              </div>
            </div>

            {/* Decorative overlay */}
            <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-white/10" />
          </div>

          {/* Superfície Plana Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#eceff1] p-8">
            <div className="relative z-10 flex gap-10">
              {/* Lado Esquerdo: Conteúdo */}
              <div className="flex-1 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                  <FlatSurface className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h3 className="font-inter text-2xl font-bold text-black">Superfície plana</h3>
                  <p className="mt-2 font-inter text-base text-black">
                    Crie a(o) modelo a partir de foto da roupa em cima de uma mesa ou balcão.
                  </p>
                </div>
                <Link href="/criar/superficie-plana" className="inline-block">
                  <Button className="gap-2 rounded-md bg-[#20202a] px-4 py-2.5 font-inter text-sm font-medium text-white shadow hover:bg-[#20202a]/90">
                    Começar agora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Lado Direito: Imagens */}
              <div className="relative flex-1">
                {/* Container das 2 roupas na superfície plana */}
                <div className="relative h-[249px] w-[193px]">
                  <Image
                    src="/assets/images/cabide-roupa-superior.png"
                    alt="Blusa vermelha na superfície"
                    width={115}
                    height={156}
                    className="absolute left-[78px] top-0"
                  />
                  <Image
                    src="/assets/images/cabide-roupa-inferior.png"
                    alt="Shorts jeans na superfície"
                    width={115}
                    height={156}
                    className="absolute left-0 top-[69px]"
                  />
                </div>

                {/* Seta curvada */}
                <Image
                  src="/assets/images/cabide-seta.svg"
                  alt="Seta indicando transformação"
                  width={72}
                  height={90}
                  className="absolute left-[163px] top-[90px]"
                  style={{ transform: 'rotate(104.203deg)' }}
                />

                {/* Modelo vestido */}
                <Image
                  src="/assets/images/plana-modelo.png"
                  alt="Modelo usando a roupa"
                  width={169}
                  height={274}
                  className="absolute right-0 top-0"
                />
              </div>
            </div>

            {/* Decorative overlay */}
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Ferramentas de IA */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-inter text-2xl font-bold text-gray-900">Ferramentas de IA</h2>
            <button className="font-inter text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
              Ver todas
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {aiTools && aiTools.length > 0 ? (
              aiTools.map((tool: any) => {
                const targetHref = getToolHref(tool.name);
                const isDisabled = tool.status === 'soon' || !targetHref;
                const cardClasses = `group relative flex flex-col items-center gap-3 rounded-xl bg-white p-5 shadow-sm transition-all ${
                  isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:shadow-md hover:-translate-y-0.5 active:scale-95'
                }`;
                const cardContent = (
                  <>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
                        isDisabled ? 'bg-gray-100' : 'bg-gray-100 group-hover:bg-blue-50'
                      }`}
                    >
                      {(() => {
                        const LocalIcon = getAIToolIcon(tool.name);
                        if (LocalIcon) {
                          return (
                            <LocalIcon
                              className={`h-6 w-6 transition-colors ${
                                isDisabled ? 'text-gray-400' : 'text-gray-600 group-hover:text-blue-600'
                              }`}
                            />
                          );
                        }
                        if (tool.icon_url) {
                          return <Image src={tool.icon_url} alt={tool.name} width={24} height={24} />;
                        }
                        return <span className="text-2xl">🤖</span>;
                      })()}
                    </div>
                    <div className="text-center space-y-0.5">
                      <h4 className="font-inter text-sm font-medium text-gray-900 leading-tight">{tool.name}</h4>
                      <p className="font-inter text-xs text-gray-500">
                        {tool.credits_cost} crédito{tool.credits_cost > 1 ? 's' : ''}
                      </p>
                    </div>

                    {tool.status === 'beta' && (
                      <div className="absolute right-2 top-2 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5">
                        <span className="font-inter text-[10px] font-semibold text-blue-600">Beta</span>
                      </div>
                    )}
                    {tool.status === 'soon' && (
                      <div className="absolute right-2 top-2 rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5">
                        <span className="font-inter text-[10px] font-semibold text-gray-600">Em breve</span>
                      </div>
                    )}
                  </>
                );

                if (isDisabled) {
                  return (
                    <div key={tool.id} className={cardClasses}>
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link key={tool.id} href={targetHref!} className={cardClasses}>
                    {cardContent}
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full w-full text-center py-8 text-gray-500">
                <p className="font-inter text-sm">Nenhuma ferramenta disponível no momento</p>
              </div>
            )}
          </div>
        </section>

        {/* Downloads recentes */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-inter text-2xl font-bold text-gray-900">Downloads recentes</h2>
            <div className="flex gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[#eceff1] transition-colors hover:bg-[#eceff1]/80">
                <ListView className="h-4 w-4" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[#eceff1] transition-colors hover:bg-[#eceff1]/80">
                <GridView className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {recentDownloads && recentDownloads.length > 0 ? (
              recentDownloads
                .map((download: any) => ({
                  ...download,
                  imageUrl: getStoragePublicUrl(download.thumbnail_url || download.image_url),
                }))
                .filter((download: any): download is any & { imageUrl: string } =>
                  download.imageUrl !== null
                )
                .map((download: any) => (
                  <div
                    key={download.id}
                    className="group relative aspect-[3/4] overflow-hidden rounded-lg shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Image
                      src={download.imageUrl}
                      alt={`Download ${download.id}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    />
                  </div>
                ))
            ) : (
              <div className="col-span-full w-full text-center py-12 text-gray-500">
                <div className="max-w-md mx-auto space-y-2">
                  <p className="font-inter text-sm font-medium">Nenhum download ainda</p>
                  <p className="font-inter text-xs text-gray-400">
                    Suas imagens baixadas aparecerão aqui
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Somente para você */}
        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-inter text-2xl font-bold text-gray-900">Somente para você</h2>
              <p className="mt-1 font-inter text-sm text-gray-600">
                Finalize suas criações anteriores com desconto especial
              </p>
            </div>
            <div className="flex items-center gap-5">
              <DashboardClient />
              <div className="flex gap-2">
                <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[#eceff1] transition-colors hover:bg-[#eceff1]/80">
                  <ListView className="h-4 w-4" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[#eceff1] transition-colors hover:bg-[#eceff1]/80">
                  <GridView className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {incompleteGenerations && incompleteGenerations.length > 0 ? (
              incompleteGenerations
                .map((generation: any) => {
                  const result = generation.generation_results?.[0];
                  if (!result) return null;
                  const imageUrl = getStoragePublicUrl(result.thumbnail_url || result.image_url);
                  return { ...generation, result, imageUrl };
                })
                .filter((item: any): item is { id: string; result: any; imageUrl: string } =>
                  item !== null && item.imageUrl !== null
                )
                .map(({ id, result, imageUrl }) => (
                  <div
                    key={id}
                    className="group relative aspect-[3/4] overflow-hidden rounded-lg shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Image
                      src={imageUrl}
                      alt={`Generation ${id}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    />
                    {/* Overlay to indicate incomplete/special */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    {result.has_watermark && (
                      <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2.5 py-1 backdrop-blur-sm">
                        <span className="font-inter text-xs font-medium text-white">Preview</span>
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <div className="col-span-full w-full text-center py-12 text-gray-500">
                <div className="max-w-md mx-auto space-y-2">
                  <p className="font-inter text-sm font-medium">Nenhuma criação pendente</p>
                  <p className="font-inter text-xs text-gray-400">
                    Gerações incompletas aparecerão aqui
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
const TOOL_ROUTE_MAP: Record<string, string> = {
  'cabide': '/criar/cabide',
  'superficie plana': '/criar/superficie-plana',
  'roupa flutuante': '/criar/roupa-flutuante',
  'roupa no corpo': '/criar/roupa-no-corpo',
  'manequim': '/criar/manequim',
  'geracao livre': '/chat',
  'chat - geracao livre': '/chat',
  'chat - geração livre': '/chat',
};

const normalizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const getToolHref = (name: string) => {
  const normalized = normalizeName(name);
  return TOOL_ROUTE_MAP[normalized] || null;
};

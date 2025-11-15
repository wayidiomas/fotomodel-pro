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
  const { data: userData } = await supabase
    .from('users')
    .select('credits, full_name, phone')
    .eq('id', user.id)
    .single();

  // Fetch AI tools from database
  const { data: aiTools } = await supabase
    .from('ai_tools')
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('display_order', { ascending: true });

  // Fetch recent downloads
  const { data: recentDownloads } = await supabase
    .from('user_downloads')
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
  const { data: incompleteGenerations } = await supabase
    .from('generations')
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
              <Image
                src="/assets/images/logo-extended.svg"
                alt="Fotomodel"
                width={176}
                height={32}
                priority
                className="h-8 w-auto"
              />
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
                  {link.name}
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
            <div className="relative z-10 max-w-md space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                <Hanger className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="font-inter text-2xl font-bold text-black">Cabide</h3>
                <p className="mt-2 font-inter text-base text-black">
                  Visualize suas peças a partir de roupas no cabide
                </p>
              </div>
              <Button className="gap-2 rounded-md bg-[#20202a] px-4 py-2.5 font-inter text-sm font-medium text-white shadow hover:bg-[#20202a]/90">
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            {/* Decorative overlay */}
            <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-white/10" />
          </div>

          {/* Superfície Plana Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#eceff1] p-8">
            <div className="relative z-10 max-w-md space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                <FlatSurface className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="font-inter text-2xl font-bold text-black">Superfície plana</h3>
                <p className="mt-2 font-inter text-base text-black">
                  Crie a(o) modelo a partir de foto da roupa em cima de uma mesa ou balcão.
                </p>
              </div>
              <Button className="gap-2 rounded-md bg-[#20202a] px-4 py-2.5 font-inter text-sm font-medium text-white shadow hover:bg-[#20202a]/90">
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Button>
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
              aiTools.map((tool) => (
                <button
                  key={tool.id}
                  disabled={tool.status === 'soon'}
                  className={`group relative flex flex-col items-center gap-3 rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                    tool.status === 'soon'
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:-translate-y-0.5 active:scale-95'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
                    tool.status === 'soon'
                      ? 'bg-gray-100'
                      : 'bg-gray-100 group-hover:bg-blue-50'
                  }`}>
                    {(() => {
                      const LocalIcon = getAIToolIcon(tool.name);
                      if (LocalIcon) {
                        return <LocalIcon className={`h-6 w-6 transition-colors ${
                          tool.status === 'soon'
                            ? 'text-gray-400'
                            : 'text-gray-600 group-hover:text-blue-600'
                        }`} />;
                      }
                      if (tool.icon_url) {
                        return <Image src={tool.icon_url} alt={tool.name} width={24} height={24} />;
                      }
                      return <span className="text-2xl">🤖</span>;
                    })()}
                  </div>
                  <div className="text-center space-y-0.5">
                    <h4 className="font-inter text-sm font-medium text-gray-900 leading-tight">{tool.name}</h4>
                    <p className="font-inter text-xs text-gray-500">{tool.credits_cost} crédito{tool.credits_cost > 1 ? 's' : ''}</p>
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
                </button>
              ))
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
              recentDownloads.map((download) => (
                <div
                  key={download.id}
                  className="group relative aspect-[3/4] overflow-hidden rounded-lg shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <Image
                    src={download.thumbnail_url || download.image_url}
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
              incompleteGenerations.map((generation) => (
                <div
                  key={generation.id}
                  className="group relative aspect-[3/4] overflow-hidden rounded-lg shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  {generation.generation_results?.[0] && (
                    <>
                      <Image
                        src={generation.generation_results[0].thumbnail_url || generation.generation_results[0].image_url}
                        alt={`Generation ${generation.id}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      />
                      {/* Overlay to indicate incomplete/special */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      {generation.generation_results[0].has_watermark && (
                        <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2.5 py-1 backdrop-blur-sm">
                          <span className="font-inter text-xs font-medium text-white">Preview</span>
                        </div>
                      )}
                    </>
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

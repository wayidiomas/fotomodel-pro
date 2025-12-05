'use client';

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Folder,
  MoreVertical,
  Sparkles,
  UploadCloud,
  Layers,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Tables } from '@/types/database.types';
import type { WardrobeItemWithUpload } from './page';
import { getStoragePublicUrl } from '@/lib/storage/upload';
import { CreateCollectionDialog } from '@/components/vestuario/create-collection-dialog';
import { AddWardrobeItemDialog } from '@/components/vestuario/add-wardrobe-item-dialog';
import { EditWardrobeItemDialog } from '@/components/vestuario/edit-wardrobe-item-dialog';
import { SubscriptionModal } from '@/components/subscription/subscription-modal';
import { cn } from '@/lib/utils';
import { GarmentCategory } from '@/lib/generation-flow/garment-metadata-types';
import { createClient } from '@/lib/supabase/client';
import { useWardrobeItems, useWardrobeCollections, useInvalidateQueries, useWardrobeLimits } from '@/lib/hooks/use-queries';

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface VestuarioClientProps {
  collections: Tables<'wardrobe_collections'>[];
  initialItems: WardrobeItemWithUpload[];
  pagination: PaginationInfo;
}

// Garment category groups for filtering
const CATEGORY_FILTERS = [
  {
    slug: 'tops',
    label: 'Camisetas & Tops',
    categories: ['TSHIRT', 'TANK_TOP', 'POLO', 'HENLEY', 'LONG_SLEEVE', 'BLOUSE', 'DRESS_SHIRT', 'BUTTON_DOWN']
  },
  {
    slug: 'sweaters',
    label: 'Moletons & Suéteres',
    categories: ['SWEATER', 'CARDIGAN', 'PULLOVER', 'TURTLENECK', 'HOODIE', 'SWEATSHIRT']
  },
  {
    slug: 'jackets',
    label: 'Casacos & Jaquetas',
    categories: ['BLAZER', 'SUIT_JACKET', 'BOMBER_JACKET', 'DENIM_JACKET', 'LEATHER_JACKET', 'TRENCH_COAT', 'PARKA', 'PEACOAT', 'PUFFER_JACKET', 'WINDBREAKER', 'VEST', 'TRACK_JACKET']
  },
  {
    slug: 'pants',
    label: 'Calças',
    categories: ['JEANS', 'DRESS_PANTS', 'CHINOS', 'CARGO_PANTS', 'JOGGERS', 'SWEATPANTS', 'LEGGINGS']
  },
  {
    slug: 'shorts',
    label: 'Shorts & Bermudas',
    categories: ['SHORTS', 'BERMUDA', 'CARGO_SHORTS', 'ATHLETIC_SHORTS']
  },
  {
    slug: 'skirts',
    label: 'Saias',
    categories: ['PENCIL_SKIRT', 'A_LINE_SKIRT', 'MIDI_SKIRT', 'MAXI_SKIRT', 'MINI_SKIRT', 'PLEATED_SKIRT']
  },
  {
    slug: 'dresses',
    label: 'Vestidos',
    categories: ['CASUAL_DRESS', 'COCKTAIL_DRESS', 'EVENING_GOWN', 'MIDI_DRESS', 'MAXI_DRESS', 'SHIRT_DRESS', 'WRAP_DRESS', 'SUNDRESS']
  },
  {
    slug: 'jumpsuits',
    label: 'Macacões',
    categories: ['JUMPSUIT', 'ROMPER', 'OVERALLS']
  },
] as const;

// Collection icon colors (from Figma design)
const COLLECTION_COLORS = [
  '#3B82F6', // blue-500
  '#F97316', // orange-500
  '#EAB308', // yellow-500
  '#22C55E', // green-500
  '#A855F7', // purple-500
  '#EC4899', // pink-500
];

export function VestuarioClient({
  collections: initialCollections,
  initialItems,
  pagination: initialPagination
}: VestuarioClientProps) {
  const router = useRouter();
  const { invalidateWardrobe } = useInvalidateQueries();

  // React Query for wardrobe items with infinite scroll
  const {
    data: itemsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWardrobeItems();

  // React Query for collections
  const { data: collectionsData } = useWardrobeCollections();

  // Check wardrobe limits
  const { data: limits } = useWardrobeLimits();

  // Use cached data or fall back to initial SSR data
  const items = useMemo(() => {
    if (itemsData?.pages?.length) {
      return itemsData.pages.flatMap(page => page.items) as WardrobeItemWithUpload[];
    }
    return initialItems;
  }, [itemsData, initialItems]);

  const collections = collectionsData || initialCollections;
  const pagination = itemsData?.pages?.length
    ? itemsData.pages[itemsData.pages.length - 1].pagination
    : initialPagination;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddPieceDialogOpen, setIsAddPieceDialogOpen] = useState(false);
  const [preselectedCollectionId, setPreselectedCollectionId] = useState<string | null>(null);
  const [openCollectionMenu, setOpenCollectionMenu] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{ open: boolean; collectionId: string | null; name: string }>({
    open: false,
    collectionId: null,
    name: '',
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; collectionId: string | null; name: string }>({
    open: false,
    collectionId: null,
    name: '',
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const itemsSectionRef = useRef<HTMLDivElement>(null);
  const [openItemMenu, setOpenItemMenu] = useState<string | null>(null);

  // Edit item state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<WardrobeItemWithUpload | null>(null);

  // Delete item confirmation modal state
  const [deleteItemModal, setDeleteItemModal] = useState<{
    open: boolean;
    itemId: string | null;
    itemName: string;
  }>({
    open: false,
    itemId: null,
    itemName: '',
  });
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Load more using React Query
  const loadMore = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  const isLoadingMore = isFetchingNextPage;

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      // Check which category group this item belongs to based on its garment_type
      const garmentType = item.garment_type;
      if (garmentType) {
        CATEGORY_FILTERS.forEach((filter) => {
          if (filter.categories.includes(garmentType)) {
            counts.set(filter.slug, (counts.get(filter.slug) || 0) + 1);
          }
        });
      }
    });
    return counts;
  }, [items]);

  const totalPieces = pagination.total;
  const totalCollections = collections.length;
  const extendedFilters = [
    { slug: null, label: 'Todas as categorias' },
    ...CATEGORY_FILTERS,
  ];

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory
      ? (() => {
        const filter = CATEGORY_FILTERS.find(f => f.slug === selectedCategory);
        return filter && item.garment_type && filter.categories.includes(item.garment_type);
      })()
      : true;
    const matchesCollection = activeCollectionId ? item.collection_id === activeCollectionId : true;
    return matchesCategory && matchesCollection;
  });

  const scrollToItems = useCallback(() => {
    if (itemsSectionRef.current) {
      itemsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleCollectionClick = (collectionId: string) => {
    setSelectedCategory(null);
    setActiveCollectionId((prev) => {
      const next = prev === collectionId ? null : collectionId;
      requestAnimationFrame(scrollToItems);
      return next;
    });
  };

  const handleAddPieceClick = (collectionId?: string | null) => {
    setPreselectedCollectionId(collectionId || null);
    setIsAddPieceDialogOpen(true);
  };

  const handleAddPieceDialogChange = (open: boolean) => {
    setIsAddPieceDialogOpen(open);
    if (!open) {
      setPreselectedCollectionId(null);
    }
  };

  const handleMenuToggle = (event: React.MouseEvent, collectionId: string) => {
    event.stopPropagation();
    setOpenCollectionMenu((prev) => (prev === collectionId ? null : collectionId));
  };

  const openRenameModal = (collectionId: string, name: string) => {
    setOpenCollectionMenu(null);
    setModalError(null);
    setRenameModal({ open: true, collectionId, name });
  };

  const openDeleteConfirmation = (collectionId: string, name: string) => {
    setOpenCollectionMenu(null);
    setModalError(null);
    setDeleteModal({ open: true, collectionId, name });
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest('[data-collection-menu-trigger]') ||
        target?.closest('[data-collection-menu-panel]')
      ) {
        return;
      }
      if (
        target?.closest('[data-item-menu-trigger]') ||
        target?.closest('[data-item-menu-panel]')
      ) {
        return;
      }
      setOpenCollectionMenu(null);
      setOpenItemMenu(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const handleRenameCollection = async () => {
    if (!renameModal.collectionId) return;
    const trimmedName = renameModal.name.trim();
    if (!trimmedName) {
      setModalError('Informe um nome válido para a coleção.');
      return;
    }

    try {
      setIsActionLoading(true);
      setModalError(null);
      const supabase = createClient();
      const { error } = await supabase
        .from('wardrobe_collections')
        .update({ name: trimmedName })
        .eq('id', renameModal.collectionId);

      if (error) {
        setModalError(error.message || 'Erro ao renomear coleção.');
        return;
      }
      setRenameModal({ open: false, collectionId: null, name: '' });
      router.refresh();
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Erro ao renomear coleção.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!deleteModal.collectionId) return;
    try {
      setIsActionLoading(true);
      setModalError(null);
      const supabase = createClient();
      const { error } = await supabase
        .from('wardrobe_collections')
        .update({ is_deleted: true })
        .eq('id', deleteModal.collectionId);

      if (error) {
        setModalError(error.message || 'Erro ao excluir coleção.');
        return;
      }
      if (activeCollectionId === deleteModal.collectionId) {
        setActiveCollectionId(null);
      }
      setDeleteModal({ open: false, collectionId: null, name: '' });
      router.refresh();
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Erro ao excluir coleção.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleItemMenuToggle = (event: React.MouseEvent, itemId: string) => {
    event.stopPropagation();
    setOpenItemMenu((prev) => (prev === itemId ? null : itemId));
  };

  const handleEditItem = (itemId: string) => {
    setOpenItemMenu(null);
    const item = items.find(i => i.id === itemId);
    if (item) {
      setItemToEdit(item);
      setIsEditDialogOpen(true);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setOpenItemMenu(null);
    const item = items.find(i => i.id === itemId);
    if (item) {
      setDeleteItemModal({
        open: true,
        itemId: item.id,
        itemName: item.upload?.file_name || 'esta peça',
      });
    }
  };

  const [deleteItemError, setDeleteItemError] = useState<string | null>(null);

  const confirmDeleteItem = async () => {
    if (!deleteItemModal.itemId) return;

    setIsDeletingItem(true);
    setDeleteItemError(null);
    try {
      const response = await fetch('/api/wardrobe/items', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId: deleteItemModal.itemId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir peça');
      }

      setDeleteItemModal({ open: false, itemId: null, itemName: '' });
      invalidateWardrobe();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao excluir peça';
      console.error('Error deleting item:', message);
      setDeleteItemError(message);
    } finally {
      setIsDeletingItem(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 px-10 py-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/50 bg-white/85 p-8 shadow-[0_25px_70px_rgba(15,15,35,0.12)] backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(210,200,180,0.25),_transparent_55%)]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f1e7d3] bg-[#f7f2e7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#4b3f2f]">
              <Sparkles className="h-3.5 w-3.5" />
              Guarda-roupa digital
            </div>
            <div className="space-y-1">
              <h1 className="font-freight font-medium text-3xl text-[#111827]">Vestuário</h1>
              <p className="font-inter text-base text-[#4b5563]">
                Salve peças, organize coleções e acelere sua criação com referências visuais.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative group">
                <button
                  onClick={() => handleAddPieceClick()}
                  disabled={limits?.isAtLimit}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl border border-[#20202a]/10 bg-[#20202a] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#20202a]/30 transition hover:bg-[#2b2b35]",
                    limits?.isAtLimit && "opacity-50 cursor-not-allowed hover:bg-[#20202a]"
                  )}
                >
                  <UploadCloud className="h-4 w-4" />
                  Adicionar peça
                </button>
                {limits?.isAtLimit && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSubscriptionModalOpen(true);
                    }}
                    className="absolute left-1/2 top-full mt-2 w-64 -translate-x-1/2 cursor-pointer rounded-xl bg-gray-900 px-3 py-2 text-center text-xs text-white opacity-0 shadow-xl transition-all hover:bg-gray-800 group-hover:opacity-100"
                  >
                    Você atingiu o limite de {limits.maxItems} peças do plano {limits.planSlug === 'free' ? 'Gratuito' : limits.planSlug}.{' '}
                    <span className="font-semibold underline">Clique aqui para fazer upgrade</span>
                    <div className="absolute bottom-full left-1/2 -mb-1 -ml-1 border-4 border-transparent border-b-gray-900" />
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-sm"
              >
                <Folder className="h-4 w-4" />
                Nova coleção
              </button>
            </div>
          </div>
          <div className="grid w-full max-w-md grid-cols-2 gap-4 rounded-3xl border border-white/40 bg-white/60 p-4 shadow-inner backdrop-blur">
            <div className="rounded-2xl bg-white/70 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Peças salvas
              </p>
              <p className="mt-1 text-3xl font-bold text-[#111827]">{totalPieces}</p>
              <p className="text-xs text-gray-500">atualizadas automaticamente</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Coleções
              </p>
              <p className="mt-1 text-3xl font-bold text-[#111827]">
                {totalCollections}
              </p>
              <p className="text-xs text-gray-500">separadas por campanha</p>
            </div>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-freight font-medium text-xl text-[#020817]">
              Coleções
            </h2>
            <p className="text-sm text-gray-500">
              Agrupe peças por cliente, temporada ou estilo.
            </p>
          </div>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-sm"
          >
            <Layers className="h-4 w-4" />
            Organizar coleções
          </button>
        </div>

        {collections.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {collections.map((collection, index) => {
              const iconColor =
                collection.icon_color ||
                COLLECTION_COLORS[index % COLLECTION_COLORS.length];

              const isActive = activeCollectionId === collection.id;
              const collectionItemsCount = items.filter(item => item.collection_id === collection.id).length;

              return (
                <div
                  key={collection.id}
                  onClick={() => handleCollectionClick(collection.id)}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'group relative flex cursor-pointer items-center gap-4 rounded-[24px] border border-white/50 bg-white/70 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#20202a]',
                    isActive && 'border-[#20202a] bg-white/90 shadow-lg'
                  )}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleCollectionClick(collection.id);
                    }
                  }}
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-inner"
                    style={{ backgroundColor: iconColor }}
                  >
                    <Folder className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-freight font-medium text-lg text-[#020817]">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {collectionItemsCount}{' '}
                      {collectionItemsCount === 1 ? 'peça' : 'peças'}
                    </p>
                  </div>
                  <div className="relative" data-collection-menu-panel-wrapper>
                    <button
                      className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
                      aria-label="Ações da coleção"
                      data-collection-menu-trigger
                      onClick={(event) => handleMenuToggle(event, collection.id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openCollectionMenu === collection.id && (
                      <div
                        className="absolute right-0 top-11 z-10 w-48 rounded-2xl border border-white/60 bg-white/95 p-1 shadow-lg backdrop-blur"
                        data-collection-menu-panel
                      >
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenCollectionMenu(null);
                            handleCollectionClick(collection.id);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                          Abrir coleção
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openRenameModal(collection.id, collection.name);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                          Renomear
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenCollectionMenu(null);
                            handleAddPieceClick(collection.id);
                          }}
                          disabled={limits?.isAtLimit}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium",
                            limits?.isAtLimit
                              ? "cursor-not-allowed text-gray-400 opacity-50"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          Adicionar peças
                          {limits?.isAtLimit && (
                            <span className="ml-auto text-[10px] text-gray-400">(limite atingido)</span>
                          )}
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openDeleteConfirmation(collection.id, collection.name);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-gray-200 bg-white/70 p-12 text-center shadow-inner">
            <p className="text-sm font-semibold text-gray-500">Nenhuma coleção criada</p>
            <p className="text-xs text-gray-400">
              Crie coleções para separar peças por temporada ou loja.
            </p>
          </div>
        )}
      </section>

      {/* Filters */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-freight font-medium text-xl text-[#020817]">
            Navegue por categoria
          </h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm font-semibold text-[#20202a] underline-offset-4 hover:underline"
            >
              Limpar filtro
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {extendedFilters.map((category) => {
            const isSelected = selectedCategory === category.slug;
            const count = category.slug
              ? categoryCounts.get(category.slug) || 0
              : totalPieces;

            return (
              <button
                key={category.slug ?? 'all'}
                onClick={() => setSelectedCategory(category.slug)}
                className={cn(
                  'flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all',
                  isSelected
                    ? 'border-[#20202a] bg-[#20202a] text-white shadow-md'
                    : 'border-gray-200 bg-white/80 text-[#374151] hover:border-[#20202a]/40'
                )}
              >
                {category.label}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    isSelected ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Wardrobe items */}
      <section ref={itemsSectionRef} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-freight font-medium text-xl text-[#020817]">
              Peças salvas
            </h2>
            <p className="text-sm text-gray-500">
              {filteredItems.length}{' '}
              {filteredItems.length === 1 ? 'item disponível' : 'itens disponíveis'}
            </p>
            {activeCollectionId && (
              <p className="text-xs text-[#7a5e2a]">
                Filtrando pela coleção{' '}
                {collections.find(collection => collection.id === activeCollectionId)?.name || 'selecionada'}
              </p>
            )}
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredItems.map((item) => {
              const imageUrl =
                (item.upload.metadata as any)?.publicUrl ||
                getStoragePublicUrl(item.upload.thumbnail_path, 'user-uploads') ||
                getStoragePublicUrl(item.upload.file_path, 'user-uploads');
              // Get category label from GarmentCategory enum
              const categoryLabel = item.garment_type
                ? (GarmentCategory[item.garment_type as keyof typeof GarmentCategory] || 'Peça')
                : 'Peça';
              const createdDate = item.created_at ? new Date(item.created_at) : null;

              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-[30px] border border-white/40 bg-white/60 shadow-[0_20px_50px_rgba(20,20,40,0.1)] backdrop-blur"
                >
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={imageUrl}
                      alt={item.upload.file_name || 'Peça do vestuário'}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 20vw"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className="rounded-full border border-white/40 bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
                        {categoryLabel}
                      </span>
                    </div>
                    <div className="absolute inset-x-4 bottom-4 flex items-center justify-between text-white">
                      <div>
                        <p className="text-sm font-semibold">
                          {item.upload.file_name || 'Peça sem título'}
                        </p>
                        <p className="text-xs text-white/70">
                          {createdDate ? createdDate.toLocaleDateString('pt-BR') : 'Data indefinida'}
                        </p>
                      </div>
                      <div className="relative" data-item-menu-panel-wrapper>
                        <button
                          className="rounded-full border border-white/40 bg-white/20 p-2 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/30"
                          aria-label="Ações da peça"
                          data-item-menu-trigger
                          onClick={(event) => handleItemMenuToggle(event, item.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openItemMenu === item.id && (
                          <div
                            className="absolute right-0 bottom-12 z-10 w-40 rounded-2xl border border-white/60 bg-white/95 p-1 shadow-lg backdrop-blur"
                            data-item-menu-panel
                          >
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEditItem(item.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteItem(item.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {(hasNextPage || pagination?.hasMore) && !selectedCategory && !activeCollectionId && (
            <div className="flex justify-center pt-8">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-[#111827] shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    Carregar mais
                    <span className="text-gray-400">
                      ({items.length} de {pagination?.total || items.length})
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
          </>
        ) : (
          <div className="rounded-[30px] border border-dashed border-gray-200 bg-white/70 p-16 text-center shadow-inner">
            <p className="text-base font-semibold text-gray-600">
              {selectedCategory ? 'Nenhuma peça nesta categoria' : 'Nenhuma peça salva ainda'}
            </p>
            <p className="text-sm text-gray-400">
              {selectedCategory
                ? 'Adicione peças nesta categoria para começar'
                : 'Os uploads aparecerão aqui automaticamente'}
            </p>
          </div>
        )}
      </section>

      <CreateCollectionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          invalidateWardrobe();
          router.refresh();
        }}
      />
      <AddWardrobeItemDialog
        open={isAddPieceDialogOpen}
        onOpenChange={handleAddPieceDialogChange}
        collections={collections as any}
        defaultCollectionId={preselectedCollectionId}
        onSuccess={() => {
          invalidateWardrobe();
          router.refresh();
        }}
        onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
      />

      {renameModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur">
            <div className="space-y-1">
              <h3 className="font-freight font-medium text-xl text-[#111827]">Renomear coleção</h3>
              <p className="text-sm text-gray-500">
                Escolha um nome que ajude a identificar esta coleção no seu vestuário.
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nome da coleção
              </label>
              <input
                value={renameModal.name}
                onChange={(event) =>
                  setRenameModal((prev) => ({ ...prev, name: event.target.value }))
                }
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-[#111827] focus:border-[#20202a] focus:ring-[#20202a]"
                placeholder="Ex: Coleção Outono Loja Centro"
              />
            </div>
            {modalError && (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {modalError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRenameModal({ open: false, collectionId: null, name: '' });
                  setModalError(null);
                }}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600"
                disabled={isActionLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleRenameCollection}
                className="rounded-2xl bg-[#20202a] px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur">
            <div className="space-y-1">
              <h3 className="font-freight font-medium text-xl text-[#111827]">Excluir coleção</h3>
              <p className="text-sm text-gray-500">
                Tem certeza que deseja excluir a coleção{' '}
                <span className="font-semibold text-[#7a5e2a]">{deleteModal.name}</span>? As peças
                continuarão no vestuário, apenas sem associação.
              </p>
            </div>
            {modalError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {modalError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModal({ open: false, collectionId: null, name: '' });
                  setModalError(null);
                }}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600"
                disabled={isActionLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCollection}
                className="rounded-2xl bg-gradient-to-r from-[#b9372b] to-[#d85d4d] px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Removendo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <EditWardrobeItemDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setItemToEdit(null);
        }}
        item={itemToEdit}
        collections={collections as any}
        onSuccess={() => {
          invalidateWardrobe();
          router.refresh();
        }}
      />

      {deleteItemModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur">
            <div className="space-y-1">
              <h3 className="font-freight font-medium text-xl text-[#111827]">Excluir peça</h3>
              <p className="text-sm text-gray-500">
                Tem certeza que deseja excluir{' '}
                <span className="font-semibold text-[#7a5e2a]">{deleteItemModal.itemName}</span>? Esta ação não pode ser desfeita.
              </p>
            </div>
            {deleteItemError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {deleteItemError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteItemModal({ open: false, itemId: null, itemName: '' });
                  setDeleteItemError(null);
                }}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600"
                disabled={isDeletingItem}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteItem}
                className="rounded-2xl bg-gradient-to-r from-[#b9372b] to-[#d85d4d] px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
                disabled={isDeletingItem}
              >
                {isDeletingItem ? 'Removendo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />
    </div>
  );
}

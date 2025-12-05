'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Portal } from '@/components/ui/portal';
import {
  X,
  Shirt,
  Check,
  Search,
  Loader2,
  FolderOpen,
  Star,
  Clock,
} from 'lucide-react';

// Types for wardrobe items
interface WardrobeItem {
  id: string;
  upload_id: string;
  collection_id?: string | null;
  category_slug?: string;
  garment_type?: string;
  piece_type?: string;
  tags?: string[];
  is_favorite: boolean;
  wear_count: number;
  created_at: string;
  user_uploads: {
    id: string;
    file_path: string;
    file_name: string;
    thumbnail_path?: string;
  };
}

interface WardrobeCollection {
  id: string;
  name: string;
  icon_color: string;
  item_count: number;
}

export interface SelectedGarment {
  id: string;
  uploadId: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category?: string;
  garmentType?: string;
}

interface WardrobeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGarments: (garments: SelectedGarment[]) => void;
  selectedIds?: string[];
  multiSelect?: boolean;
  maxSelection?: number;
}

type TabType = 'all' | 'recent';

export const WardrobeSelectorModal: React.FC<WardrobeSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectGarments,
  selectedIds = [],
  multiSelect = true,
  maxSelection = 2,
}) => {
  const [activeTab, setActiveTab] = React.useState<TabType>('all');
  const [items, setItems] = React.useState<WardrobeItem[]>([]);
  const [collections, setCollections] = React.useState<WardrobeCollection[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedItemIds, setSelectedItemIds] = React.useState<Set<string>>(
    new Set(selectedIds)
  );
  const [selectedCollection, setSelectedCollection] = React.useState<string | null>(null);

  // Fetch wardrobe items
  React.useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      // Fetch wardrobe items with upload info
      const { data: wardrobeItems, error: itemsError } = await supabase
        .from('wardrobe_items')
        .select(`
          *,
          user_uploads (
            id,
            file_path,
            file_name,
            thumbnail_path
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (itemsError) {
        console.error('Error fetching wardrobe items:', itemsError);
      }

      if (wardrobeItems) {
        // Filter out items where user_uploads is null (broken foreign key)
        const validItems = wardrobeItems.filter((item: any) => item.user_uploads !== null);
        setItems(validItems as WardrobeItem[]);
      }

      // Fetch collections
      const { data: cols } = await supabase
        .from('wardrobe_collections')
        .select('*')
        .eq('is_deleted', false)
        .order('name');

      if (cols) {
        setCollections(cols);
      }
    } catch (error) {
      console.error('Error fetching wardrobe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStorageUrl = (path: string) => {
    // Se já é uma URL completa (ex: imagens migradas do Bubble), retorna diretamente
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Caso contrário, busca do storage do Supabase
    const supabase = createClient();
    const { data } = supabase.storage.from('user-uploads').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleToggleItem = (item: WardrobeItem) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(item.id)) {
        newSet.delete(item.id);
      } else {
        if (!multiSelect) {
          newSet.clear();
        }
        if (newSet.size < maxSelection) {
          newSet.add(item.id);
        }
      }

      return newSet;
    });
  };

  const handleConfirm = () => {
    const selectedItems = items.filter((item) => selectedItemIds.has(item.id));
    const garments: SelectedGarment[] = selectedItems.map((item) => ({
      id: item.id,
      uploadId: item.upload_id,
      name: item.user_uploads.file_name,
      imageUrl: getStorageUrl(item.user_uploads.file_path),
      thumbnailUrl: item.user_uploads.thumbnail_path
        ? getStorageUrl(item.user_uploads.thumbnail_path)
        : undefined,
      category: item.category_slug,
      garmentType: item.garment_type,
    }));

    onSelectGarments(garments);
    onClose();
  };

  // Filter items
  const filteredItems = React.useMemo(() => {
    let filtered = items;

    // Tab filter
    if (activeTab === 'recent') {
      filtered = filtered.slice(0, 10);
    }

    // Collection filter
    if (selectedCollection) {
      filtered = filtered.filter((item) => item.collection_id === selectedCollection);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.user_uploads.file_name.toLowerCase().includes(query) ||
          item.category_slug?.toLowerCase().includes(query) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [items, activeTab, selectedCollection, searchQuery]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#20202a]/5 to-[#20202a]/10">
              <Shirt className="h-5 w-5 text-[#20202a]" />
            </div>
            <div>
              <h2 className="font-inter text-lg font-semibold text-gray-900">
                Meu Guarda-Roupa
              </h2>
              <p className="font-inter text-xs text-gray-500">
                Selecione até {maxSelection} peças
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="border-b border-gray-100 px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar peças..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 font-inter text-sm outline-none focus:border-[#20202a]"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-inter text-xs font-medium transition-colors',
                  activeTab === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Todas
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-inter text-xs font-medium transition-colors',
                  activeTab === 'recent'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                Recentes
              </button>
            </div>
          </div>

          {/* Collections */}
          {collections.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCollection(null)}
                className={cn(
                  'flex-shrink-0 rounded-full px-3 py-1 font-inter text-xs font-medium transition-colors',
                  !selectedCollection
                    ? 'bg-[#20202a] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Todas
              </button>
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setSelectedCollection(col.id)}
                  className={cn(
                    'flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-inter text-xs font-medium transition-colors',
                    selectedCollection === col.id
                      ? 'bg-[#20202a] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: col.icon_color }}
                  />
                  {col.name}
                  <span className="text-gray-400">({col.item_count})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <Shirt className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-inter text-sm font-medium text-gray-900">
                Nenhuma peça encontrada
              </p>
              <p className="mt-1 font-inter text-xs text-gray-500">
                Faça upload de peças pelo botão &ldquo;Subir Peça&rdquo;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {filteredItems.map((item) => {
                const isSelected = selectedItemIds.has(item.id);
                const imageUrl = getStorageUrl(
                  item.user_uploads.thumbnail_path || item.user_uploads.file_path
                );

                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleItem(item)}
                    className={cn(
                      'group relative aspect-square overflow-hidden rounded-xl border-2 transition-all',
                      isSelected
                        ? 'border-[#20202a] ring-2 ring-[#20202a]/20'
                        : 'border-transparent hover:border-gray-200'
                    )}
                  >
                    <Image
                      src={imageUrl}
                      alt={item.user_uploads.file_name}
                      fill
                      className="object-cover"
                    />

                    {/* Favorite badge */}
                    {item.is_favorite && (
                      <div className="absolute left-1.5 top-1.5">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                    )}

                    {/* Selection indicator */}
                    <div
                      className={cn(
                        'absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                        isSelected
                          ? 'border-[#20202a] bg-[#20202a]'
                          : 'border-white/80 bg-white/50 opacity-0 group-hover:opacity-100'
                      )}
                    >
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </div>

                    {/* Overlay on hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate font-inter text-xs text-white">
                        {item.user_uploads.file_name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <p className="font-inter text-sm text-gray-500">
            {selectedItemIds.size} de {maxSelection} peça{selectedItemIds.size !== 1 ? 's' : ''} selecionada{selectedItemIds.size !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 font-inter text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedItemIds.size === 0}
              className={cn(
                'rounded-xl px-4 py-2 font-inter text-sm font-medium transition-colors',
                selectedItemIds.size > 0
                  ? 'bg-[#20202a] text-white hover:bg-[#20202a]/90'
                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
              )}
            >
              Confirmar ({selectedItemIds.size})
            </button>
          </div>
        </div>
        </div>
      </div>
    </Portal>
  );
};

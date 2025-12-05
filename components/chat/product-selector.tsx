'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Plus, Upload, Check, Clock, Sparkles, MoreVertical, Trash2 } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  status: 'pending' | 'processing' | 'done';
  category?: string;
  createdAt: string;
}

interface ProductSelectorProps {
  products: Product[];
  selectedProductId?: string;
  onSelectProduct: (product: Product) => void;
  onUploadProduct: (file: File) => void;
  onDeleteProduct?: (productId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  selectedProductId,
  onSelectProduct,
  onUploadProduct,
  onDeleteProduct,
  isOpen,
  onToggle,
  className,
}) => {
  const [dragOver, setDragOver] = React.useState(false);
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onUploadProduct(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadProduct(file);
    }
    e.target.value = '';
  };

  const getStatusIcon = (status: Product['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-amber-500" />;
      case 'processing':
        return <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />;
      case 'done':
        return <Check className="h-3 w-3 text-green-500" />;
    }
  };

  const getStatusLabel = (status: Product['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'done':
        return 'Concluído';
    }
  };

  return (
    <>
      {/* Toggle Button (mobile) */}
      <button
        onClick={onToggle}
        className="fixed left-4 top-20 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-lg md:hidden"
      >
        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          'flex w-72 flex-col border-r border-gray-100 bg-white transition-transform duration-300',
          'fixed inset-y-16 left-0 z-40 md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div>
            <h2 className="font-inter text-base font-semibold text-gray-900">Seus Produtos</h2>
            <p className="font-inter text-xs text-gray-500">{products.length} itens</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="p-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all',
              dragOver
                ? 'border-[#20202a] bg-[#20202a]/5'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
            )}
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
              <Upload className="h-5 w-5 text-gray-600" />
            </div>
            <p className="font-inter text-sm font-medium text-gray-700">Upload de produto</p>
            <p className="font-inter text-xs text-gray-500">Arraste ou clique</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-3">
          {products.length > 0 ? (
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className={cn(
                    'group relative flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-all',
                    selectedProductId === product.id
                      ? 'bg-[#20202a]/5 ring-1 ring-[#20202a]/20'
                      : 'hover:bg-gray-50'
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {selectedProductId === product.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#20202a]/30">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-inter text-sm font-medium text-gray-900">
                      {product.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {getStatusIcon(product.status)}
                      <span className="font-inter text-xs text-gray-500">
                        {getStatusLabel(product.status)}
                      </span>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === product.id ? null : product.id);
                      }}
                      className="rounded-lg p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>

                    {menuOpenId === product.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpenId(null)}
                        />
                        <div className="absolute right-0 top-8 z-20 w-32 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProduct?.(product.id);
                              setMenuOpenId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 font-inter text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <Plus className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-inter text-sm font-medium text-gray-900">
                Nenhum produto
              </p>
              <p className="mt-1 font-inter text-xs text-gray-500">
                Faça upload do primeiro produto
              </p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="border-t border-white/60 bg-white/85 p-4 backdrop-blur">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[{ key: 'pending', label: 'Pendentes' }, { key: 'processing', label: 'Processando' }, { key: 'done', label: 'Prontos' }].map((status) => (
              <div
                key={status.key}
                className="flex min-h-[74px] flex-col items-center justify-center rounded-xl border border-[#e6e0d3] bg-[#f7f2e7] p-3 text-center shadow-[0_8px_18px_rgba(0,0,0,0.04)]"
              >
                <p className="font-inter text-lg font-semibold leading-tight text-[#b65c00]">
                  {products.filter((p) => p.status === status.key).length}
                </p>
                <p className="font-inter text-[11px] font-semibold leading-tight text-[#2c261d]">{status.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay (mobile) */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
};

'use client';

import * as React from 'react';
import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Collection colors matching Figma design
const COLLECTION_COLORS = [
  { id: 'orange', hex: '#FF7A00', label: 'Laranja' },
  { id: 'blue', hex: '#3B82F6', label: 'Azul' },
  { id: 'green', hex: '#22C55E', label: 'Verde' },
  { id: 'purple', hex: '#A855F7', label: 'Roxo' },
  { id: 'red', hex: '#EF4444', label: 'Vermelho' },
  { id: 'pink', hex: '#EC4899', label: 'Rosa' },
] as const;

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCollectionDialogProps) {
  const [collectionName, setCollectionName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[0].hex);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!collectionName.trim()) {
      return;
    }

    setIsCreating(true);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Create collection
      const { error } = await supabase.from('wardrobe_collections').insert({
        user_id: user.id,
        name: collectionName,
        icon_color: selectedColor,
      });

      if (error) {
        throw error;
      }

      // Success - reset and close
      setCollectionName('');
      setSelectedColor(COLLECTION_COLORS[0].hex);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Erro ao criar coleção. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setCollectionName('');
    setSelectedColor(COLLECTION_COLORS[0].hex);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
      {/* Modal Card */}
      <div className="relative w-[574px] rounded-2xl bg-white px-20 pb-[34px] pt-10">
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute right-[15px] top-[15px] flex h-[50px] w-[50px] items-center justify-center rounded-[13px] bg-[#f4f4f4] transition-colors hover:bg-gray-300"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-[15px] flex justify-center">
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[46px] bg-gray-900">
            <Plus className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-[15px] text-center font-freight text-2xl font-medium leading-normal text-black">
          Criar nova coleção
        </h2>

        {/* Collection Name Input */}
        <div className="mb-[15px] flex flex-col gap-1.5">
          <label className="font-manrope text-sm font-medium leading-[1.65] tracking-[0.2px] text-gray-600">
            Nome da coleção
          </label>
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            placeholder="Coleção 1"
            className="h-[45px] w-full rounded-lg border border-gray-200 px-3 py-[11px] font-manrope text-sm font-medium leading-[1.65] tracking-[0.2px] text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        {/* Color Selection */}
        <div className="mb-[29px] flex flex-col gap-1.5">
          <label className="font-manrope text-sm font-medium leading-[1.65] tracking-[0.2px] text-gray-600">
            Cor da coleção
          </label>
          <div className="flex h-[42px] items-center justify-between">
            {COLLECTION_COLORS.map((color) => {
              const isSelected = selectedColor === color.hex;

              return (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.hex)}
                  className="relative flex flex-col items-start"
                  aria-label={`Selecionar cor ${color.label}`}
                >
                  <div
                    className="h-8 w-8 rounded-full border-2 border-white transition-transform hover:scale-110"
                    style={{ backgroundColor: color.hex }}
                  />
                  {isSelected && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-500">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={!collectionName.trim() || isCreating}
          className="mb-2 flex h-11 w-full items-center justify-center rounded-xl bg-gray-900 px-8 pb-[12.5px] pt-[11.5px] font-inter text-sm font-medium leading-5 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isCreating ? 'Criando...' : 'Criar coleção'}
        </button>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          disabled={isCreating}
          className="flex h-11 w-full items-center justify-center rounded-xl border border-gray-900 bg-white px-8 pb-[12.5px] pt-[11.5px] font-inter text-sm font-medium leading-5 text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

import type { UploadResult } from '@/lib/storage/upload';

/**
 * Tipo de conjunto de peças
 * - single: Peça única (pode ser de cima ou de baixo)
 * - outfit: Conjunto com múltiplas peças
 */
export type GarmentType = 'single' | 'outfit';

/**
 * Tipo de peça individual
 * - upper: Peça de cima (blusa, camisa, vestido, etc.)
 * - lower: Peça de baixo (calça, short, saia, etc.)
 */
export type PieceType = 'upper' | 'lower';

/**
 * Metadados do arquivo (usados quando File object não está disponível)
 */
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

/**
 * Representa um upload de peça de roupa
 */
export interface GarmentUpload {
  /** ID único do upload */
  id: string;
  /** Arquivo da imagem (pode ser null quando restaurado do localStorage) */
  file: File | null;
  /** URL de preview (blob URL ou public URL do Supabase) */
  previewUrl: string;
  /** Tipo da peça (cima ou baixo) */
  pieceType: PieceType;
  /** Resultado do upload para o Supabase Storage */
  uploadResult?: UploadResult;
  /** Metadados do arquivo (usado quando file é null) */
  fileMetadata?: FileMetadata;
  /** ID de um upload existente (quando vindo do vestuário) */
  existingUploadId?: string;
  /** Informações sobre a origem da peça */
  source?: {
    type: 'new' | 'wardrobe';
    wardrobeItemId?: string;
  };
}

/**
 * Descrições para cada tipo de conjunto
 */
export const garmentDescriptions: Record<GarmentType, string> = {
  single: 'Faça upload de uma única peça de roupa (pode ser de cima ou de baixo)',
  outfit: 'Monte um conjunto completo com peças de cima e/ou de baixo',
};

/**
 * Descrições para cada tipo de peça
 */
export const pieceTypeDescriptions: Record<PieceType, string> = {
  upper: 'Peças de cima: blusas, camisas, vestidos, blazers, casacos, moletons, etc.',
  lower: 'Peças de baixo: calças, shorts, saias, bermudas, leggings, etc.',
};

/**
 * Labels para exibição dos tipos de peça
 */
export const pieceTypeLabels: Record<PieceType, string> = {
  upper: 'Peça de cima',
  lower: 'Peça de baixo',
};

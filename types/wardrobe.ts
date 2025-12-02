import type { PieceType } from '@/lib/generation-flow/upload-types';

export interface WardrobeCollectionSummary {
  id: string;
  name: string;
  iconColor: string | null;
  itemCount: number;
}

export interface WardrobePickerItem {
  id: string;
  uploadId: string;
  collectionId: string | null;
  collectionName?: string | null;
  pieceType: PieceType | 'full' | null;
  garmentType: string | null;
  categorySlug: string | null;
  createdAt: string | null;
  storagePath: string;
  publicUrl: string;
  previewUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface WardrobePickerData {
  collections: WardrobeCollectionSummary[];
  items: WardrobePickerItem[];
}

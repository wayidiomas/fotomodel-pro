'use client';

import * as React from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface OriginalGarmentsDisplayProps {
  uploadIds: string[];
}

interface GarmentImage {
  id: string;
  imageUrl: string;
  pieceType: 'upper' | 'lower' | 'single';
}

export const OriginalGarmentsDisplay: React.FC<OriginalGarmentsDisplayProps> = ({ uploadIds }) => {
  const [garments, setGarments] = React.useState<GarmentImage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchGarments = async () => {
      if (!uploadIds || uploadIds.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // Fetch upload records
        const { data, error } = await (supabase
          .from('user_uploads') as any)
          .select('id, metadata')
          .in('id', uploadIds)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching garment images:', error);
          setIsLoading(false);
          return;
        }

        if (data) {
          const garmentImages: GarmentImage[] = data.map((upload: any) => ({
            id: upload.id,
            imageUrl: upload.metadata?.publicUrl || '',
            pieceType: upload.metadata?.pieceType || 'single',
          })).filter((g: GarmentImage) => g.imageUrl); // Only include garments with valid URLs

          setGarments(garmentImages);
        }
      } catch (error) {
        console.error('Error fetching garments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGarments();
  }, [uploadIds]);

  // Show 2 slots regardless of how many garments we have
  const slots = [0, 1];

  return (
    <div className="flex flex-col gap-3">
      {/* Section title */}
      <h3 className="font-inter font-semibold text-sm text-[#111827]">Suas Peças</h3>

      {/* Vertical layout - one image below the other */}
      <div className="flex flex-col gap-3">
        {slots.map((index) => {
          const garment = garments[index];

          return (
            <div
              key={index}
              className="relative w-full aspect-square bg-[#edf0f3] rounded-lg overflow-hidden"
            >
              {garment && garment.imageUrl ? (
                <>
                  <Image
                    src={garment.imageUrl}
                    alt={`Peça ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="280px"
                  />
                  {/* Badge com tipo de peça */}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md">
                    <span className="font-inter font-semibold text-xs text-white text-center block">
                      {garment.pieceType === 'upper' ? 'Peça de Cima' : garment.pieceType === 'lower' ? 'Peça de Baixo' : 'Peça Única'}
                    </span>
                  </div>
                </>
              ) : (
                /* Empty slot */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-gray-400"
                  >
                    <path
                      d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M16 8L12 4M12 4L8 8M12 4V16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="font-inter text-xs text-gray-500">Sem peça {index + 1}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

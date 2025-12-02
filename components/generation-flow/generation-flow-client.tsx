'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { TabSwitcher } from './tab-switcher';
import { UploadArea } from './upload-area';
import { TipsCard } from './tips-card';
import { ProfessionalTipsCard } from './professional-tips-card';
import { ChatButton } from '@/components/shared/chat-button';
import { ProgressSteps } from './progress-steps';
import type { CategoryConfig } from '@/lib/generation-flow/category-config';
import type { CategoryTip } from '@/lib/generation-flow/types';
import type { GarmentType, PieceType, GarmentUpload } from '@/lib/generation-flow/upload-types';
import { createClient } from '@/lib/supabase/client';
import { validateFile, uploadUserImage } from '@/lib/storage/upload';
import { saveUploads } from '@/lib/generation-flow/save-uploads';
import { WardrobePickerModal } from './wardrobe-picker-modal';
import type { WardrobeCollectionSummary, WardrobePickerItem } from '@/types/wardrobe';

interface GenerationFlowClientProps {
  categoryConfig: CategoryConfig;
  categoryTip: CategoryTip | null;
  wardrobeCollections?: WardrobeCollectionSummary[];
  wardrobeItems?: WardrobePickerItem[];
}

export const GenerationFlowClient: React.FC<GenerationFlowClientProps> = ({
  categoryConfig,
  categoryTip,
  wardrobeCollections = [],
  wardrobeItems = [],
}) => {
  const router = useRouter();

  // State management
  const [activeTab, setActiveTab] = React.useState<GarmentType>('single');
  const [uploads, setUploads] = React.useState<GarmentUpload[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(true);
  const [wardrobeModal, setWardrobeModal] = React.useState<{
    open: boolean;
    pieceType: PieceType | null;
    garmentType: GarmentType;
  }>({
    open: false,
    pieceType: null,
    garmentType: 'single',
  });
  const hasWardrobeItems = wardrobeItems.length > 0;

  // Storage key for persisting uploads
  const STORAGE_KEY = `generation-flow-uploads-${categoryConfig.slug}`;

  // Restore uploads from localStorage on mount
  React.useEffect(() => {
    const restoreUploads = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);

          // Restore garmentType
          if (parsed.garmentType) {
            setActiveTab(parsed.garmentType);
          }

          // Restore uploads (use publicUrl as previewUrl since we can't restore File objects)
          if (parsed.uploads && Array.isArray(parsed.uploads)) {
            const restoredUploads: GarmentUpload[] = parsed.uploads.map((u: any) => ({
              id: u.id,
              file: null, // Can't restore File object
              previewUrl: u.uploadResult?.publicUrl || '',
              pieceType: u.pieceType,
              uploadResult: u.uploadResult,
              fileMetadata: u.fileMetadata,
            }));
            setUploads(restoredUploads);
          }
        }
      } catch (error) {
        console.error('Error restoring uploads:', error);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreUploads();
  }, [STORAGE_KEY]);

  // Save uploads to localStorage whenever they change
  React.useEffect(() => {
    if (isRestoring) return; // Don't save while restoring

    try {
      const dataToStore = {
        garmentType: activeTab,
        uploads: uploads.map(u => ({
          id: u.id,
          pieceType: u.pieceType,
          uploadResult: u.uploadResult,
          fileMetadata: u.fileMetadata,
        })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error saving uploads:', error);
    }
  }, [uploads, activeTab, isRestoring, STORAGE_KEY]);

  // Cleanup preview URLs on unmount
  React.useEffect(() => {
    return () => {
      uploads.forEach(upload => {
        if (upload.previewUrl && upload.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(upload.previewUrl);
        }
      });
    };
  }, [uploads]);

  // Clear uploads when changing tabs (but not on initial restore)
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    // Skip clearing on initial mount (restoration)
    if (isInitialMount.current || isRestoring) {
      isInitialMount.current = false;
      return;
    }

    // Cleanup old previews
    uploads.forEach(upload => {
      if (upload.previewUrl && upload.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(upload.previewUrl);
      }
    });
    // Clear uploads
    setUploads([]);
    setUploadError(null);
  }, [activeTab]); // Only run when activeTab changes


  // Handlers
  const ensurePieceSlotAvailable = React.useCallback(
    (pieceType: PieceType) => {
      if (activeTab === 'single') {
        if (uploads.length >= 1) {
          setUploadError('Limite de 1 peça atingido');
          return false;
        }
        return true;
      }

      if (uploads.some(u => u.pieceType === pieceType)) {
        const typeName = pieceType === 'upper' ? 'peça de cima' : 'peça de baixo';
        setUploadError(`Você já adicionou uma ${typeName}. Remova-a para adicionar outra.`);
        return false;
      }

      if (uploads.length >= 2) {
        setUploadError('Limite de 2 peças atingido (1 de cima + 1 de baixo)');
        return false;
      }

      return true;
    },
    [activeTab, uploads]
  );

  const handleUpload = async (file: File, pieceType: PieceType) => {
    setIsUploading(true);
    setUploadError(null);

    // 1. Check limits
    if (!ensurePieceSlotAvailable(pieceType)) {
      setIsUploading(false);
      return;
    }

    // 2. Validate file
    const validation = validateFile(file, {
      maxSizeInMB: 20,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (!validation.valid) {
      setUploadError(validation.error || 'Arquivo inválido');
      setIsUploading(false);
      return;
    }

    // 3. Create preview and add to uploads
    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);

    const newUpload: GarmentUpload = {
      id,
      file,
      previewUrl,
      pieceType,
      fileMetadata: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    };

    setUploads(prev => [...prev, newUpload]);

    // 4. Get userId
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      setUploadError('Usuário não autenticado. Faça login para continuar.');
      setIsUploading(false);
      // Remove from uploads if auth failed
      setUploads(prev => prev.filter(u => u.id !== id));
      URL.revokeObjectURL(previewUrl);
      return;
    }

    // 5. Upload to Supabase
    const result = await uploadUserImage(supabase, user.id, file, file.name);

    // 6. Update upload with result
    setUploads(prev => prev.map(u =>
      u.id === id ? { ...u, uploadResult: result } : u
    ));

    if (!result.success) {
      setUploadError(result.error || 'Erro ao fazer upload. Tente novamente.');
    }

    setIsUploading(false);
  };

  const handleRemoveUpload = (id: string) => {
    const upload = uploads.find(u => u.id === id);
    if (upload?.previewUrl && upload.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(upload.previewUrl);
    }
    setUploads(prev => {
      const newUploads = prev.filter(u => u.id !== id);
      // Clear localStorage if no uploads left
      if (newUploads.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      }
      return newUploads;
    });
    setUploadError(null);
  };

  const handleChooseFromWardrobe = (pieceType: PieceType, garmentType: GarmentType) => {
    if (!hasWardrobeItems) {
      setUploadError('Adicione peças ao vestuário para poder selecioná-las aqui.');
      return;
    }

    setUploadError(null);
    setWardrobeModal({
      open: true,
      pieceType,
      garmentType,
    });
  };

  const handleSelectWardrobeItem = (item: WardrobePickerItem) => {
    if (!wardrobeModal.pieceType) {
      return;
    }

    if (!ensurePieceSlotAvailable(wardrobeModal.pieceType)) {
      return;
    }

    if (!item.storagePath || !item.publicUrl) {
      setUploadError('Esta peça não possui arquivo associado.');
      return;
    }

    const newUpload: GarmentUpload = {
      id: `wardrobe-${item.uploadId}-${Date.now()}`,
      file: null,
      previewUrl: item.previewUrl || item.publicUrl,
      pieceType: wardrobeModal.pieceType,
      uploadResult: {
        success: true,
        path: item.storagePath,
        publicUrl: item.publicUrl,
      },
      fileMetadata: {
        name: item.fileName,
        size: item.fileSize,
        type: item.mimeType,
      },
      existingUploadId: item.uploadId,
      source: {
        type: 'wardrobe',
        wardrobeItemId: item.id,
      },
    };

    setUploads(prev => [...prev, newUpload]);
    setUploadError(null);
    setWardrobeModal({
      open: false,
      pieceType: null,
      garmentType: activeTab,
    });
  };

  const handleNext = async () => {
    if (!canProceed || isSaving) return;

    setIsSaving(true);
    setUploadError(null);

    try {
      // Get user
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        setUploadError('Usuário não autenticado. Faça login para continuar.');
        setIsSaving(false);
        return;
      }

      // Save uploads to database
      const result = await saveUploads(supabase as any, {
        userId: user.id,
        garmentType: activeTab,
        uploads,
      });

      if (!result.success) {
        setUploadError(result.error || 'Erro ao salvar uploads. Tente novamente.');
        setIsSaving(false);
        return;
      }

      // Navigate to step 2 (Categorização)
      console.log('✅ Uploads saved successfully:', {
        uploadIds: result.uploadIds,
        savedUploads: result.savedUploads,
      });

      // Clear localStorage after successful save
      localStorage.removeItem(STORAGE_KEY);

      const savedUploadsMeta = result.savedUploads || [];
      const totalIds = result.uploadIds || [];
      const newUploadIds = savedUploadsMeta.filter(saved => !saved.existing).map(saved => saved.id);
      const allIdsParam = totalIds.join(',');

      if (newUploadIds.length === 0) {
        const posesParams = new URLSearchParams();
        if (allIdsParam) {
          posesParams.set('ids', allIdsParam);
        }
        posesParams.set('category', categoryConfig.slug);
        const nextUrl = posesParams.toString()
          ? `/criar/poses?${posesParams.toString()}`
          : '/criar/poses';
        router.push(nextUrl);
        return;
      }

      const pendingIdsParam = newUploadIds.join(',');
      const searchParams = new URLSearchParams();
      if (pendingIdsParam) {
        searchParams.set('ids', pendingIdsParam);
      }
      if (allIdsParam) {
        searchParams.set('all', allIdsParam);
      }
      searchParams.set('category', categoryConfig.slug);
      router.push(`/criar/categorizar?${searchParams.toString()}`);
    } catch (error) {
      console.error('Error in handleNext:', error);
      setUploadError('Erro inesperado. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChatClick = () => {
    // TODO: Implement chat functionality
    console.log('Chat clicked');
  };

  // Can proceed if:
  // - single: has exactly 1 successful upload
  // - outfit: has at least 1 successful upload
  const canProceed = activeTab === 'single'
    ? uploads.length === 1 && uploads[0].uploadResult?.success === true
    : uploads.length >= 1 && uploads.every(u => u.uploadResult?.success === true);

  return (
    <>
      {/* Progress Steps */}
      <ProgressSteps
        currentStep={1}
        canProceed={canProceed}
        isLoading={isSaving}
        onNext={handleNext}
      />

      {/* Main Content */}
      <main className="px-10 py-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:gap-10">
          {/* Main Card */}
          <div className="flex-1 bg-white/90 backdrop-blur border border-white/60 shadow-lg rounded-[32px] p-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center rounded-2xl bg-[#f4f0e7] px-3 py-2 text-sm font-semibold text-[#4b3f2f] shadow-inner">
                    {categoryConfig.title}
                  </div>
                  <p className="font-inter text-sm text-[#6b7280]">
                    Envie a peça que vamos transformar nesta categoria.
                  </p>
                </div>

                {/* Tab Switcher */}
                <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
              </div>

              {/* Upload Area */}
              <UploadArea
                garmentType={activeTab}
                uploads={uploads}
                onUpload={handleUpload}
                onRemoveUpload={handleRemoveUpload}
                onChooseFromWardrobe={handleChooseFromWardrobe}
                isUploading={isUploading}
                uploadError={uploadError}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full xl:w-[360px] flex flex-col gap-6">
            {categoryTip && <TipsCard tip={categoryTip} />}
            <ProfessionalTipsCard />
          </div>
        </div>
      </main>

      {/* Chat Button */}
      <ChatButton onClick={handleChatClick} />

      <WardrobePickerModal
        open={wardrobeModal.open}
        pieceType={wardrobeModal.pieceType}
        garmentType={wardrobeModal.garmentType}
        collections={wardrobeCollections}
        items={wardrobeItems}
        onClose={() =>
          setWardrobeModal({
            open: false,
            pieceType: null,
            garmentType: activeTab,
          })
        }
        onSelect={handleSelectWardrobeItem}
      />
    </>
  );
};

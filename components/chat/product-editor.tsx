'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ProductSelector, type Product } from './product-selector';
import { QuickActions, type QuickAction } from './quick-actions';
import { BeforeAfterPreview } from './before-after-preview';
import { BrandPresets, type BrandPreset } from './brand-presets';
import { MessageInput } from './message-input';
import { Send, Wand2, MessageCircle } from 'lucide-react';
import type { ChatAttachment } from './chat-interface';

interface ProductEditorProps {
  userId: string;
  userCredits: number;
  onSendMessage: (content: string, attachments: ChatAttachment[]) => Promise<boolean>;
  isLoading?: boolean;
  className?: string;
}

export const ProductEditor: React.FC<ProductEditorProps> = ({
  userId,
  userCredits,
  onSendMessage,
  isLoading = false,
  className,
}) => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [selectedPreset, setSelectedPreset] = React.useState<BrandPreset | null>(null);
  const [afterImages, setAfterImages] = React.useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [showChat, setShowChat] = React.useState(false);
  const [refinementMessage, setRefinementMessage] = React.useState('');

  // Handle product upload
  const handleUploadProduct = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const newProduct: Product = {
        id: `product-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        imageUrl: reader.result as string,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setProducts((prev) => [newProduct, ...prev]);
      setSelectedProduct(newProduct);
    };
    reader.readAsDataURL(file);
  };

  // Handle quick action selection
  const handleQuickAction = async (action: QuickAction) => {
    if (!selectedProduct) return;

    // Build the prompt with preset info
    let fullPrompt = action.prompt;
    if (selectedPreset) {
      const presetInfo = [];
      if (selectedPreset.modelGender !== 'any') {
        presetInfo.push(`modelo ${selectedPreset.modelGender === 'female' ? 'feminina' : 'masculino'}`);
      }
      if (selectedPreset.modelAge?.length) {
        presetInfo.push(`idades ${selectedPreset.modelAge.join(', ')} anos`);
      }
      if (selectedPreset.backgroundStyle !== 'any') {
        presetInfo.push(`fundo ${selectedPreset.backgroundStyle}`);
      }
      if (presetInfo.length > 0) {
        fullPrompt += ` Use: ${presetInfo.join(', ')}.`;
      }
    }

    // Create attachment from selected product
    const attachment: ChatAttachment = {
      type: 'garment',
      url: selectedProduct.imageUrl,
      base64Data: selectedProduct.imageUrl.split(',')[1],
      mimeType: 'image/png',
    };

    // Update product status
    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProduct.id ? { ...p, status: 'processing' as const } : p
      )
    );

    // Send the message
    const success = await onSendMessage(fullPrompt, [attachment]);

    if (success) {
      // Simulate result (in real app, this would come from the API response)
      // For now, we'll update the product status
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, status: 'done' as const } : p
        )
      );
    }
  };

  // Handle refinement chat
  const handleRefinement = async () => {
    if (!refinementMessage.trim()) return;

    await onSendMessage(refinementMessage, []);
    setRefinementMessage('');
  };

  // Handle download
  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `fotomodel-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className={cn('flex h-full overflow-hidden bg-[#f7f6f3]', className)}>
      {/* Product Sidebar */}
      <ProductSelector
        products={products}
        selectedProductId={selectedProduct?.id}
        onSelectProduct={setSelectedProduct}
        onUploadProduct={handleUploadProduct}
        onDeleteProduct={(id) => {
          setProducts((prev) => prev.filter((p) => p.id !== id));
          if (selectedProduct?.id === id) {
            setSelectedProduct(null);
          }
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Editor Area */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-tl-[22px] bg-white/90 backdrop-blur">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white/90 px-6 py-4">
          <div>
            <h1 className="font-inter text-lg font-semibold text-gray-900">
              Editor de Produto
            </h1>
            <p className="font-inter text-sm text-gray-500">
              {selectedProduct ? selectedProduct.name : 'Selecione ou faça upload de um produto'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-[#e6e0d3] bg-[#f7f2e7] px-3 py-1.5 text-[#2c261d]">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-inter text-sm font-medium text-gray-700">
                {userCredits} créditos
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 overflow-y-auto bg-[#f5f4f0] p-6">
            <div className="mx-auto max-w-4xl">
              <BeforeAfterPreview
                beforeImage={selectedProduct?.imageUrl}
                afterImages={afterImages}
                selectedIndex={selectedImageIndex}
                onSelectImage={setSelectedImageIndex}
                onDownload={handleDownload}
                onRefine={() => setShowChat(true)}
                onGenerateMore={() => handleQuickAction({
                  id: 'generate-more',
                  title: 'Gerar Mais',
                  description: 'Gerar mais variações',
                  icon: <Wand2 className="h-5 w-5" />,
                  prompt: 'Gere mais 4 variações semelhantes desta imagem.',
                  category: 'edit',
                  color: 'from-purple-100 to-pink-100',
                })}
                isLoading={isLoading}
              />

              {/* Refinement Chat (collapsible) */}
              {showChat && afterImages.length > 0 && (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-gray-500" />
                      <span className="font-inter text-sm font-medium text-gray-700">
                        Refinar imagem
                      </span>
                    </div>
                    <button
                      onClick={() => setShowChat(false)}
                      className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={refinementMessage}
                      onChange={(e) => setRefinementMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRefinement()}
                      placeholder="Ex: Deixe o fundo mais claro, mude a pose..."
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-inter text-sm outline-none focus:border-[#20202a] focus:bg-white"
                    />
                    <button
                      onClick={handleRefinement}
                      disabled={!refinementMessage.trim() || isLoading}
                      className="flex items-center justify-center rounded-xl bg-[#20202a] px-4 text-white transition-transform hover:scale-105 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 font-inter text-xs text-gray-500">
                    Refinamento: 1 crédito
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Actions & Presets */}
          <div className="w-96 flex-shrink-0 overflow-y-auto border-l border-gray-100 bg-white p-6">
            <div className="space-y-8">
              {/* Brand Presets */}
              <BrandPresets
                selectedPresetId={selectedPreset?.id}
                onSelectPreset={setSelectedPreset}
                onCreatePreset={(preset) => {
                  // In real app, save to database
                  console.log('Create preset:', preset);
                }}
              />

              {/* Quick Actions */}
              <QuickActions
                onSelectAction={handleQuickAction}
                hasAttachment={!!selectedProduct}
              />

              {/* Credits Info */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <h4 className="font-inter text-sm font-semibold text-gray-900">
                  Custos
                </h4>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-sm text-gray-600">Geração</span>
                    <span className="font-inter text-sm font-medium text-gray-900">2 créditos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-sm text-gray-600">Refinamento</span>
                    <span className="font-inter text-sm font-medium text-gray-900">1 crédito</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-sm text-gray-600">Variações (+4)</span>
                    <span className="font-inter text-sm font-medium text-gray-900">4 créditos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

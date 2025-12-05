'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Portal } from '@/components/ui/portal';
import {
  X,
  Wand2,
  Palette,
  ImageIcon,
  Upload,
  Sparkles,
  Sun,
  Contrast,
  Scissors,
  Wind,
  Eye,
  Brush,
} from 'lucide-react';

export type CustomActionType = 'edit' | 'style' | 'background';

interface CustomActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CustomActionResult) => void;
  type: CustomActionType;
}

export interface CustomActionResult {
  type: CustomActionType;
  prompt: string;
  imageBase64?: string;
  imageMimeType?: string;
}

// Quick suggestions for each type
const EDIT_SUGGESTIONS = [
  { icon: <Sparkles className="h-4 w-4" />, label: 'Nitidez', prompt: 'Aumente a nitidez e definição da imagem' },
  { icon: <Contrast className="h-4 w-4" />, label: 'Sombras', prompt: 'Ajuste as sombras para ficarem mais suaves e naturais' },
  { icon: <Wind className="h-4 w-4" />, label: 'Cabelo', prompt: 'Melhore o cabelo, deixando mais natural e volumoso' },
  { icon: <Eye className="h-4 w-4" />, label: 'Olhos', prompt: 'Realce os olhos, deixando mais expressivos' },
  { icon: <Brush className="h-4 w-4" />, label: 'Pele', prompt: 'Suavize a pele mantendo textura natural' },
  { icon: <Sun className="h-4 w-4" />, label: 'Iluminação', prompt: 'Melhore a iluminação geral da foto' },
];

const STYLE_SUGGESTIONS = [
  { icon: <Sun className="h-4 w-4" />, label: 'Verão', prompt: 'Aplique um estilo de verão com cores quentes e iluminação dourada' },
  { icon: <Palette className="h-4 w-4" />, label: 'Vintage', prompt: 'Aplique um estilo vintage com tons sépia e textura de filme' },
  { icon: <Sparkles className="h-4 w-4" />, label: 'Glamour', prompt: 'Aplique um estilo glamouroso com iluminação dramática' },
  { icon: <Contrast className="h-4 w-4" />, label: 'Minimalista', prompt: 'Aplique um estilo minimalista clean e moderno' },
];

const BACKGROUND_SUGGESTIONS = [
  { icon: <ImageIcon className="h-4 w-4" />, label: 'Praia', prompt: 'Coloque em uma praia tropical com céu azul' },
  { icon: <ImageIcon className="h-4 w-4" />, label: 'Cidade', prompt: 'Coloque em uma rua urbana moderna' },
  { icon: <ImageIcon className="h-4 w-4" />, label: 'Natureza', prompt: 'Coloque em um jardim florido' },
  { icon: <ImageIcon className="h-4 w-4" />, label: 'Estúdio', prompt: 'Coloque em um estúdio com fundo gradiente suave' },
];

const CONFIG: Record<CustomActionType, {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  placeholder: string;
  suggestions: typeof EDIT_SUGGESTIONS;
  allowImage: boolean;
}> = {
  edit: {
    title: 'Edição Livre',
    subtitle: 'Descreva as edições que deseja fazer na imagem',
    icon: <Wand2 className="h-5 w-5" />,
    placeholder: 'Ex: Aumente a nitidez, ajuste as sombras, melhore o cabelo...',
    suggestions: EDIT_SUGGESTIONS,
    allowImage: false,
  },
  style: {
    title: 'Estilo Personalizado',
    subtitle: 'Descreva o estilo visual que deseja aplicar',
    icon: <Palette className="h-5 w-5" />,
    placeholder: 'Ex: Estilo vintage com tons quentes, iluminação cinematográfica...',
    suggestions: STYLE_SUGGESTIONS,
    allowImage: false,
  },
  background: {
    title: 'Fundo Personalizado',
    subtitle: 'Descreva o fundo ou envie uma imagem',
    icon: <ImageIcon className="h-5 w-5" />,
    placeholder: 'Ex: Praia tropical ao pôr do sol, jardim com flores...',
    suggestions: BACKGROUND_SUGGESTIONS,
    allowImage: true,
  },
};

export const CustomActionModal: React.FC<CustomActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
}) => {
  const [prompt, setPrompt] = React.useState('');
  const [uploadedImage, setUploadedImage] = React.useState<{
    base64: string;
    mimeType: string;
    preview: string;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const config = CONFIG[type];

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setUploadedImage(null);
    }
  }, [isOpen]);

  const handleSuggestionClick = (suggestionPrompt: string) => {
    setPrompt((prev) => {
      if (prev.trim()) {
        return `${prev}. ${suggestionPrompt}`;
      }
      return suggestionPrompt;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];

      setUploadedImage({
        base64: base64Data,
        mimeType: file.type,
        preview: base64String,
      });
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
  };

  const handleConfirm = () => {
    if (!prompt.trim() && !uploadedImage) return;

    onConfirm({
      type,
      prompt: prompt.trim(),
      imageBase64: uploadedImage?.base64,
      imageMimeType: uploadedImage?.mimeType,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#20202a]/5 to-[#20202a]/10">
              {config.icon}
            </div>
            <div>
              <h2 className="font-inter text-lg font-semibold text-gray-900">
                {config.title}
              </h2>
              <p className="font-inter text-xs text-gray-500">
                {config.subtitle}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Image Upload (only for background) */}
          {config.allowImage && (
            <div className="space-y-2">
              <p className="font-inter text-xs font-medium text-gray-700">
                Enviar imagem de fundo (opcional)
              </p>

              {uploadedImage ? (
                <div className="relative">
                  <img
                    src={uploadedImage.preview}
                    alt="Background preview"
                    className="h-32 w-full rounded-xl object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-110"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 transition-colors hover:border-[#20202a] hover:bg-gray-100"
                >
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="font-inter text-sm text-gray-600">
                    Clique para enviar uma imagem
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {uploadedImage && (
                <p className="font-inter text-xs text-gray-500">
                  Você pode adicionar uma descrição abaixo para complementar
                </p>
              )}
            </div>
          )}

          {/* Quick Suggestions */}
          <div className="space-y-2">
            <p className="font-inter text-xs font-medium text-gray-700">
              Sugestões rápidas
            </p>
            <div className="flex flex-wrap gap-2">
              {config.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.prompt)}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 font-inter text-xs text-gray-700 transition-all hover:border-[#20202a] hover:bg-gray-50"
                >
                  {suggestion.icon}
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <p className="font-inter text-xs font-medium text-gray-700">
              {config.allowImage && uploadedImage ? 'Descrição adicional (opcional)' : 'Sua descrição'}
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={config.placeholder}
              rows={4}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white p-4 font-inter text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#20202a]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 font-inter text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!prompt.trim() && !uploadedImage}
            className={cn(
              'rounded-xl px-4 py-2 font-inter text-sm font-medium transition-colors',
              prompt.trim() || uploadedImage
                ? 'bg-[#20202a] text-white hover:bg-[#20202a]/90'
                : 'cursor-not-allowed bg-gray-100 text-gray-400'
            )}
          >
            Aplicar
          </button>
        </div>
        </div>
      </div>
    </Portal>
  );
};

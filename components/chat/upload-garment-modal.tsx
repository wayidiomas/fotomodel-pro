'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Upload, FolderOpen, X, ArrowLeft, Shirt } from 'lucide-react';
import { GarmentCategory, enumToOptions } from '@/lib/generation-flow/garment-metadata-types';
import { Portal } from '@/components/ui/portal';

export interface UploadedGarment {
  file: File;
  previewUrl: string;
  base64Data: string;
  mimeType: string;
  name: string;
  category: string;
  description: string;
}

interface UploadGarmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComputer: (garment: UploadedGarment) => void;
  onSelectWardrobe: () => void;
}

type Step = 'choice' | 'upload' | 'categorize';

export const UploadGarmentModal: React.FC<UploadGarmentModalProps> = ({
  isOpen,
  onClose,
  onSelectComputer,
  onSelectWardrobe,
}) => {
  const [step, setStep] = React.useState<Step>('choice');
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>('');
  const [base64Data, setBase64Data] = React.useState<string>('');
  const [pieceName, setPieceName] = React.useState('');
  const [category, setCategory] = React.useState<string>('');
  const [description, setDescription] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetState = React.useCallback(() => {
    setStep('choice');
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setBase64Data('');
    setPieceName('');
    setCategory('');
    setDescription('');
    setError(null);
    setDragOver(false);
  }, [previewUrl]);

  React.useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  const handleFileSelect = (selectedFile: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      setError('Formatos aceitos: JPG, PNG ou WEBP');
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('Limite de 20MB por imagem');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError(null);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setBase64Data(base64String.split(',')[1]);
    };
    reader.readAsDataURL(selectedFile);

    // Move to categorize step
    setStep('categorize');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      handleFileSelect(selectedFile);
    }
  };

  const handleConfirm = () => {
    if (!file || !base64Data) {
      setError('Selecione uma imagem');
      return;
    }
    if (!category) {
      setError('Selecione o tipo de peça');
      return;
    }
    if (!pieceName.trim()) {
      setError('Informe um nome para a peça');
      return;
    }

    onSelectComputer({
      file,
      previewUrl,
      base64Data,
      mimeType: file.type,
      name: pieceName.trim(),
      category,
      description: description.trim(),
    });

    onClose();
  };

  const handleWardrobeSelect = () => {
    onClose();
    onSelectWardrobe();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-[28px] border border-white/40 bg-white/95 shadow-[0_30px_100px_rgba(10,10,25,0.25)] backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            {step !== 'choice' && (
              <button
                onClick={() => setStep(step === 'categorize' ? 'upload' : 'choice')}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 className="font-inter text-lg font-semibold text-gray-900">
                {step === 'choice' && 'Adicionar Peça'}
                {step === 'upload' && 'Upload da Imagem'}
                {step === 'categorize' && 'Categorizar Peça'}
              </h2>
              <p className="font-inter text-xs text-gray-500">
                {step === 'choice' && 'Escolha de onde deseja adicionar'}
                {step === 'upload' && 'Arraste ou selecione a imagem'}
                {step === 'categorize' && 'Adicione informações da peça'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step: Choice */}
          {step === 'choice' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setStep('upload')}
                className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-6 text-center transition-all hover:border-[#20202a] hover:shadow-lg"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 transition-all group-hover:from-[#20202a] group-hover:to-[#2a2a35] group-hover:text-white">
                  <Upload className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-inter text-base font-semibold text-gray-900">
                    Do Computador
                  </p>
                  <p className="mt-1 font-inter text-xs text-gray-500">
                    Fazer upload de uma nova foto
                  </p>
                </div>
              </button>

              <button
                onClick={handleWardrobeSelect}
                className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-6 text-center transition-all hover:border-[#20202a] hover:shadow-lg"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 transition-all group-hover:from-[#20202a] group-hover:to-[#2a2a35] group-hover:text-white">
                  <FolderOpen className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-inter text-base font-semibold text-gray-900">
                    Do Vestuário
                  </p>
                  <p className="mt-1 font-inter text-xs text-gray-500">
                    Escolher peça já salva
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Step: Upload */}
          {step === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all',
                dragOver
                  ? 'border-[#20202a] bg-[#20202a]/5'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
              )}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Shirt className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-inter text-sm font-medium text-gray-700">
                Arraste a imagem ou clique para selecionar
              </p>
              <p className="mt-1 font-inter text-xs text-gray-500">
                JPG, PNG ou WEBP até 20MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Step: Categorize */}
          {step === 'categorize' && (
            <div className="space-y-5">
              {/* Image Preview */}
              <div className="flex gap-4">
                <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  {previewUrl && (
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="mb-1 block font-inter text-xs font-semibold text-gray-700">
                      Nome da peça *
                    </label>
                    <input
                      type="text"
                      value={pieceName}
                      onChange={(e) => setPieceName(e.target.value)}
                      placeholder="Ex: Blusa preta básica"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 font-inter text-sm text-gray-800 focus:border-[#20202a] focus:outline-none focus:ring-1 focus:ring-[#20202a]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-inter text-xs font-semibold text-gray-700">
                      Tipo de peça *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 font-inter text-sm text-gray-800 focus:border-[#20202a] focus:outline-none focus:ring-1 focus:ring-[#20202a]"
                    >
                      <option value="">Selecione o tipo</option>
                      {enumToOptions(GarmentCategory).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block font-inter text-xs font-semibold text-gray-700">
                  Descrição <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Ex: Tecido leve, mangas curtas, gola redonda"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 font-inter text-sm text-gray-800 focus:border-[#20202a] focus:outline-none focus:ring-1 focus:ring-[#20202a]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 font-inter text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Trocar Imagem
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 rounded-xl bg-[#20202a] py-2.5 font-inter text-sm font-semibold text-white hover:bg-[#2a2a35]"
                >
                  Adicionar Peça
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </Portal>
  );
};

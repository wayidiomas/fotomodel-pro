'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

interface WelcomeBubbleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeBubbleModal({ isOpen, onClose }: WelcomeBubbleModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 transition-opacity"
        onClick={onClose}
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md bg-[#f5f4f0] rounded-3xl overflow-hidden shadow-2xl transform transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#e5ded6] transition-colors z-10"
          aria-label="Fechar"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Content */}
        <div className="px-8 py-12 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#d6c096] to-[#beaa82] rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Sparkles className="h-10 w-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="font-freight text-3xl font-semibold text-gray-900 mb-3">
            Bem-vindo de volta!
          </h2>

          {/* Subtitle */}
          <p className="font-inter text-base text-gray-600 mb-6 leading-relaxed">
            Que alegria ter você aqui na nova plataforma Fotomodel Pro!
          </p>

          {/* Credits Highlight */}
          <div className="bg-gradient-to-br from-[#e5ded6] to-[#d6c096]/30 rounded-2xl p-6 mb-8 border border-[#d6c096]/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-[#beaa82]" />
              <span className="font-inter text-sm font-medium text-[#8b7355] uppercase tracking-wide">
                Presente Especial
              </span>
            </div>
            <p className="font-freight text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#beaa82] to-[#8b7355] mb-2">
              50 Créditos
            </p>
            <p className="font-inter text-sm text-gray-600">
              Para você começar a criar imagens incríveis
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onClose}
            className="w-full py-6 text-base font-medium bg-gradient-to-r from-[#d6c096] to-[#beaa82] hover:from-[#c8b48c] hover:to-[#a99470] text-white rounded-xl shadow-lg transition-all"
          >
            Começar a criar
          </Button>

          {/* Footer Note */}
          <p className="font-inter text-xs text-gray-500 mt-6">
            Seus créditos já foram adicionados à sua conta
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

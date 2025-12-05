'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import Image from 'next/image';

interface BuyCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
    const handleWhatsAppClick = () => {
        // Replace with your actual WhatsApp number and message
        const phoneNumber = '5511999999999'; // Example number
        const message = encodeURIComponent('Olá! Gostaria de comprar créditos extras para o Fotomodel.');
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                            className="relative w-full max-w-md rounded-3xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur-xl"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                            >
                                <X className="h-5 w-5 text-gray-600" />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                {/* Icon/Image */}
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                    <Image
                                        src="/assets/icons/whatsapp-gradient.svg"
                                        alt="WhatsApp"
                                        width={32}
                                        height={32}
                                        className="shrink-0"
                                    />
                                </div>

                                {/* Content */}
                                <h2 className="mb-2 font-freight text-2xl font-medium text-gray-900">
                                    Comprar Créditos Extras
                                </h2>

                                <p className="mb-8 font-inter text-sm leading-relaxed text-gray-600">
                                    Para adquirir mais créditos, entre em contato com nosso suporte via WhatsApp. Nossa equipe irá te ajudar com os pacotes disponíveis.
                                </p>

                                {/* Action Button */}
                                <Button
                                    onClick={handleWhatsAppClick}
                                    className="group w-full gap-2.5 rounded-xl bg-[#25D366] py-6 text-sm font-semibold text-white transition-all hover:bg-[#22c55e] hover:shadow-lg hover:shadow-green-500/20"
                                >
                                    <MessageCircle className="h-5 w-5 fill-current" />
                                    Falar no WhatsApp
                                </Button>

                                <button
                                    onClick={onClose}
                                    className="mt-4 font-inter text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

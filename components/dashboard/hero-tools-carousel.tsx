'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import {
  ArrowRight,
  Hanger,
  FlatSurface,
} from '@/components/icons';
import { MessageSquare } from 'lucide-react';

interface HeroTool {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  images: {
    superior?: { src: string; alt: string; width: number; height: number; className: string };
    inferior?: { src: string; alt: string; width: number; height: number; className: string };
    arrow?: { src: string; alt: string; width: number; height: number; className: string; rotation: string };
    model?: { src: string; alt: string; width: number; height: number; className: string };
    person?: { src: string; alt: string; width: number; height: number; className: string };
    icon?: { src: string; alt: string; width: number; height: number; className: string };
  };
}

const HERO_TOOLS: HeroTool[] = [
  {
    id: 'cabide',
    title: 'Cabide',
    description: 'Crie a(o) modelo a partir de foto da roupa no cabide.',
    href: '/criar/cabide',
    icon: Hanger,
    gradient: 'linear-gradient(135deg, #FDFBF7 0%, #F5F2EB 100%)',
    images: {
      superior: {
        src: '/assets/images/cabide-roupa-superior.png',
        alt: 'Blusa vermelha no cabide',
        width: 115,
        height: 156,
        className: 'absolute left-[78px] top-0',
      },
      inferior: {
        src: '/assets/images/cabide-roupa-inferior.png',
        alt: 'Shorts jeans no cabide',
        width: 115,
        height: 156,
        className: 'absolute left-0 top-[69px]',
      },
      arrow: {
        src: '/assets/images/cabide-seta.svg',
        alt: 'Seta',
        width: 72,
        height: 90,
        className: 'absolute left-[163px] top-[90px]',
        rotation: '104.203deg',
      },
      model: {
        src: '/assets/images/cabide-modelo.png',
        alt: 'Modelo',
        width: 169,
        height: 274,
        className: 'absolute right-0 top-0',
      },
    },
  },
  {
    id: 'superficie-plana',
    title: 'Superfície plana',
    description: 'Crie a(o) modelo a partir de foto da roupa em cima de uma mesa ou balcão.',
    href: '/criar/superficie-plana',
    icon: FlatSurface,
    gradient: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    images: {
      superior: {
        src: '/assets/images/cabide-roupa-superior.png',
        alt: 'Blusa vermelha na superfície',
        width: 115,
        height: 156,
        className: 'absolute left-[78px] top-0',
      },
      inferior: {
        src: '/assets/images/cabide-roupa-inferior.png',
        alt: 'Shorts jeans na superfície',
        width: 115,
        height: 156,
        className: 'absolute left-0 top-[69px]',
      },
      arrow: {
        src: '/assets/images/cabide-seta.svg',
        alt: 'Seta',
        width: 72,
        height: 90,
        className: 'absolute left-[163px] top-[90px]',
        rotation: '104.203deg',
      },
      model: {
        src: '/assets/images/plana-modelo.png',
        alt: 'Modelo',
        width: 169,
        height: 274,
        className: 'absolute right-0 top-0',
      },
    },
  },
  {
    id: 'roupa-flutuante',
    title: 'Roupa flutuante',
    description: 'Crie a(o) modelo a partir de foto de peças representadas em 3D.',
    href: '/criar/roupa-flutuante',
    icon: FlatSurface,
    gradient: 'linear-gradient(135deg, #FDFBF7 0%, #F5F2EB 100%)',
    images: {
      superior: {
        src: '/assets/images/flutuante-roupa-superior.png',
        alt: 'Blusa flutuante',
        width: 115,
        height: 156,
        className: 'absolute left-[78px] top-0',
      },
      inferior: {
        src: '/assets/images/flutuante-roupa-inferior.png',
        alt: 'Shorts flutuante',
        width: 115,
        height: 156,
        className: 'absolute left-0 top-[69px]',
      },
      arrow: {
        src: '/assets/images/cabide-seta.svg',
        alt: 'Seta',
        width: 72,
        height: 90,
        className: 'absolute left-[163px] top-[90px]',
        rotation: '104.203deg',
      },
      model: {
        src: '/assets/images/flutuante-modelo.png',
        alt: 'Modelo',
        width: 169,
        height: 274,
        className: 'absolute right-0 top-0',
      },
    },
  },
  {
    id: 'roupa-no-corpo',
    title: 'Roupa no corpo',
    description: 'Crie a(o) modelo a partir de foto de uma pessoa vestindo a roupa.',
    href: '/criar/roupa-no-corpo',
    icon: Hanger,
    gradient: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    images: {
      person: {
        src: '/assets/images/corpo-pessoa.png',
        alt: 'Pessoa vestindo roupa',
        width: 115,
        height: 188,
        className: 'absolute left-[20px] top-[15px]',
      },
      arrow: {
        src: '/assets/images/corpo-seta.svg',
        alt: 'Seta',
        width: 72,
        height: 90,
        className: 'absolute left-[115px] top-[40px]',
        rotation: '104.203deg',
      },
      model: {
        src: '/assets/images/corpo-modelo.png',
        alt: 'Modelo profissional',
        width: 110,
        height: 250,
        className: 'absolute right-[20px] top-0',
      },
    },
  },
  {
    id: 'manequim',
    title: 'Manequim',
    description: 'Crie a(o) modelo a partir de foto de um manequim vestindo a roupa.',
    href: '/criar/manequim',
    icon: FlatSurface,
    gradient: 'linear-gradient(135deg, #FDFBF7 0%, #F5F2EB 100%)',
    images: {
      person: {
        src: '/assets/images/manequim-pessoa.png',
        alt: 'Manequim',
        width: 115,
        height: 188,
        className: 'absolute left-[20px] top-[15px]',
      },
      arrow: {
        src: '/assets/images/corpo-seta.svg',
        alt: 'Seta',
        width: 72,
        height: 90,
        className: 'absolute left-[115px] top-[40px]',
        rotation: '104.203deg',
      },
      model: {
        src: '/assets/images/manequim-modelo.png',
        alt: 'Modelo profissional',
        width: 150,
        height: 250,
        className: 'absolute right-[10px] top-0',
      },
    },
  },
  {
    id: 'chat',
    title: 'Geração livre',
    description: 'Crie imagens de moda usando conversas com IA. Descreva o que você quer.',
    href: '/chat',
    icon: MessageSquare,
    gradient: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    images: {
      icon: {
        src: '/assets/images/chat-icon.svg',
        alt: 'Chat IA',
        width: 120,
        height: 120,
        className: 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
      },
    },
  },
];

export function HeroToolsCarousel() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = Math.ceil(HERO_TOOLS.length / 2);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [isPaused, handleNext]);

  const visibleTools = HERO_TOOLS.slice(currentIndex * 2, currentIndex * 2 + 2);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel Container */}
      <div className="overflow-hidden py-4 px-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6"
          >
            {visibleTools.map((tool) => {
              const Icon = tool.icon;
              const isChat = tool.id === 'chat';

              return (
                <motion.div
                  key={tool.id}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative overflow-hidden rounded-3xl border border-black/5 p-6 shadow-sm transition-shadow hover:shadow-xl md:p-7 lg:p-8"
                  style={{
                    background: tool.gradient,
                  }}
                >
                  <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:gap-10">
                    {/* Lado Esquerdo: Conteúdo */}
                    <div className="flex flex-1 flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/60 shadow-sm backdrop-blur-sm">
                          <Icon className="h-6 w-6 text-black" />
                        </div>
                        <div>
                          <h3 className="font-freight text-2xl font-medium text-black md:text-[26px]">
                            {tool.title}
                          </h3>
                          <p className="mt-2 font-inter text-base leading-relaxed text-black/70">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-fit gap-2 rounded-xl bg-black px-5 py-4 font-inter text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-black/90 md:text-base md:px-6 md:py-5"
                        onClick={() => router.push(tool.href)}
                      >
                        Começar agora
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Lado Direito: Imagens */}
                    <div className="relative min-h-[260px] flex-1 lg:min-h-[auto]">
                      {/* Chat icon centralizado */}
                      {isChat && tool.images.icon && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <MessageSquare className="h-32 w-32 text-black/10" />
                          </motion.div>
                        </div>
                      )}

                      {/* Container das roupas */}
                      {tool.images.superior && tool.images.inferior && (
                        <div className="relative h-[249px] w-[193px] mx-auto lg:mx-0">
                          <Image
                            src={tool.images.superior.src}
                            alt={tool.images.superior.alt}
                            width={tool.images.superior.width}
                            height={tool.images.superior.height}
                            className={tool.images.superior.className}
                          />
                          <Image
                            src={tool.images.inferior.src}
                            alt={tool.images.inferior.alt}
                            width={tool.images.inferior.width}
                            height={tool.images.inferior.height}
                            className={tool.images.inferior.className}
                          />
                        </div>
                      )}

                      {/* Pessoa com moldura branca */}
                      {tool.images.person && (
                        <div className={`${tool.images.person.className} bg-white rounded-xl p-2 shadow-lg rotate-[-2deg]`}>
                          <Image
                            src={tool.images.person.src}
                            alt={tool.images.person.alt}
                            width={tool.images.person.width}
                            height={tool.images.person.height}
                          />
                        </div>
                      )}

                      {/* Seta curvada */}
                      {tool.images.arrow && (
                        <Image
                          src={tool.images.arrow.src}
                          alt={tool.images.arrow.alt}
                          width={tool.images.arrow.width}
                          height={tool.images.arrow.height}
                          className={tool.images.arrow.className}
                          style={{ transform: `rotate(${tool.images.arrow.rotation})` }}
                        />
                      )}

                      {/* Modelo vestido */}
                      {tool.images.model && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Image
                            src={tool.images.model.src}
                            alt={tool.images.model.alt}
                            width={tool.images.model.width}
                            height={tool.images.model.height}
                            className={tool.images.model.className}
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Decorative overlay */}
                  <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute -left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-xl transition-all hover:scale-110 hover:bg-gray-50 z-10"
        aria-label="Anterior"
      >
        <ArrowRight className="h-5 w-5 rotate-180 text-black" />
      </button>
      <button
        onClick={handleNext}
        className="absolute -right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-xl transition-all hover:scale-110 hover:bg-gray-50 z-10"
        aria-label="Próximo"
      >
        <ArrowRight className="h-5 w-5 text-black" />
      </button>

      {/* Progress Indicators */}
      <div className="mt-8 flex justify-center gap-3">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${currentIndex === index
              ? 'w-12 bg-black'
              : 'w-2 bg-black/10 hover:bg-black/20'
              }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

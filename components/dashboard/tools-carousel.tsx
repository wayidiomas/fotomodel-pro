'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import {
  ArrowRight,
  Hanger,
  FlatSurface,
} from '@/components/icons';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  images: {
    superior?: { src: string; alt: string; width: number; height: number; position: string };
    inferior?: { src: string; alt: string; width: number; height: number; position: string };
    arrow: { src: string; alt: string; width: number; height: number; position: string; rotation: string };
    model: { src: string; alt: string; width: number; height: number; position: string };
    person?: { src: string; alt: string; width: number; height: number; position: string };
  };
}

const tools: Tool[] = [
  {
    id: 'cabide',
    title: 'Cabide',
    description: 'Crie a(o) modelo a partir de foto da roupa no cabide.',
    icon: Hanger,
    bgColor: '#eae6de',
    images: {
      superior: {
        src: '/assets/images/cabide-roupa-superior.png',
        alt: 'Blusa vermelha no cabide',
        width: 115,
        height: 156,
        position: 'absolute left-[78px] top-0',
      },
      inferior: {
        src: '/assets/images/cabide-roupa-inferior.png',
        alt: 'Shorts jeans no cabide',
        width: 115,
        height: 156,
        position: 'absolute left-0 top-[69px]',
      },
      arrow: {
        src: '/assets/images/cabide-seta.svg',
        alt: 'Seta indicando transformação',
        width: 72,
        height: 90,
        position: 'absolute left-[163px] top-[90px]',
        rotation: '104.203deg',
      },
      model: {
        src: '/assets/images/cabide-modelo.png',
        alt: 'Modelo usando a roupa',
        width: 169,
        height: 274,
        position: 'absolute right-0 top-0',
      },
    },
  },
  {
    id: 'superficie-plana',
    title: 'Superfície plana',
    description: 'Crie a(o) modelo a partir de foto da roupa em cima de uma mesa ou balcão.',
    icon: FlatSurface,
    bgColor: '#eceff1',
    images: {
      superior: {
        src: '/assets/images/cabide-roupa-superior.png',
        alt: 'Blusa vermelha na superfície',
        width: 115,
        height: 156,
        position: 'absolute left-[78px] top-0',
      },
      inferior: {
        src: '/assets/images/cabide-roupa-inferior.png',
        alt: 'Shorts jeans na superfície',
        width: 115,
        height: 156,
        position: 'absolute left-0 top-[69px]',
      },
      arrow: {
        src: '/assets/images/cabide-seta.svg',
        alt: 'Seta indicando transformação',
        width: 72,
        height: 90,
        position: 'absolute left-[163px] top-[90px]',
        rotation: '104.203deg',
      },
      model: {
        src: '/assets/images/plana-modelo.png',
        alt: 'Modelo usando a roupa',
        width: 169,
        height: 274,
        position: 'absolute right-0 top-0',
      },
    },
  },
  {
    id: 'roupa-flutuante',
    title: 'Roupa flutuante',
    description: 'Crie a(o) modelo a partir de foto de peças representadas em 3D.',
    icon: FlatSurface, // Temporário, ajustar ícone correto depois
    bgColor: '#eae6de',
    images: {
      superior: {
        src: '/assets/images/flutuante-roupa-superior.png',
        alt: 'Blusa flutuante',
        width: 115,
        height: 156,
        position: 'absolute left-[78px] top-0',
      },
      inferior: {
        src: '/assets/images/flutuante-roupa-inferior.png',
        alt: 'Shorts flutuante',
        width: 115,
        height: 156,
        position: 'absolute left-0 top-[69px]',
      },
      arrow: {
        src: '/assets/images/cabide-seta.svg',
        alt: 'Seta indicando transformação',
        width: 72,
        height: 90,
        position: 'absolute left-[163px] top-[90px]',
        rotation: '104.203deg',
      },
      model: {
        src: '/assets/images/flutuante-modelo.png',
        alt: 'Modelo usando a roupa',
        width: 169,
        height: 274,
        position: 'absolute right-0 top-0',
      },
    },
  },
  {
    id: 'roupa-no-corpo',
    title: 'Roupa no corpo',
    description: 'Crie a(o) modelo a partir de foto de uma pessoa vestindo a roupa.',
    icon: Hanger, // Temporário, ajustar ícone correto depois
    bgColor: '#eae6de',
    images: {
      person: {
        src: '/assets/images/corpo-pessoa.png',
        alt: 'Pessoa vestindo roupa',
        width: 91,
        height: 149,
        position: 'absolute left-[57.8px] top-[21px]',
      },
      arrow: {
        src: '/assets/images/corpo-seta.svg',
        alt: 'Seta indicando transformação',
        width: 57,
        height: 71,
        position: 'absolute left-[129.8px] top-[23px]',
        rotation: '104.203deg',
      },
      model: {
        src: '/assets/images/corpo-modelo.png',
        alt: 'Modelo profissional loira',
        width: 88,
        height: 200,
        position: 'absolute left-[221.8px] top-[8px]',
      },
    },
  },
  {
    id: 'manequim',
    title: 'Manequim',
    description: 'Crie a(o) modelo a partir de foto de um manequim vestindo a roupa.',
    icon: FlatSurface, // Temporário, ajustar ícone correto depois
    bgColor: '#eae6de',
    images: {
      person: {
        src: '/assets/images/manequim-pessoa.png',
        alt: 'Manequim',
        width: 91,
        height: 149,
        position: 'absolute left-[57.8px] top-[21px]',
      },
      arrow: {
        src: '/assets/images/corpo-seta.svg',
        alt: 'Seta indicando transformação',
        width: 57,
        height: 71,
        position: 'absolute left-[129.8px] top-[23px]',
        rotation: '104.203deg',
      },
      model: {
        src: '/assets/images/manequim-modelo.png',
        alt: 'Modelo profissional morena',
        width: 120,
        height: 200,
        position: 'absolute left-[213px] top-[8px]',
      },
    },
  },
];

export function ToolsCarousel() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 2 >= tools.length ? 0 : prev + 2));
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 2 < 0 ? Math.max(0, tools.length - 2) : prev - 2));
    setTimeout(() => setIsAnimating(false), 600);
  };

  const visibleTools = tools.slice(currentIndex, currentIndex + 2);

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="grid grid-cols-2 gap-6">
        {visibleTools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              className="relative overflow-hidden rounded-2xl p-8 transition-all duration-600 ease-in-out"
              style={{
                backgroundColor: tool.bgColor,
                opacity: isAnimating ? 0 : 1,
                transform: isAnimating ? 'translateX(20px)' : 'translateX(0)',
                transitionDelay: `${index * 100}ms`,
              }}
            >
              <div className="relative z-10 flex gap-10">
                {/* Lado Esquerdo: Conteúdo */}
                <div className="flex-1 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                    <Icon className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-inter text-2xl font-bold text-black">{tool.title}</h3>
                    <p className="mt-2 font-inter text-base text-black">
                      {tool.description}
                    </p>
                  </div>
                  <Button
                    className="gap-2 rounded-md bg-[#20202a] px-4 py-2.5 font-inter text-sm font-medium text-white shadow hover:bg-[#20202a]/90"
                    onClick={() => router.push(`/criar/${tool.id}`)}
                  >
                    Começar agora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Lado Direito: Imagens */}
                <div className="relative flex-1">
                  {/* Container das roupas */}
                  {tool.images.superior && tool.images.inferior && (
                    <div className="relative h-[249px] w-[193px]">
                      <Image
                        src={tool.images.superior.src}
                        alt={tool.images.superior.alt}
                        width={tool.images.superior.width}
                        height={tool.images.superior.height}
                        className={tool.images.superior.position}
                      />
                      <Image
                        src={tool.images.inferior.src}
                        alt={tool.images.inferior.alt}
                        width={tool.images.inferior.width}
                        height={tool.images.inferior.height}
                        className={tool.images.inferior.position}
                      />
                    </div>
                  )}

                  {/* Pessoa com moldura branca (para roupa no corpo e manequim) */}
                  {tool.images.person && (
                    <div className={`${tool.images.person.position} bg-white rounded-lg p-2 shadow-md`}>
                      <Image
                        src={tool.images.person.src}
                        alt={tool.images.person.alt}
                        width={tool.images.person.width}
                        height={tool.images.person.height}
                      />
                    </div>
                  )}

                  {/* Seta curvada */}
                  <Image
                    src={tool.images.arrow.src}
                    alt={tool.images.arrow.alt}
                    width={tool.images.arrow.width}
                    height={tool.images.arrow.height}
                    className={tool.images.arrow.position}
                    style={{ transform: `rotate(${tool.images.arrow.rotation})` }}
                  />

                  {/* Modelo vestido */}
                  <Image
                    src={tool.images.model.src}
                    alt={tool.images.model.alt}
                    width={tool.images.model.width}
                    height={tool.images.model.height}
                    className={tool.images.model.position}
                  />
                </div>
              </div>

              {/* Decorative overlay */}
              <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-white/10" />
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        disabled={currentIndex === 0 || isAnimating}
        className="absolute -left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <svg className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <button
        onClick={handleNext}
        disabled={currentIndex + 2 >= tools.length || isAnimating}
        className="absolute -right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Progress Indicators */}
      <div className="mt-6 flex justify-center gap-2">
        {Array.from({ length: Math.ceil(tools.length / 2) }).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isAnimating) {
                setIsAnimating(true);
                setCurrentIndex(index * 2);
                setTimeout(() => setIsAnimating(false), 600);
              }
            }}
            className={`h-2 rounded-full transition-all ${
              Math.floor(currentIndex / 2) === index
                ? 'w-8 bg-gray-900'
                : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

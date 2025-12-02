import * as React from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { CategoryCard, type CategoryCardProps } from '@/components/criar';
import { MainHeader } from '@/components/shared';

// Configuração das 5 categorias com posições exatas do Figma
const categories: CategoryCardProps[] = [
  {
    title: 'Cabide',
    description: 'Crie a(o) modelo a partir de foto da roupa no cabide.',
    href: '/criar/cabide',
    images: {
      superior: {
        src: '/assets/images/criar/cabide/roupa-superior.png',
        alt: 'Roupa superior no cabide',
        width: 105.3,
        height: 143.1,
        position: {
          top: '20.2px',
          left: '125.6px',
        },
      },
      inferior: {
        src: '/assets/images/criar/cabide/roupa-inferior.png',
        alt: 'Roupa inferior no cabide',
        width: 113.4,
        height: 153.9,
        position: {
          top: '82.4px',
          left: '24.3px',
        },
      },
      arrow: {
        src: '/assets/icons/ui/arrow-up-1.svg',
        alt: 'Seta de transformação',
        width: 97.2,
        height: 121.5,
        position: {
          top: '5.4px',
          left: '187.7px',
        },
        rotation: 104.203,
      },
      model: {
        src: '/assets/images/criar/cabide/modelo.png',
        alt: 'Modelo resultante',
        width: 166.05,
        height: 270,
        position: {
          top: '10.8px',
          left: '264.6px',
        },
      },
    },
  },
  {
    title: 'Superfície plana',
    description:
      'Crie a(o) modelo a partir de foto da roupa em cima de uma mesa ou balcão.',
    href: '/criar/superficie-plana',
    images: {
      superior: {
        src: '/assets/images/criar/superficie-plana/roupa-superior.png',
        alt: 'Roupa superior na superfície',
        width: 105.3,
        height: 143.1,
        position: {
          top: '20.2px',
          left: '125.6px',
        },
      },
      inferior: {
        src: '/assets/images/criar/superficie-plana/roupa-inferior.png',
        alt: 'Roupa inferior na superfície',
        width: 113.4,
        height: 153.9,
        position: {
          top: '82.4px',
          left: '24.3px',
        },
      },
      arrow: {
        src: '/assets/icons/ui/arrow-up-1.svg',
        alt: 'Seta de transformação',
        width: 97.257,
        height: 121.122,
        position: {
          top: '5.4px',
          left: '187.7px',
        },
        rotation: 104.203,
      },
      model: {
        src: '/assets/images/criar/superficie-plana/modelo.png',
        alt: 'Modelo resultante',
        width: 166.05,
        height: 270,
        position: {
          top: '10.8px',
          left: '291.6px',
        },
      },
    },
  },
  {
    title: 'Roupa flutuante',
    description: 'Crie a(o) modelo a partir de foto de peças representadas em 3D.',
    href: '/criar/roupa-flutuante',
    images: {
      superior: {
        src: '/assets/images/criar/roupa-flutuante/roupa-superior.png',
        alt: 'Roupa superior flutuante',
        width: 105.3,
        height: 143.1,
        position: {
          top: '20.2px',
          left: '125.6px',
        },
      },
      inferior: {
        src: '/assets/images/criar/roupa-flutuante/roupa-inferior.png',
        alt: 'Roupa inferior flutuante',
        width: 113.4,
        height: 153.9,
        position: {
          top: '82.4px',
          left: '24.3px',
        },
      },
      arrow: {
        src: '/assets/icons/ui/arrow-up-1.svg',
        alt: 'Seta de transformação',
        width: 97.257,
        height: 121.122,
        position: {
          top: '5.4px',
          left: '187.7px',
        },
        rotation: 104.203,
      },
      model: {
        src: '/assets/images/criar/roupa-flutuante/modelo.png',
        alt: 'Modelo resultante',
        width: 166.05,
        height: 270,
        position: {
          top: '10.8px',
          left: '291.6px',
        },
      },
    },
  },
  {
    title: 'Roupa no corpo',
    description:
      'Crie a(o) modelo a partir de foto de uma pessoa vestindo a roupa.',
    href: '/criar/roupa-no-corpo',
    images: {
      person: {
        src: '/assets/images/criar/roupa-no-corpo/pessoa.png',
        alt: 'Pessoa vestindo roupa',
        width: 141.75,
        height: 232.2,
        position: {
          top: '40px',
          left: '110px',
        },
      },
      arrow: {
        src: '/assets/icons/ui/arrow-up-2.svg',
        alt: 'Seta de transformação',
        width: 81,
        height: 101.25,
        position: {
          top: '67.5px',
          left: '230.0px',
        },
        rotation: 104.203,
      },
      model: {
        src: '/assets/images/criar/roupa-no-corpo/modelo.png',
        alt: 'Modelo resultante',
        width: 155.25,
        height: 270,
        position: {
          top: '5.4px',
          left: '276.8px',
        },
      },
    },
  },
  {
    title: 'Manequim',
    description:
      'Crie a(o) modelo a partir de foto de um manequim vestindo a roupa.',
    href: '/criar/manequim',
    images: {
      person: {
        src: '/assets/images/criar/manequim/pessoa.png',
        alt: 'Manequim vestindo roupa',
        width: 141.75,
        height: 232.2,
        position: {
          top: '40px',
          left: '105px',
        },
      },
      arrow: {
        src: '/assets/icons/ui/arrow-up-2.svg',
        alt: 'Seta de transformação',
        width: 81,
        height: 101.25,
        position: {
          top: '67.5px',
          left: '225.0px',
        },
        rotation: 104.203,
      },
      model: {
        src: '/assets/images/criar/manequim/modelo.png',
        alt: 'Modelo resultante',
        width: 182.25,
        height: 270,
        position: {
          top: '5.4px',
          left: '270.0px',
        },
      },
    },
  },
  {
    title: 'Chat - Geração Livre',
    description: 'Crie livremente com IA conversacional. Descreva o que deseja e a IA te guia.',
    href: '/chat',
    badge: 'BETA',
    images: {
      // Card especial: apenas ícone de chat centralizado
      icon: {
        src: '/assets/icons/ui/chat.svg',
        alt: 'Chat com IA',
        width: 120,
        height: 120,
        position: {
          top: '75px',
          left: '155px',
        },
      },
    },
  },
];

export default async function CriarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let credits = 0;
  if (user) {
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('credits')
      .eq('id', user.id)
      .single();
    credits = userData?.credits ?? 0;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader currentPage="criar" credits={credits} />

      {/* Main Content */}
      <main className="px-8 py-10">
        {/* Page Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="bg-white/20 rounded-lg w-12 h-12 flex items-center justify-center">
            <Image
              src="/assets/icons/ui/image-tools.svg"
              alt="Ferramentas de Imagem"
              width={24}
              height={24}
            />
          </div>
          <h1 className="font-inter font-bold text-2xl leading-8 text-gray-900">
            Ferramentas de Imagem
          </h1>
        </div>

        {/* Grid de Categorias - 3 colunas em desktop, 5 em ultra-wide */}
        <div className="grid grid-cols-3 2xl:grid-cols-5 gap-6 justify-items-start">
          {categories.map((category) => (
            <CategoryCard key={category.href} {...category} />
          ))}
        </div>
      </main>
    </div>
  );
}

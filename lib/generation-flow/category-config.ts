export type CategorySlug =
  | 'cabide'
  | 'superficie-plana'
  | 'roupa-flutuante'
  | 'roupa-no-corpo'
  | 'manequim';

export interface CategoryConfig {
  slug: CategorySlug;
  title: string;
  illustration: string;
  singleGarmentDescription: string;
  outfitGarmentDescription: string;
}

export const categoryConfigs: Record<CategorySlug, CategoryConfig> = {
  'cabide': {
    slug: 'cabide',
    title: 'Cabide',
    illustration: '/assets/images/generation-flow/clothing-items.png',
    singleGarmentDescription:
      'Peças de cima englobam toppings, vestidos, camisas, roupões, blazers, casacos, moletons, etc.',
    outfitGarmentDescription:
      'Peças de baixo englobam calças, shorts, saias, bermudas, leggings, etc.',
  },
  'superficie-plana': {
    slug: 'superficie-plana',
    title: 'Superfície Plana',
    illustration: '/assets/images/generation-flow/clothing-items.png',
    singleGarmentDescription:
      'Peças de cima englobam toppings, vestidos, camisas, roupões, blazers, casacos, moletons, etc.',
    outfitGarmentDescription:
      'Peças de baixo englobam calças, shorts, saias, bermudas, leggings, etc.',
  },
  'roupa-flutuante': {
    slug: 'roupa-flutuante',
    title: 'Roupa Flutuante',
    illustration: '/assets/images/generation-flow/clothing-items.png',
    singleGarmentDescription:
      'Peças de cima englobam toppings, vestidos, camisas, roupões, blazers, casacos, moletons, etc.',
    outfitGarmentDescription:
      'Peças de baixo englobam calças, shorts, saias, bermudas, leggings, etc.',
  },
  'roupa-no-corpo': {
    slug: 'roupa-no-corpo',
    title: 'Roupa no Corpo',
    illustration: '/assets/images/generation-flow/clothing-items.png',
    singleGarmentDescription:
      'Peças de cima englobam toppings, vestidos, camisas, roupões, blazers, casacos, moletons, etc.',
    outfitGarmentDescription:
      'Peças de baixo englobam calças, shorts, saias, bermudas, leggings, etc.',
  },
  'manequim': {
    slug: 'manequim',
    title: 'Manequim',
    illustration: '/assets/images/generation-flow/clothing-items.png',
    singleGarmentDescription:
      'Peças de cima englobam toppings, vestidos, camisas, roupões, blazers, casacos, moletons, etc.',
    outfitGarmentDescription:
      'Peças de baixo englobam calças, shorts, saias, bermudas, leggings, etc.',
  },
};

export function getCategoryConfig(slug: string): CategoryConfig | null {
  return categoryConfigs[slug as CategorySlug] || null;
}

export const validCategorySlugs = Object.keys(categoryConfigs) as CategorySlug[];

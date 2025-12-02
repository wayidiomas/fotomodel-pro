/**
 * Hierarchical Garment Categories
 * Organized by clothing type groups for better UX in filters
 */

export interface GarmentCategory {
  value: string;
  label: string;
}

export interface GarmentCategoryGroup {
  id: string;
  label: string;
  categories: GarmentCategory[];
}

/**
 * Hierarchical garment categories grouped by type
 * Used in the pose selection filter interface
 */
export const GARMENT_CATEGORY_GROUPS: GarmentCategoryGroup[] = [
  {
    id: 'roupa-intima',
    label: 'Roupa Íntima',
    categories: [
      { value: 'sunga', label: 'Sunga' },
      { value: 'maio', label: 'Maiô' },
      { value: 'biquini', label: 'Biquíni' },
      { value: 'lingerie', label: 'Lingerie' },
    ],
  },
  {
    id: 'vestidos',
    label: 'Vestidos',
    categories: [
      { value: 'vestido-curto', label: 'Vestido Curto' },
      { value: 'vestido-midi', label: 'Vestido Midi' },
      { value: 'vestido-longo', label: 'Vestido Longo' },
      { value: 'vestido-festa', label: 'Vestido de Festa' },
    ],
  },
  {
    id: 'saias',
    label: 'Saias',
    categories: [
      { value: 'saia-curta', label: 'Saia Curta' },
      { value: 'saia-midi', label: 'Saia Midi' },
      { value: 'saia-longa', label: 'Saia Longa' },
      { value: 'saia-lapis', label: 'Saia Lápis' },
    ],
  },
  {
    id: 'calcas',
    label: 'Calças',
    categories: [
      { value: 'calca-jeans', label: 'Calça Jeans' },
      { value: 'calca-alfaiataria', label: 'Calça Alfaiataria' },
      { value: 'calca-legging', label: 'Calça Legging' },
      { value: 'calca-social', label: 'Calça Social' },
    ],
  },
  {
    id: 'blusas-camisas',
    label: 'Blusas e Camisas',
    categories: [
      { value: 'blusa', label: 'Blusa' },
      { value: 'camisa', label: 'Camisa' },
      { value: 'camiseta', label: 'Camiseta' },
      { value: 'regata', label: 'Regata' },
      { value: 'polo', label: 'Polo' },
    ],
  },
  {
    id: 'casacos-blazers',
    label: 'Casacos e Blazers',
    categories: [
      { value: 'blazer', label: 'Blazer' },
      { value: 'casaco', label: 'Casaco' },
      { value: 'jaqueta', label: 'Jaqueta' },
      { value: 'cardigan', label: 'Cardigã' },
    ],
  },
  {
    id: 'shorts-bermudas',
    label: 'Shorts e Bermudas',
    categories: [
      { value: 'shorts', label: 'Shorts' },
      { value: 'bermuda', label: 'Bermuda' },
    ],
  },
  {
    id: 'conjuntos',
    label: 'Conjuntos',
    categories: [
      { value: 'terno', label: 'Terno' },
      { value: 'conjunto-social', label: 'Conjunto Social' },
      { value: 'conjunto-esportivo', label: 'Conjunto Esportivo' },
    ],
  },
];

/**
 * Get all category values as a flat array
 * Useful for database queries and validation
 */
export const getAllCategoryValues = (): string[] => {
  return GARMENT_CATEGORY_GROUPS.flatMap(group =>
    group.categories.map(cat => cat.value)
  );
};

/**
 * Find category label by value
 */
export const getCategoryLabel = (value: string): string | undefined => {
  for (const group of GARMENT_CATEGORY_GROUPS) {
    const category = group.categories.find(cat => cat.value === value);
    if (category) return category.label;
  }
  return undefined;
};

/**
 * Find group label by category value
 */
export const getGroupLabel = (categoryValue: string): string | undefined => {
  for (const group of GARMENT_CATEGORY_GROUPS) {
    const hasCategory = group.categories.some(cat => cat.value === categoryValue);
    if (hasCategory) return group.label;
  }
  return undefined;
};

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface CustomizationOption {
  id: string;
  option_type: 'facial_expression' | 'hair_color' | 'background_preset';
  option_value: string;
  display_name: string;
  display_name_pt: string | null;
  display_order: number | null;
  icon_path: string | null;
  metadata: {
    hex?: string;
    description?: string;
    [key: string]: any;
  } | null;
  is_active: boolean | null;
}

export interface FacialExpressionOption {
  value: string;
  label: string;
  description?: string;
  imagePath: string;
}

export interface HairColorOption {
  value: string;
  label: string;
  hexColor: string;
  imagePath: string;
}

/**
 * Hook to fetch customization options from database
 * @param optionType - Type of option to fetch ('facial_expression' or 'hair_color')
 * @returns Object with options array and loading state
 */
export function useCustomizationOptions(
  optionType: 'facial_expression' | 'hair_color'
) {
  const [options, setOptions] = useState<CustomizationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from('customization_options')
          .select('*')
          .eq('option_type', optionType)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (fetchError) {
          console.error('Error fetching customization options:', fetchError);
          setError(fetchError.message);
          setOptions([]);
        } else {
          setOptions(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching options:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOptions();
  }, [optionType]);

  return { options, loading, error };
}

/**
 * Transform database options to FacialExpressionOption format
 */
export function useFacialExpressions(): {
  expressions: FacialExpressionOption[];
  loading: boolean;
  error: string | null;
} {
  const { options, loading, error } = useCustomizationOptions('facial_expression');

  const expressions: FacialExpressionOption[] = options.map((opt) => ({
    value: opt.option_value,
    label: opt.display_name_pt || opt.display_name,
    description: opt.metadata?.description,
    imagePath: opt.icon_path || '/assets/images/expressions/default.jpg',
  }));

  return { expressions, loading, error };
}

/**
 * Transform database options to HairColorOption format
 */
export function useHairColors(): {
  colors: HairColorOption[];
  loading: boolean;
  error: string | null;
} {
  const { options, loading, error } = useCustomizationOptions('hair_color');

  const colors: HairColorOption[] = options.map((opt) => ({
    value: opt.option_value,
    label: opt.display_name_pt || opt.display_name,
    hexColor: opt.metadata?.hex || '#000000',
    imagePath: opt.icon_path || '/assets/images/hair-colors/default.jpg',
  }));

  return { colors, loading, error };
}

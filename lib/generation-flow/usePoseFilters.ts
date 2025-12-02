'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PoseMetadata, PoseFilterState } from './pose-types';
import { ModelGender } from './pose-types';

const FILTERS_STORAGE_KEY = 'fotomodel_pose_filters';
const DEFAULT_AGE_MIN = 1;
const DEFAULT_AGE_MAX = 80;

const DEFAULT_FILTERS: PoseFilterState = {
  genders: [ModelGender.MALE, ModelGender.FEMALE],
  ageMin: DEFAULT_AGE_MIN,
  ageMax: DEFAULT_AGE_MAX,
  ethnicities: [],
  poseCategories: [],
  garmentCategories: [],
};

export interface UsePoseFiltersReturn {
  poses: PoseMetadata[];
  isLoading: boolean;
  error: string | null;
  filters: PoseFilterState;
  setGenders: (genders: ModelGender[]) => void;
  setAgeRange: (min: number, max: number) => void;
  setGarmentCategories: (categories: string[]) => void;
  resetFilters: () => void;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage pose filters and fetch from Supabase
 * - Fetches poses based on filter criteria
 * - Persists filter preferences to localStorage
 * - Handles loading and error states
 */
export function usePoseFilters(): UsePoseFiltersReturn {
  const [poses, setPoses] = React.useState<PoseMetadata[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<PoseFilterState>(DEFAULT_FILTERS);

  // Load filters from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (stored) {
        const parsed: Partial<PoseFilterState> = JSON.parse(stored);
        setFilters((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error('Error loading filters from localStorage:', err);
    }
  }, []);

  // Save filters to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch (err) {
      console.error('Error saving filters to localStorage:', err);
    }
  }, [filters]);

  // Fetch poses based on current filters
  const fetchPoses = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      let query = (supabase
        .from('model_poses') as any)
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply gender filter
      if (filters.genders.length > 0 && filters.genders.length < 3) {
        query = query.in('gender', filters.genders);
      }

      // Apply age range filter
      // Pose matches if its age range overlaps with the filter range
      // (pose.age_min <= filter.max) AND (pose.age_max >= filter.min)
      query = query.lte('age_min', filters.ageMax).gte('age_max', filters.ageMin);

      // Apply garment categories filter (array overlap)
      if (filters.garmentCategories.length > 0) {
        query = query.overlaps('garment_categories', filters.garmentCategories);
      }

      const { data, error: fetchError } = await query;

      // DEBUG: Log query results
      console.log('🔍 Pose Query Debug:', {
        totalFound: data?.length || 0,
        filters,
        samplePoses: data?.slice(0, 2),
        error: fetchError
      });

      if (fetchError) {
        throw fetchError;
      }

      // Transform database rows to PoseMetadata
      const transformedPoses: PoseMetadata[] = (data || []).map((row: any) => ({
        id: row.id,
        imageUrl: row.image_url,
        gender: row.gender as ModelGender,
        ageMin: row.age_min,
        ageMax: row.age_max,
        ageRange: row.age_range,
        ethnicity: row.ethnicity,
        poseCategory: row.pose_category,
        garmentCategories: row.garment_categories || [],
        name: row.name || undefined,
        description: row.description || undefined,
        tags: row.tags || [],
        createdAt: row.created_at,
      }));

      setPoses(transformedPoses);
    } catch (err) {
      console.error('Error fetching poses:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar poses');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch poses when filters change
  React.useEffect(() => {
    fetchPoses();
  }, [fetchPoses]);

  // Filter update functions
  const setGenders = React.useCallback((genders: ModelGender[]) => {
    setFilters((prev) => ({ ...prev, genders }));
  }, []);

  const setAgeRange = React.useCallback((ageMin: number, ageMax: number) => {
    setFilters((prev) => ({ ...prev, ageMin, ageMax }));
  }, []);

  const setGarmentCategories = React.useCallback((garmentCategories: string[]) => {
    setFilters((prev) => ({ ...prev, garmentCategories }));
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const refetch = React.useCallback(async () => {
    await fetchPoses();
  }, [fetchPoses]);

  return {
    poses,
    isLoading,
    error,
    filters,
    setGenders,
    setAgeRange,
    setGarmentCategories,
    resetFilters,
    refetch,
  };
}

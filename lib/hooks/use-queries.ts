'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { getStoragePublicUrl } from '@/lib/storage/upload';

// ============================================
// Query Keys - centralized for cache invalidation
// ============================================
export const queryKeys = {
  // User
  userCredits: ['user', 'credits'] as const,

  // Dashboard
  dashboardData: ['dashboard'] as const,
  recentWardrobeItems: ['dashboard', 'wardrobe'] as const,
  recentModels: ['dashboard', 'models'] as const,
  recentDownloads: ['dashboard', 'downloads'] as const,

  // Vestuário
  wardrobeItems: (page?: number) => ['wardrobe', 'items', page] as const,
  wardrobeCollections: ['wardrobe', 'collections'] as const,

  // Galeria
  galleryGenerations: (page?: number) => ['gallery', 'generations', page] as const,
  galleryStats: ['gallery', 'stats'] as const,

  // Modelos
  userModels: ['models', 'user'] as const,
  systemPoses: ['models', 'poses'] as const,

  // Histórico
  auditEntries: ['historico', 'entries'] as const,

  // Chat
  conversations: ['chat', 'conversations'] as const,
  messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,

  // Subscription
  subscriptionPlans: ['subscription', 'plans'] as const,
  userSubscription: ['subscription', 'user'] as const,
};

// ============================================
// User Credits Hook
// ============================================
export function useUserCredits() {
  return useQuery({
    queryKey: queryKeys.userCredits,
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('users') as any)
        .select('credits')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.credits ?? 0;
    },
    staleTime: 30 * 1000, // 30 seconds - credits change frequently
  });
}

// ============================================
// Dashboard Hooks
// ============================================
export function useDashboardData() {
  return useQuery({
    queryKey: queryKeys.dashboardData,
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all dashboard data in parallel
      const [wardrobeResult, modelsResult, downloadsResult, creditsResult] = await Promise.all([
        // Wardrobe items
        (supabase.from('wardrobe_items') as any)
          .select(`
            id,
            garment_type,
            created_at,
            upload:user_uploads(id, file_name, thumbnail_path, file_path, metadata)
          `)
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(20),

        // Models
        (supabase.from('user_models') as any)
          .select('id, model_name, thumbnail_url, image_url, gender, age_range, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),

        // Downloads
        (supabase.from('user_downloads') as any)
          .select('id, thumbnail_url, image_url, downloaded_at, generation_id')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('downloaded_at', { ascending: false })
          .limit(20),

        // Credits
        (supabase.from('users') as any)
          .select('credits')
          .eq('id', user.id)
          .single(),
      ]);

      return {
        wardrobeItems: wardrobeResult.data || [],
        models: modelsResult.data || [],
        downloads: downloadsResult.data || [],
        credits: creditsResult.data?.credits ?? 0,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================
// Vestuário Hooks
// ============================================
const WARDROBE_PAGE_SIZE = 20;

export function useWardrobeItems() {
  return useInfiniteQuery({
    queryKey: ['wardrobe', 'items'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/wardrobe/items?page=${pageParam}`);
      if (!response.ok) throw new Error('Failed to fetch wardrobe items');
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWardrobeCollections() {
  return useQuery({
    queryKey: queryKeys.wardrobeCollections,
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('wardrobe_collections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// Galeria Hooks
// ============================================
export function useGalleryGenerations(enabled = true) {
  return useInfiniteQuery({
    queryKey: ['gallery', 'generations'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/gallery?page=${pageParam}`);
      if (!response.ok) throw new Error('Failed to fetch gallery');
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
    enabled, // Don't auto-fetch if SSR data is available
    refetchOnMount: false, // Prevent refetch when component mounts
  });
}

export function useGalleryStats() {
  return useQuery({
    queryKey: queryKeys.galleryStats,
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Parallel lightweight queries
      const [genCountResult, resultsCountResult, creditsResult] = await Promise.all([
        // 1. Count generations (head: true = no data, just count)
        (supabase.from('generations') as any)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .eq('is_deleted', false),

        // 2. Count results via join (select minimal data)
        (supabase.from('generation_results') as any)
          .select('generation_id!inner(user_id, status, is_deleted)', { count: 'exact', head: true })
          .eq('generation_id.user_id', user.id)
          .eq('generation_id.status', 'completed')
          .eq('generation_id.is_deleted', false),

        // 3. Sum credits (only fetch credits_used column)
        (supabase.from('generations') as any)
          .select('credits_used')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .eq('is_deleted', false),
      ]);

      const totalGenerations = genCountResult.count || 0;
      const totalResults = resultsCountResult.count || 0;
      const totalCreditsUsed = creditsResult.data?.reduce(
        (sum: number, g: any) => sum + (g.credits_used || 0), 0
      ) || 0;

      return { totalGenerations, totalResults, totalCreditsUsed };
    },
    staleTime: 10 * 60 * 1000, // 10 min - stats don't need frequent updates
  });
}

// ============================================
// Modelos Hooks
// ============================================
export function useUserModels() {
  return useQuery({
    queryKey: queryKeys.userModels,
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('user_models') as any)
        .select(`
          id,
          model_name,
          image_url,
          thumbnail_url,
          height_cm,
          weight_kg,
          facial_expression,
          hair_color,
          pose_name,
          gender,
          age_min,
          age_max,
          age_range,
          ethnicity,
          pose_category,
          garment_categories,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSystemPoses() {
  return useQuery({
    queryKey: queryKeys.systemPoses,
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await (supabase
        .from('model_poses') as any)
        .select(`
          id,
          name,
          image_url,
          gender,
          age_min,
          age_max,
          age_range,
          ethnicity,
          pose_category,
          garment_categories,
          description,
          is_featured
        `)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - system poses don't change often
  });
}

// ============================================
// Histórico Hooks
// ============================================
const HISTORICO_LIMIT = 250;

export function useHistoricoData() {
  return useQuery({
    queryKey: queryKeys.auditEntries,
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [uploadsResult, generationsResult, modelsResult] = await Promise.all([
        // Uploads
        (supabase.from('user_uploads') as any)
          .select('id, file_name, thumbnail_path, file_path, created_at, status, metadata')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(HISTORICO_LIMIT),

        // Generations
        (supabase.from('generations') as any)
          .select(`
            id,
            created_at,
            credits_used,
            status,
            input_data,
            generation_results (
              id,
              image_url,
              thumbnail_url,
              created_at,
              is_purchased
            )
          `)
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(HISTORICO_LIMIT),

        // Models
        (supabase.from('user_models') as any)
          .select('id, model_name, image_url, thumbnail_url, created_at, gender, age_range')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(HISTORICO_LIMIT),
      ]);

      return {
        uploads: uploadsResult.data || [],
        generations: generationsResult.data || [],
        models: modelsResult.data || [],
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================
// Chat Hooks
// ============================================
export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('chat_conversations') as any)
        .select('id, title, metadata, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000, // 1 minute - conversations update frequently
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: conversationId ? queryKeys.messages(conversationId) : ['chat', 'messages', 'none'],
    queryFn: async () => {
      if (!conversationId) return [];

      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      return data.messages || [];
    },
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================
// Wardrobe Limit Hook
// ============================================
export function useWardrobeLimits() {
  return useQuery({
    queryKey: ['wardrobe', 'limits'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's plan and wardrobe count in parallel
      const [userData, wardrobeCount] = await Promise.all([
        (supabase
          .from('users') as any)
          .select(`
            current_plan_id,
            subscription_plans:current_plan_id (
              slug,
              max_wardrobe_items
            )
          `)
          .eq('id', user.id)
          .single(),

        (supabase
          .from('wardrobe_items') as any)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_deleted', false)
      ]);

      if (userData.error) throw userData.error;

      const planSlug = userData.data?.subscription_plans?.slug || 'free';
      const maxItems = userData.data?.subscription_plans?.max_wardrobe_items ?? 5;
      const currentCount = wardrobeCount.count || 0;
      const isUnlimited = maxItems === -1;
      const canAddMore = isUnlimited || currentCount < maxItems;
      const remaining = isUnlimited ? -1 : Math.max(0, maxItems - currentCount);

      return {
        planSlug,
        maxItems,
        currentCount,
        isUnlimited,
        canAddMore,
        remaining,
        isAtLimit: !canAddMore,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================
// Subscription Hooks
// ============================================
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: queryKeys.subscriptionPlans,
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await (supabase
        .from('subscription_plans') as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour - plans don't change often
  });
}

export function useUserSubscription() {
  return useQuery({
    queryKey: queryKeys.userSubscription,
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('users') as any)
        .select(`
          current_plan_id,
          subscription_status,
          subscription_start_date,
          subscription_end_date,
          extra_credits_used,
          subscription_plans:current_plan_id (
            id,
            slug,
            name,
            name_pt,
            description_pt,
            price_brl,
            monthly_credits,
            extra_credit_price_brl,
            max_wardrobe_items,
            max_downloads,
            has_priority_support,
            features,
            billing_interval
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================
// Cache Invalidation Helpers
// ============================================
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateCredits: () => queryClient.invalidateQueries({ queryKey: queryKeys.userCredits }),
    invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboardData }),
    invalidateWardrobe: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardData });
    },
    invalidateGallery: () => queryClient.invalidateQueries({ queryKey: ['gallery'] }),
    invalidateModels: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userModels });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardData });
    },
    invalidateHistorico: () => queryClient.invalidateQueries({ queryKey: queryKeys.auditEntries }),
    invalidateConversations: () => queryClient.invalidateQueries({ queryKey: queryKeys.conversations }),
    invalidateMessages: (conversationId: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) }),
    invalidateSubscription: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionPlans });
      queryClient.invalidateQueries({ queryKey: queryKeys.userSubscription });
    },
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}

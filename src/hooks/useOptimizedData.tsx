import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

// Optimized Results Hook with caching and pagination
export function useResults() {
  return useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      const [recentRes, performersRes, champRes] = await Promise.all([
        supabase.from('results_recent').select('*').order('date', { ascending: false }).limit(10),
        supabase.from('top_performers').select('*').order('rank').limit(10),
        supabase.from('championships').select('*').order('date', { ascending: false }).limit(10)
      ]);

      if (recentRes.error) throw recentRes.error;
      if (performersRes.error) throw performersRes.error;
      if (champRes.error) throw champRes.error;

      return {
        recentResults: recentRes.data || [],
        topPerformers: performersRes.data || [],
        championships: champRes.data || []
      };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes for results data
  });
}

// Paginated Admin Notifications
export function useAdminNotifications(limit = 20) {
  return useInfiniteQuery({
    queryKey: ['admin-notifications'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageParam * limit, (pageParam + 1) * limit - 1);

      if (error) throw error;
      return {
        data: data || [],
        nextPage: data && data.length === limit ? pageParam + 1 : null,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 2 * 60 * 1000, // 2 minutes for notifications
  });
}

// Optimized Security Audit Logs
export function useSecurityLogs(limit = 50) {
  return useInfiniteQuery({
    queryKey: ['security-logs'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select(`
          *,
          profiles!security_audit_logs_user_id_fkey(first_name, last_name, role)
        `)
        .order('created_at', { ascending: false })
        .range(pageParam * limit, (pageParam + 1) * limit - 1);

      if (error) throw error;
      
      return {
        data: data || [],
        nextPage: data && data.length === limit ? pageParam + 1 : null,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Optimized Security Flags
export function useSecurityFlags() {
  return useQuery({
    queryKey: ['security-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_flags')
        .select(`
          *,
          raised_by:profiles!security_flags_raised_by_user_id_fkey(first_name, last_name),
          related_user:profiles!security_flags_related_user_id_fkey(first_name, last_name),
          resolved_by:profiles!security_flags_resolved_by_user_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Optimized Profiles with search and pagination
export function useProfiles(searchTerm = '', limit = 50) {
  return useInfiniteQuery({
    queryKey: ['profiles', searchTerm],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageParam * limit, (pageParam + 1) * limit - 1);

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return {
        data: data || [],
        nextPage: data && data.length === limit ? pageParam + 1 : null,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Mutation hooks for better UX
export function useLockAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, until, reason }: { userId: string; until?: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('lock_account', {
        _target_user_id: userId,
        _until: until || null,
        _reason: reason || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['security-logs'] });
    },
  });
}

export function useUnlockAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('unlock_account', {
        _target_user_id: userId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['security-logs'] });
    },
  });
}

// Performance monitoring hook
export function usePerformanceMetrics() {
  const metrics = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return null;

    return {
      // Page load metrics
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      domComplete: navigation.domComplete - navigation.fetchStart,
      
      // Network metrics
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      
      // Resource timing
      resources: performance.getEntriesByType('resource').length,
      
      // First paint metrics
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
    };
  }, []);

  return metrics;
}
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  role: 'user' | 'admin' | 'judge' | 'observer' | 'participant';
  first_name?: string;
  last_name?: string;
  state?: string;
  region?: string;
  time_zone?: string;
  phone?: string;
}

interface TournamentAdminAssignment {
  tournament_id: string;
  tournament_name: string;
}

interface OrganizationAdminAssignment {
  organization_id: string;
  organization_name: string;
  role: 'admin' | 'owner';
}

interface AdminScope {
  tournamentAdmins: TournamentAdminAssignment[];
  organizationAdmins: OrganizationAdminAssignment[];
  accessibleTournamentIds: string[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  adminScope: AdminScope;
  isTournamentAdmin: (tournamentId: string) => boolean;
  isOrgAdmin: (orgId: string) => boolean;
  canAccessTournament: (tournamentId: string) => boolean;
  hasAnyAdminAccess: boolean;
  signUp: (email: string, password: string, userData?: { data: { first_name?: string; last_name?: string } }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const defaultAdminScope: AdminScope = {
  tournamentAdmins: [],
  organizationAdmins: [],
  accessibleTournamentIds: [],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function OptimizedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const queryClient = useQueryClient();

  // Fast-path: Check localStorage for existing session before making any queries
  // This defers expensive queries for anonymous users
  const hasStoredSession = useMemo(() => {
    try {
      const stored = localStorage.getItem('sb-kiummwyxeleejbwapssa-auth-token');
      return !!stored;
    } catch {
      return false;
    }
  }, []);

  // Query for profile data with React Query - ONLY if we have a confirmed user
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role', { ascending: true })
        .limit(1)
        .single();
      
      return {
        ...profileData,
        role: roleData?.role || 'user'
      } as Profile;
    },
    enabled: !!user?.id && hasCheckedSession,
    staleTime: 10 * 60 * 1000,
  });

  // Query for admin scope (tournament and organization admin assignments) - ONLY if confirmed user
  const { data: adminScope } = useQuery({
    queryKey: ['adminScope', user?.id],
    queryFn: async (): Promise<AdminScope> => {
      if (!user?.id) return defaultAdminScope;

      // Batch fetch tournament and organization admin assignments
      const [tournamentAdminsResult, orgAdminsResult] = await Promise.all([
        supabase
          .from('tournament_admins')
          .select(`tournament_id, tournaments!inner(name)`)
          .eq('user_id', user.id),
        supabase
          .from('organization_admins')
          .select(`organization_id, role, organizations!inner(name)`)
          .eq('user_id', user.id)
      ]);

      const tournamentAdmins = tournamentAdminsResult.data || [];
      const orgAdmins = orgAdminsResult.data || [];

      // Get tournaments belonging to user's organizations
      const orgIds = orgAdmins.map(oa => oa.organization_id);
      let orgTournaments: string[] = [];
      
      if (orgIds.length > 0) {
        const { data: orgTourneyData } = await supabase
          .from('tournaments')
          .select('id')
          .in('organization_id', orgIds);
        
        orgTournaments = (orgTourneyData || []).map(t => t.id);
      }

      // Combine accessible tournament IDs
      const directTournamentIds = tournamentAdmins.map(ta => ta.tournament_id);
      const accessibleTournamentIds = [...new Set([...directTournamentIds, ...orgTournaments])];

      return {
        tournamentAdmins: tournamentAdmins.map(ta => ({
          tournament_id: ta.tournament_id,
          tournament_name: (ta.tournaments as any)?.name || 'Unknown',
        })),
        organizationAdmins: orgAdmins.map(oa => ({
          organization_id: oa.organization_id,
          organization_name: (oa.organizations as any)?.name || 'Unknown',
          role: oa.role as 'admin' | 'owner',
        })),
        accessibleTournamentIds,
      };
    },
    enabled: !!user?.id && hasCheckedSession,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setHasCheckedSession(true);
        
        if (!session?.user) {
          queryClient.setQueryData(['profile', null], null);
          queryClient.setQueryData(['adminScope', null], defaultAdminScope);
        }
        
        setLoading(false);
      }
    );

    // Fast path: If no stored session, mark as checked immediately without making any API calls
    if (!hasStoredSession) {
      setHasCheckedSession(true);
      setLoading(false);
    } else {
      // Only call getSession if we might have a stored session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setHasCheckedSession(true);
        setLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, [queryClient, hasStoredSession]);

  const signUp = useCallback(async (email: string, password: string, userData?: { data: { first_name?: string; last_name?: string } }) => {
    // Use production URL to avoid localhost redirect issues
    // Fallback to origin for deployed environments
    const redirectUrl = window.location.origin.includes('localhost') 
      ? 'https://kiummwyxeleejbwapssa.lovable.app/'
      : `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData?.data
      }
    });
    
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Clear query cache first to prevent stale data
      queryClient.clear();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Explicitly clear localStorage as backup
      localStorage.removeItem('sb-kiummwyxeleejbwapssa-auth-token');
      
      // Reset state immediately
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error during sign out:', error);
      // Force clear even on error
      localStorage.removeItem('sb-kiummwyxeleejbwapssa-auth-token');
      setUser(null);
      setSession(null);
    }
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['adminScope', user.id] });
    }
  }, [user?.id, queryClient]);

  const isAdmin = useMemo(() => profile?.role === 'admin', [profile?.role]);
  
  const currentAdminScope = adminScope || defaultAdminScope;

  const isTournamentAdmin = useCallback((tournamentId: string) => {
    if (isAdmin) return true;
    return currentAdminScope.accessibleTournamentIds.includes(tournamentId);
  }, [isAdmin, currentAdminScope.accessibleTournamentIds]);

  const isOrgAdmin = useCallback((orgId: string) => {
    if (isAdmin) return true;
    return currentAdminScope.organizationAdmins.some(oa => oa.organization_id === orgId);
  }, [isAdmin, currentAdminScope.organizationAdmins]);

  const canAccessTournament = useCallback((tournamentId: string) => {
    if (isAdmin) return true;
    return currentAdminScope.accessibleTournamentIds.includes(tournamentId);
  }, [isAdmin, currentAdminScope.accessibleTournamentIds]);

  const hasAnyAdminAccess = useMemo(() => {
    return isAdmin || currentAdminScope.accessibleTournamentIds.length > 0;
  }, [isAdmin, currentAdminScope.accessibleTournamentIds]);

  const value = useMemo(() => ({
    user,
    session,
    profile: profile || null,
    loading,
    isAdmin,
    adminScope: currentAdminScope,
    isTournamentAdmin,
    isOrgAdmin,
    canAccessTournament,
    hasAnyAdminAccess,
    signUp,
    signIn,
    signOut,
    refreshUser,
  }), [user, session, profile, loading, isAdmin, currentAdminScope, isTournamentAdmin, isOrgAdmin, canAccessTournament, hasAnyAdminAccess, signUp, signIn, signOut, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useOptimizedAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useOptimizedAuth must be used within an OptimizedAuthProvider');
  }
  return context;
}

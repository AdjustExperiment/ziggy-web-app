import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { toast } from '@/components/ui/use-toast';

export interface DebateTeam {
  id: string;
  name: string;
  school_organization: string | null;
  description: string | null;
  logo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  is_active: boolean;
  profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export interface TeamEvent {
  id: string;
  team_id: string;
  title: string;
  description: string | null;
  event_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  location: string | null;
  is_virtual: boolean;
  created_at: string;
}

export interface TeamAchievement {
  id: string;
  team_id: string;
  tournament_id: string | null;
  achievement_type: string;
  position: string | null;
  prize_amount: number | null;
  achieved_at: string | null;
  members: any;
  tournament?: {
    name: string;
  };
}

export interface TeamStats {
  totalMembers: number;
  totalTournaments: number;
  totalWins: number;
  winRate: number;
}

export function useTeam() {
  const { user } = useOptimizedAuth();
  const [myTeam, setMyTeam] = useState<DebateTeam | null>(null);
  const [myMembership, setMyMembership] = useState<TeamMembership | null>(null);
  const [members, setMembers] = useState<TeamMembership[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [achievements, setAchievements] = useState<TeamAchievement[]>([]);
  const [stats, setStats] = useState<TeamStats>({ totalMembers: 0, totalTournaments: 0, totalWins: 0, winRate: 0 });
  const [loading, setLoading] = useState(true);
  const [allTeams, setAllTeams] = useState<DebateTeam[]>([]);

  const fetchMyTeam = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First get user's membership
      const { data: membershipData, error: membershipError } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        console.error('Error fetching membership:', membershipError);
      }

      if (membershipData) {
        setMyMembership(membershipData);

        // Fetch the team
        const { data: teamData, error: teamError } = await supabase
          .from('debate_teams')
          .select('*')
          .eq('id', membershipData.team_id)
          .single();

        if (teamError) throw teamError;
        setMyTeam(teamData);

        // Fetch team members with profiles
        await fetchTeamMembers(membershipData.team_id);
        await fetchTeamEvents(membershipData.team_id);
        await fetchTeamAchievements(membershipData.team_id);
        await calculateStats(membershipData.team_id);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTeamMembers = async (teamId: string) => {
    const { data, error } = await supabase
      .from('team_memberships')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_active', true);

    if (!error && data) {
      // Fetch profiles separately
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const membersWithProfiles = data.map(m => ({
        ...m,
        profile: profiles?.find(p => p.user_id === m.user_id) || undefined
      }));
      
      setMembers(membersWithProfiles);
    } else {
      setMembers(data || []);
    }
  };

  const fetchTeamEvents = async (teamId: string) => {
    const { data, error } = await supabase
      .from('team_events')
      .select('*')
      .eq('team_id', teamId)
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .limit(10);

    if (!error) {
      setEvents(data || []);
    }
  };

  const fetchTeamAchievements = async (teamId: string) => {
    const { data, error } = await supabase
      .from('team_achievements')
      .select(`
        *,
        tournament:tournaments(name)
      `)
      .eq('team_id', teamId)
      .order('achieved_at', { ascending: false })
      .limit(10);

    if (!error) {
      setAchievements(data || []);
    }
  };

  const calculateStats = async (teamId: string) => {
    // Get member count
    const { count: memberCount } = await supabase
      .from('team_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('is_active', true);

    // Get tournament participation from registrations
    const { data: registrations } = await supabase
      .from('tournament_registrations')
      .select('id, tournament_id')
      .eq('team_id', teamId);

    const uniqueTournaments = new Set(registrations?.map(r => r.tournament_id) || []);

    // Get wins from achievements
    const { data: wins } = await supabase
      .from('team_achievements')
      .select('id')
      .eq('team_id', teamId)
      .eq('achievement_type', 'win');

    const totalTournaments = uniqueTournaments.size;
    const totalWins = wins?.length || 0;

    setStats({
      totalMembers: memberCount || 0,
      totalTournaments,
      totalWins,
      winRate: totalTournaments > 0 ? (totalWins / totalTournaments) * 100 : 0
    });
  };

  const fetchAllTeams = async () => {
    const { data, error } = await supabase
      .from('debate_teams')
      .select('*')
      .order('name');

    if (!error) {
      setAllTeams(data || []);
    }
  };

  const createTeam = async (name: string, schoolOrganization?: string, description?: string) => {
    if (!user) return null;

    try {
      const { data: team, error: teamError } = await supabase
        .from('debate_teams')
        .insert({
          name,
          school_organization: schoolOrganization || null,
          description: description || null,
          created_by: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as captain
      const { error: memberError } = await supabase
        .from('team_memberships')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'captain'
        });

      if (memberError) throw memberError;

      toast({
        title: 'Team Created',
        description: `${name} has been created successfully.`
      });

      await fetchMyTeam();
      return team;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create team',
        variant: 'destructive'
      });
      return null;
    }
  };

  const joinTeam = async (teamId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('team_memberships')
        .insert({
          team_id: teamId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: 'Joined Team',
        description: 'You have successfully joined the team.'
      });

      await fetchMyTeam();
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join team',
        variant: 'destructive'
      });
      return false;
    }
  };

  const leaveTeam = async () => {
    if (!user || !myMembership) return false;

    try {
      const { error } = await supabase
        .from('team_memberships')
        .delete()
        .eq('id', myMembership.id);

      if (error) throw error;

      toast({
        title: 'Left Team',
        description: 'You have left the team.'
      });

      setMyTeam(null);
      setMyMembership(null);
      setMembers([]);
      setEvents([]);
      setAchievements([]);
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to leave team',
        variant: 'destructive'
      });
      return false;
    }
  };

  const createEvent = async (event: Omit<TeamEvent, 'id' | 'team_id' | 'created_at'>) => {
    if (!myTeam) return null;

    try {
      const { data, error } = await supabase
        .from('team_events')
        .insert({
          ...event,
          team_id: myTeam.id,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Event Created',
        description: `${event.title} has been scheduled.`
      });

      await fetchTeamEvents(myTeam.id);
      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create event',
        variant: 'destructive'
      });
      return null;
    }
  };

  useEffect(() => {
    fetchMyTeam();
    fetchAllTeams();
  }, [fetchMyTeam]);

  const isTeamLead = myMembership?.role === 'captain' || myMembership?.role === 'coach';

  return {
    myTeam,
    myMembership,
    members,
    events,
    achievements,
    stats,
    loading,
    allTeams,
    isTeamLead,
    createTeam,
    joinTeam,
    leaveTeam,
    createEvent,
    refresh: fetchMyTeam
  };
}
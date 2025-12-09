import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
}

interface TournamentAnnouncementsProps {
  tournamentId: string;
}

export function TournamentAnnouncements({ tournamentId }: TournamentAnnouncementsProps) {
  const { user } = useOptimizedAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    checkAccessAndFetch();

    // Real-time subscription for new announcements
    const channel = supabase
      .channel('tournament-announcements')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_content',
        filter: `tournament_id=eq.${tournamentId}`
      }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, user]);

  const checkAccessAndFetch = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user is a participant (registered for the tournament)
      const { data: registration } = await supabase
        .from('tournament_registrations')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (registration) {
        setHasAccess(true);
        await fetchAnnouncements();
        return;
      }

      // Check if user is an admin-assigned observer
      const { data: observerRecord } = await supabase
        .from('tournament_observers')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (observerRecord) {
        setHasAccess(true);
        await fetchAnnouncements();
        return;
      }

      // Check if user has any approved spectate requests for pairings in this tournament
      const { data: spectateRequests } = await supabase
        .from('spectate_requests')
        .select(`
          id,
          pairings!inner (
            tournament_id
          )
        `)
        .eq('status', 'approved')
        .eq('requester_user_id', user.id);

      const hasSpectateAccess = spectateRequests?.some(
        (req: any) => req.pairings?.tournament_id === tournamentId
      );

      if (hasSpectateAccess) {
        setHasAccess(true);
        await fetchAnnouncements();
        return;
      }

      // Check if user is a judge assigned to this tournament
      const { data: judgeProfile } = await supabase
        .from('judge_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (judgeProfile) {
        const { data: judgeAssignment } = await supabase
          .from('pairings')
          .select('id')
          .eq('tournament_id', tournamentId)
          .eq('judge_id', judgeProfile.id)
          .limit(1)
          .maybeSingle();

        if (judgeAssignment) {
          setHasAccess(true);
          await fetchAnnouncements();
          return;
        }
      }

      // Check if user is admin
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (adminRole) {
        setHasAccess(true);
        await fetchAnnouncements();
        return;
      }

      // No access
      setHasAccess(false);
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_content')
        .select('announcements')
        .eq('tournament_id', tournamentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.announcements && Array.isArray(data.announcements)) {
        // Sort by created_at descending and cast properly
        const announcementsArray = data.announcements as unknown as Announcement[];
        const sorted = [...announcementsArray].sort((a, b) => 
          new Date(b.created_at || 0).getTime() - 
          new Date(a.created_at || 0).getTime()
        );
        setAnnouncements(sorted.slice(0, 5)); // Show latest 5
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  if (loading) {
    return null;
  }

  if (!hasAccess || announcements.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Megaphone className="h-5 w-5" />
          Tournament Announcements
        </CardTitle>
        <CardDescription>Latest updates from tournament administrators</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {announcements.map((announcement, index) => (
          <div 
            key={announcement.id || index} 
            className="p-3 bg-muted/50 rounded-lg border"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-medium text-sm">{announcement.title}</h4>
              {announcement.type && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {announcement.type}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{announcement.content}</p>
            {announcement.created_at && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
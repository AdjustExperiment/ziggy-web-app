import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();

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
  }, [tournamentId]);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_content')
        .select('announcements')
        .eq('tournament_id', tournamentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.announcements && Array.isArray(data.announcements)) {
        // Sort by created_at descending and cast properly
        const announcementsArray = data.announcements as unknown as Announcement[];
        const sorted = [...announcementsArray].sort((a, b) => 
          new Date(a.created_at || 0).getTime() - 
          new Date(b.created_at || 0).getTime()
        ).reverse();
        setAnnouncements(sorted.slice(0, 5)); // Show latest 5
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (announcements.length === 0) {
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
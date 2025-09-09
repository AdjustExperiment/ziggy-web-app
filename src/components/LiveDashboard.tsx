import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatPanel } from '@/components/ChatPanel';

interface LiveDashboardProps {
  tournamentId: string;
}

interface RoleAccess {
  can_view_pairings: boolean;
  can_view_rooms: boolean;
  can_view_stream: boolean;
  can_chat: boolean;
}

export function LiveDashboard({ tournamentId }: LiveDashboardProps) {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<RoleAccess | null>(null);
  const [pairings, setPairings] = useState<any[]>([]);
  const [tournament, setTournament] = useState<any>(null);

  useEffect(() => {
    fetchPermissions();
  }, [profile?.role]);

  useEffect(() => {
    if (permissions?.can_view_pairings) {
      fetchPairings();
    }
    fetchTournament();
  }, [permissions, tournamentId]);

  const fetchPermissions = async () => {
    const role = profile?.role || 'user';
    const { data } = await supabase
      .from('role_access_settings')
      .select('can_view_pairings, can_view_rooms, can_view_stream, can_chat')
      .eq('role', role)
      .single();
    setPermissions(data as RoleAccess | null);
  };

  const fetchTournament = async () => {
    const { data } = await supabase
      .from('tournaments')
      .select('id, name, live_stream_url')
      .eq('id', tournamentId)
      .single();
    setTournament(data);
  };

  const fetchPairings = async () => {
    const { data } = await supabase
      .from('pairings')
      .select(`id, room, scheduled_time, round:rounds(name),
        aff_registration:tournament_registrations!aff_registration_id(participant_name),
        neg_registration:tournament_registrations!neg_registration_id(participant_name)`)
      .eq('tournament_id', tournamentId)
      .eq('released', true)
      .order('round_id')
      .order('room');
    setPairings(data || []);
  };

  if (!permissions) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {permissions.can_view_stream && tournament?.live_stream_url && (
        <Card>
          <CardHeader>
            <CardTitle>Live Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video">
              <iframe
                src={tournament.live_stream_url}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </CardContent>
        </Card>
      )}

      {permissions.can_view_pairings && (
        <Card>
          <CardHeader>
            <CardTitle>Live Pairings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pairings.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.round?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {p.aff_registration?.participant_name} vs {p.neg_registration?.participant_name}
                  </div>
                </div>
                {permissions.can_view_rooms && (
                  <div className="text-sm">
                    {p.room || 'TBD'}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {permissions.can_chat && <ChatPanel tournamentId={tournamentId} />}
    </div>
  );
}


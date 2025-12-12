import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentRoleAccessManager } from './TournamentRoleAccessManager';
import { TabulationSettingsManager } from './TabulationSettingsManager';
import { TournamentBallotRevealSettings } from './TournamentBallotRevealSettings';
import { TournamentModeSettings } from './TournamentModeSettings';
import { VenueManager } from './VenueManager';
import { supabase } from '@/integrations/supabase/client';

interface TournamentSettingsManagerProps {
  tournamentId: string;
}

export function TournamentSettingsManager({ tournamentId }: TournamentSettingsManagerProps) {
  const [venueManagementEnabled, setVenueManagementEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('venue_management_enabled, is_online')
        .eq('id', tournamentId)
        .single();

      if (data) {
        setVenueManagementEnabled(data.venue_management_enabled ?? false);
        setIsOnline(data.is_online ?? true);
      }
    };
    fetchSettings();

    // Subscribe to changes
    const channel = supabase
      .channel(`tournament-settings-${tournamentId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tournaments',
        filter: `id=eq.${tournamentId}`
      }, (payload) => {
        setVenueManagementEnabled(payload.new.venue_management_enabled ?? false);
        setIsOnline(payload.new.is_online ?? true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const showVenueTab = !isOnline && venueManagementEnabled;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Tournament Settings</h3>
        <p className="text-muted-foreground">Configure tournament-specific settings and permissions</p>
      </div>

      <Tabs defaultValue="mode" className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="mode">Tournament Mode</TabsTrigger>
          <TabsTrigger value="access">Role Access</TabsTrigger>
          <TabsTrigger value="ballot-reveal">Ballot Reveal</TabsTrigger>
          <TabsTrigger value="tabulation">Tabulation</TabsTrigger>
          {showVenueTab && <TabsTrigger value="venues">Venues</TabsTrigger>}
        </TabsList>

        <TabsContent value="mode">
          <TournamentModeSettings tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="access">
          <TournamentRoleAccessManager tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="ballot-reveal">
          <TournamentBallotRevealSettings tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="tabulation">
          <TabulationSettingsManager tournamentId={tournamentId} />
        </TabsContent>

        {showVenueTab && (
          <TabsContent value="venues">
            <VenueManager tournamentId={tournamentId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
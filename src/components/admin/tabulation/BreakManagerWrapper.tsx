import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BreakManager } from './BreakManager';
import { TeamStanding } from '@/lib/tabulation/breakGenerator';
import { Card, CardContent } from '@/components/ui/card';

interface BreakManagerWrapperProps {
  tournamentId: string;
  registrations: any[];
}

export function BreakManagerWrapper({ tournamentId, registrations }: BreakManagerWrapperProps) {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandings();
  }, [tournamentId, registrations]);

  const fetchStandings = async () => {
    try {
      setLoading(true);
      
      // Calculate standings from ballots
      const { data: ballots } = await supabase
        .from('ballots')
        .select(`
          pairing_id,
          payload,
          pairings!inner(
            aff_registration_id,
            neg_registration_id,
            tournament_id
          )
        `)
        .eq('pairings.tournament_id', tournamentId)
        .eq('status', 'submitted');

      // Build standings map
      const teamStats = new Map<string, { wins: number; speaks: number; rounds: number }>();

      for (const reg of registrations) {
        teamStats.set(reg.id, { wins: 0, speaks: 0, rounds: 0 });
      }

      if (ballots) {
        for (const ballot of ballots) {
          const payload = ballot.payload as any;
          const winner = payload?.winner;
          const affId = ballot.pairings?.aff_registration_id;
          const negId = ballot.pairings?.neg_registration_id;

          if (affId) {
            const stats = teamStats.get(affId);
            if (stats) {
              stats.rounds++;
              if (winner === 'aff') stats.wins++;
              stats.speaks += parseFloat(payload?.aff_speaks) || 0;
            }
          }
          if (negId) {
            const stats = teamStats.get(negId);
            if (stats) {
              stats.rounds++;
              if (winner === 'neg') stats.wins++;
              stats.speaks += parseFloat(payload?.neg_speaks) || 0;
            }
          }
        }
      }

      // Convert to standings array
      const standingsArray: TeamStanding[] = registrations.map((reg, index) => {
        const stats = teamStats.get(reg.id) || { wins: 0, speaks: 0, rounds: 0 };
        return {
          teamId: reg.id,
          teamName: reg.participant_name,
          institution: reg.school_organization || 'Independent',
          wins: stats.wins,
          speaks: stats.speaks,
          oppStrength: 0, // Will be calculated properly if needed
          rank: 0, // Will be calculated
        };
      });

      // Sort and assign ranks
      standingsArray.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.speaks - a.speaks;
      });

      standingsArray.forEach((team, index) => {
        team.rank = index + 1;
      });

      setStandings(standingsArray);
    } catch (error) {
      console.error('Error fetching standings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <BreakManager
      tournamentId={tournamentId}
      standings={standings}
      onRefreshStandings={fetchStandings}
    />
  );
}

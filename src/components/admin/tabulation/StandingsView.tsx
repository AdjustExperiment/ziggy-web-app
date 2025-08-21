import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { Registration } from '@/types/database';

interface StandingsViewProps {
  tournamentId: string;
  registrations: Registration[];
}

interface TeamStanding {
  id: string;
  name: string;
  school: string;
  wins: number;
  losses: number;
  ballots: number;
  speakers: number;
  rank: number;
}

export function StandingsView({ tournamentId, registrations }: StandingsViewProps) {
  const [standings, setStandings] = useState<TeamStanding[]>([]);

  useEffect(() => {
    // Mock standings data for now
    const mockStandings: TeamStanding[] = registrations.map((reg, index) => ({
      id: reg.id,
      name: reg.participant_name,
      school: reg.school_organization || 'Independent',
      wins: Math.floor(Math.random() * 6),
      losses: Math.floor(Math.random() * 3),
      ballots: Math.floor(Math.random() * 12),
      speakers: Math.floor(Math.random() * 300) + 200,
      rank: index + 1
    })).sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.ballots !== b.ballots) return b.ballots - a.ballots;
      return b.speakers - a.speakers;
    }).map((standing, index) => ({
      ...standing,
      rank: index + 1
    }));

    setStandings(mockStandings);
  }, [registrations]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2: return <Medal className="h-4 w-4 text-gray-400" />;
      case 3: return <Award className="h-4 w-4 text-amber-600" />;
      default: return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tournament Standings
          </CardTitle>
          <CardDescription>
            Current team rankings based on wins, ballots, and speaker points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {standings.map((team) => (
              <Card key={team.id} className="border-l-4 border-l-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[60px]">
                        {getRankIcon(team.rank)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">{team.school}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-green-600">{team.wins}</p>
                        <p className="text-muted-foreground">Wins</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-red-600">{team.losses}</p>
                        <p className="text-muted-foreground">Losses</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{team.ballots}</p>
                        <p className="text-muted-foreground">Ballots</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{team.speakers}</p>
                        <p className="text-muted-foreground">Speakers</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
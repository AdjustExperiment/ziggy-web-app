
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Mail, Phone, Search, Trophy, Users, MessageCircle } from 'lucide-react';
import { Registration } from '@/types/database';

interface CompetitorStats {
  totalSpeaks: number;
  hiLo: number;
  wins: number;
  losses: number;
  affRounds: number;
  negRounds: number;
  opponents: string[];
}

interface CompetitorDirectoryProps {
  tournamentId: string;
  registrations: Registration[];
}

export function CompetitorDirectory({ tournamentId, registrations }: CompetitorDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [competitorStats, setCompetitorStats] = useState<Map<string, CompetitorStats>>(new Map());
  const [loading, setLoading] = useState(false);

  const filteredRegistrations = registrations.filter(reg =>
    reg.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reg.school_organization && reg.school_organization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (tournamentId) {
      fetchCompetitorStats();
    }
  }, [tournamentId]);

  const fetchCompetitorStats = async () => {
    setLoading(true);
    try {
      // Fetch all pairings and ballots for this tournament
      const { data: pairings, error: pairingsError } = await supabase
        .from('pairings')
        .select(`
          *,
          ballots(*),
          aff_registration:tournament_registrations!aff_registration_id(id, participant_name),
          neg_registration:tournament_registrations!neg_registration_id(id, participant_name)
        `)
        .eq('tournament_id', tournamentId);

      if (pairingsError) throw pairingsError;

      const stats = new Map<string, CompetitorStats>();

      // Initialize stats for all registrations
      registrations.forEach(reg => {
        stats.set(reg.id, {
          totalSpeaks: 0,
          hiLo: 0,
          wins: 0,
          losses: 0,
          affRounds: 0,
          negRounds: 0,
          opponents: []
        });
      });

      // Process pairings and ballots
      pairings?.forEach(pairing => {
        const affId = pairing.aff_registration_id;
        const negId = pairing.neg_registration_id;

        // Track opponents
        const affStats = stats.get(affId);
        const negStats = stats.get(negId);

        if (affStats && pairing.neg_registration?.participant_name) {
          affStats.opponents.push(pairing.neg_registration.participant_name);
          affStats.affRounds++;
        }

        if (negStats && pairing.aff_registration?.participant_name) {
          negStats.opponents.push(pairing.aff_registration.participant_name);
          negStats.negRounds++;
        }

        // Process ballots for speaker points and wins
        const ballots = Array.isArray(pairing.ballots) ? pairing.ballots : [];
        ballots.forEach((ballot: any) => {
          if (ballot.is_published && ballot.payload) {
            const winner = ballot.payload.winner;
            const affSpeaks = ballot.payload.aff_speaker_points || 0;
            const negSpeaks = ballot.payload.neg_speaker_points || 0;

            if (affStats) {
              affStats.totalSpeaks += affSpeaks;
              if (winner === 'aff') affStats.wins++;
              else if (winner === 'neg') affStats.losses++;
            }

            if (negStats) {
              negStats.totalSpeaks += negSpeaks;
              if (winner === 'neg') negStats.wins++;
              else if (winner === 'aff') negStats.losses++;
            }
          }
        });
      });

      setCompetitorStats(stats);
    } catch (error: any) {
      console.error('Error fetching competitor stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch competitor statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (registration: Registration, message: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-registration-email', {
        body: {
          to: registration.participant_email,
          subject: 'Tournament Notification',
          templateKey: 'custom_notification',
          templateData: {
            participant_name: registration.participant_name,
            message: message,
            tournament_id: tournamentId
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Notification sent to ${registration.participant_name}`,
      });
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Competitor Directory
          </CardTitle>
          <CardDescription>
            View competitor information, contact details, and performance statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search competitors or schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={fetchCompetitorStats}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
              ) : (
                <Trophy className="h-4 w-4 mr-2" />
              )}
              Refresh Stats
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredRegistrations.map(registration => {
              const stats = competitorStats.get(registration.id);
              return (
                <Card key={registration.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{registration.participant_name}</h3>
                        {registration.partner_name && (
                          <p className="text-sm text-muted-foreground">
                            Partner: {registration.partner_name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {registration.school_organization || 'Independent'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={registration.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {registration.payment_status}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Contact Info</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span>{registration.participant_email}</span>
                          </div>
                          {registration.emergency_contact && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{registration.emergency_contact}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            const message = prompt('Enter notification message:');
                            if (message) sendNotification(registration, message);
                          }}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Notify
                        </Button>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Tournament Stats</h4>
                        {stats ? (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Speaks: <strong>{stats.totalSpeaks}</strong></div>
                            <div>Hi/Lo: <strong>{stats.hiLo}</strong></div>
                            <div>Record: <strong>{stats.wins}-{stats.losses}</strong></div>
                            <div>Sides: <strong>{stats.affRounds}A/{stats.negRounds}N</strong></div>
                            <div className="col-span-2">
                              <strong>Opponents:</strong>
                              <div className="text-xs text-muted-foreground mt-1">
                                {stats.opponents.length > 0 
                                  ? stats.opponents.join(', ')
                                  : 'No rounds yet'
                                }
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Loading stats...</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredRegistrations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No competitors found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

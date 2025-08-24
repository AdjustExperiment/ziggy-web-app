
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle, Clock, Plus, Minus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Round {
  id: string;
  name: string;
  round_number: number;
  status: string;
  scheduled_date: string | null;
}

interface OptOut {
  id: string;
  round_id: string;
  reason: string | null;
}

interface ExtraRoundRequest {
  id: string;
  round_id: string;
  status: string;
  note: string | null;
}

interface RoundOptOutManagerProps {
  tournamentId: string;
  registrationId: string;
  optOutsEnabled: boolean;
}

export function RoundOptOutManager({ tournamentId, registrationId, optOutsEnabled }: RoundOptOutManagerProps) {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [optOuts, setOptOuts] = useState<OptOut[]>([]);
  const [extraRoundRequests, setExtraRoundRequests] = useState<ExtraRoundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId && registrationId && optOutsEnabled) {
      fetchData();
    }
  }, [tournamentId, registrationId, optOutsEnabled]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch rounds
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number');

      if (roundsError) throw roundsError;

      // Fetch existing opt-outs
      const { data: optOutsData, error: optOutsError } = await supabase
        .from('round_opt_outs')
        .select('*')
        .eq('registration_id', registrationId);

      if (optOutsError) throw optOutsError;

      // Fetch extra round requests
      const { data: extraRequestsData, error: extraRequestsError } = await supabase
        .from('extra_round_requests')
        .select('*')
        .eq('registration_id', registrationId);

      if (extraRequestsError) throw extraRequestsError;

      setRounds(roundsData || []);
      setOptOuts(optOutsData || []);
      setExtraRoundRequests(extraRequestsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load round participation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleOptOut = async (roundId: string, reason?: string) => {
    const existingOptOut = optOuts.find(opt => opt.round_id === roundId);
    setSubmitting(roundId);

    try {
      if (existingOptOut) {
        // Remove opt-out
        const { error } = await supabase
          .from('round_opt_outs')
          .delete()
          .eq('id', existingOptOut.id);

        if (error) throw error;

        setOptOuts(prev => prev.filter(opt => opt.id !== existingOptOut.id));
        toast({
          title: "Success",
          description: "You are now participating in this round",
        });
      } else {
        // Add opt-out
        const { data, error } = await supabase
          .from('round_opt_outs')
          .insert({
            tournament_id: tournamentId,
            round_id: roundId,
            registration_id: registrationId,
            reason: reason || null
          })
          .select()
          .single();

        if (error) throw error;

        setOptOuts(prev => [...prev, data]);
        toast({
          title: "Success",
          description: "You have opted out of this round",
        });
      }
    } catch (error: any) {
      console.error('Error toggling opt-out:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update round participation",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const toggleExtraRoundRequest = async (roundId: string, note?: string) => {
    const existingRequest = extraRoundRequests.find(req => req.round_id === roundId);
    setSubmitting(roundId);

    try {
      if (existingRequest) {
        // Remove request
        const { error } = await supabase
          .from('extra_round_requests')
          .delete()
          .eq('id', existingRequest.id);

        if (error) throw error;

        setExtraRoundRequests(prev => prev.filter(req => req.id !== existingRequest.id));
        toast({
          title: "Success",
          description: "Extra round request withdrawn",
        });
      } else {
        // Add request
        const { data, error } = await supabase
          .from('extra_round_requests')
          .insert({
            tournament_id: tournamentId,
            round_id: roundId,
            registration_id: registrationId,
            note: note || null,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;

        setExtraRoundRequests(prev => [...prev, data]);
        toast({
          title: "Success",
          description: "Extra round request submitted",
        });
      }
    } catch (error: any) {
      console.error('Error toggling extra round request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update extra round request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  if (!optOutsEnabled) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Round opt-outs are not enabled for this tournament.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Round Participation</CardTitle>
        <CardDescription>
          Manage your participation in tournament rounds. You can opt out of rounds you cannot attend or request to join extra rounds if spots become available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rounds.map(round => {
            const isOptedOut = optOuts.some(opt => opt.round_id === round.id);
            const extraRequest = extraRoundRequests.find(req => req.round_id === round.id);
            const isSubmittingThisRound = submitting === round.id;

            return (
              <div key={round.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{round.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {round.scheduled_date 
                        ? `Scheduled: ${new Date(round.scheduled_date).toLocaleDateString()}`
                        : 'Date TBD'
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Opt-out status */}
                    {isOptedOut ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Minus className="h-3 w-3" />
                        Opted Out
                      </Badge>
                    ) : (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Participating
                      </Badge>
                    )}

                    {/* Extra round request status */}
                    {extraRequest && (
                      <Badge 
                        variant={extraRequest.status === 'accepted' ? 'default' : 'secondary'}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Extra Request: {extraRequest.status}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant={isOptedOut ? "default" : "destructive"}
                    onClick={() => {
                      if (!isOptedOut) {
                        const reason = prompt('Reason for opting out (optional):');
                        if (reason !== null) { // User didn't cancel
                          toggleOptOut(round.id, reason);
                        }
                      } else {
                        toggleOptOut(round.id);
                      }
                    }}
                    disabled={isSubmittingThisRound}
                  >
                    {isOptedOut ? 'Rejoin Round' : 'Opt Out'}
                  </Button>

                  <Button
                    size="sm"
                    variant={extraRequest ? "default" : "outline"}
                    onClick={() => {
                      if (!extraRequest) {
                        const note = prompt('Note for extra round request (optional):');
                        if (note !== null) { // User didn't cancel
                          toggleExtraRoundRequest(round.id, note);
                        }
                      } else {
                        toggleExtraRoundRequest(round.id);
                      }
                    }}
                    disabled={isSubmittingThisRound}
                  >
                    {extraRequest ? 'Withdraw Request' : 'Request Extra Spot'}
                  </Button>
                </div>
              </div>
            );
          })}

          {rounds.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No rounds have been created for this tournament yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

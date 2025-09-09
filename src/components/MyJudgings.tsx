
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Gavel, FileText, Lock, Eye } from 'lucide-react';
import { BallotEntry } from './BallotEntry';

interface JudgeAssignment {
  id: string;
  tournament_name: string;
  round_name: string;
  room: string;
  scheduled_time?: string;
  aff_participant: string;
  neg_participant: string;
  role: string;
  ballot_id?: string;
  ballot_status?: string;
  ballot_submitted?: boolean;
  ballot_locked?: boolean;
}

interface PairingRow {
  id: string;
  tournaments?: { name?: string } | null;
  round?: { name?: string } | null;
  room?: string | null;
  scheduled_time?: string | null;
  aff_registration?: { participant_name?: string } | null;
  neg_registration?: { participant_name?: string } | null;
  ballots?: { id: string; status?: string }[] | null;
}

export function MyJudgings() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPairing, setSelectedPairing] = useState<JudgeAssignment | null>(null);
  const [judgeProfileId, setJudgeProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyAssignments();
    }
  }, [user, fetchMyAssignments]);

  // Subscribe to assignment and ballot changes
  useEffect(() => {
    if (!judgeProfileId) return;

    const channel = supabase
      .channel(`judge-assignments-${judgeProfileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pairings',
          filter: `judge_id=eq.${judgeProfileId}`,
        },
        () => {
          fetchMyAssignments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ballots',
          filter: `judge_profile_id=eq.${judgeProfileId}`,
        },
        () => {
          fetchMyAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [judgeProfileId, fetchMyAssignments]);

  const fetchMyAssignments = useCallback(async () => {
    if (!user) return;

    try {
      // Check if user has a judge profile
      const { data: judgeProfile, error: judgeError } = await supabase
        .from('judge_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (judgeError && judgeError.code !== 'PGRST116') {
        console.error('Error fetching judge profile:', judgeError);
        setAssignments([]);
        return;
      }

      if (!judgeProfile) {
        // User is not a judge
        setAssignments([]);
        setJudgeProfileId(null);
        return;
      }

      setJudgeProfileId(judgeProfile.id);

      // Fetch pairings where user is assigned as judge with ballot info
      const { data: pairingsData, error: pairingsError } = await supabase
        .from('pairings')
        .select(`
          id,
          tournament_id,
          round_id,
          aff_registration_id,
          neg_registration_id,
          judge_id,
          room,
          scheduled_time,
          released,
          status,
          result,
          created_at,
          updated_at,
          aff_registration:tournament_registrations!aff_registration_id(participant_name, participant_email),
          neg_registration:tournament_registrations!neg_registration_id(participant_name, participant_email),
          round:rounds(name),
          tournaments(name),
          judge_profiles(name, email),
          ballots(id, status, is_published)
        `)
        .eq('judge_id', judgeProfile.id)
        .order('created_at', { ascending: false });

      if (pairingsError) throw pairingsError;

      const pairings: PairingRow[] = (pairingsData as PairingRow[] | null) || [];

      // Transform pairings data to match JudgeAssignment interface
      const assignments: JudgeAssignment[] = pairings.map((pairing) => {
        const ballot = pairing.ballots?.[0]; // Get first ballot if exists
        return {
          id: pairing.id,
          tournament_name: pairing.tournaments?.name || 'Unknown Tournament',
          round_name: pairing.round?.name || 'Unknown Round',
          room: pairing.room || 'TBD',
          scheduled_time: pairing.scheduled_time || undefined,
          aff_participant: pairing.aff_registration?.participant_name || 'Unknown',
          neg_participant: pairing.neg_registration?.participant_name || 'Unknown',
          role: 'Judge',
          ballot_id: ballot?.id,
          ballot_status: ballot?.status || 'none',
          ballot_submitted: ballot?.status === 'submitted',
          ballot_locked: ballot?.status === 'submitted',
        };
      });

      setAssignments(assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load your judging assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const openBallot = (assignment: JudgeAssignment) => {
    setSelectedPairing(assignment);
  };

  const handleBallotSubmitted = () => {
    fetchMyAssignments(); // Refresh assignments
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Judging Assignments</h2>
        <p className="text-muted-foreground">
          View your assigned debates, submit ballots, and communicate with competitors
        </p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Judging Assignments</h3>
            <p className="text-muted-foreground">
              Your judging assignments will appear here once you are assigned to debates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => {
            const ballotSubmitted = assignment.ballot_submitted;
            const ballotLocked = assignment.ballot_locked;

            return (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Gavel className="h-5 w-5" />
                        {assignment.tournament_name} - {assignment.round_name}
                      </CardTitle>
                      <CardDescription>
                        Room: {assignment.room || 'TBD'} • Role: {assignment.role}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={ballotSubmitted ? 'default' : 'secondary'}>
                        {assignment.ballot_status === 'submitted' ? 'Ballot Submitted' : 
                         assignment.ballot_status === 'draft' ? 'Draft Saved' : 'Ballot Pending'}
                      </Badge>
                      {ballotLocked && (
                        <Badge variant="destructive">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {/* Participants */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">AFF</Badge>
                          <span className="font-medium">{assignment.aff_participant}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">NEG</Badge>
                          <span className="font-medium">{assignment.neg_participant}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Time */}
                    {assignment.scheduled_time && (
                      <div>
                        <div className="text-sm text-muted-foreground">Scheduled for:</div>
                        <div className="font-medium">
                          {new Date(assignment.scheduled_time).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBallot(assignment)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {assignment.ballot_status === 'submitted' ? 'View Ballot' : 'Enter Ballot'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Ballot Entry Dialog */}
      {selectedPairing && (
        <BallotEntry
          pairingId={selectedPairing.id}
          tournamentName={selectedPairing.tournament_name}
          roundName={selectedPairing.round_name}
          affParticipant={selectedPairing.aff_participant}
          negParticipant={selectedPairing.neg_participant}
          isOpen={!!selectedPairing}
          onClose={() => setSelectedPairing(null)}
          onBallotSubmitted={handleBallotSubmitted}
        />
      )}
    </div>
  );
}

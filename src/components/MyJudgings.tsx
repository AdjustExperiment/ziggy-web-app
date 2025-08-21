
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Gavel, MessageSquare, FileText, Lock, Eye } from 'lucide-react';
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

export function MyJudgings() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPairing, setSelectedPairing] = useState<JudgeAssignment | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyAssignments();
    }
  }, [user]);

  const fetchMyAssignments = async () => {
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
        return;
      }

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

      // Transform pairings data to match JudgeAssignment interface
      const assignments: JudgeAssignment[] = (pairingsData || []).map(pairing => {
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
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load your judging assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            <p className="text-sm text-muted-foreground mt-2">
              This feature is being set up and will be fully functional soon.
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

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Chat
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Pairing Chat</DialogTitle>
                            <DialogDescription>
                              Communicate with the competitors about scheduling and logistics
                            </DialogDescription>
                          </DialogHeader>
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p>Chat functionality is being set up and will be available soon.</p>
                          </div>
                        </DialogContent>
                      </Dialog>
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

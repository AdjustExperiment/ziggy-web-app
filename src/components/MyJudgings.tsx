
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Gavel, MessageSquare, FileText, Lock, Eye } from 'lucide-react';

interface JudgeAssignment {
  id: string;
  pairing_id: string;
  role: string;
  assigned_at: string;
  pairing: {
    id: string;
    room: string;
    scheduled_time: string;
    scheduling_status: string;
    aff_participant: { participant_name: string };
    neg_participant: { participant_name: string };
    round: { name: string };
    tournament: { name: string; ballot_reveal_mode: string };
  };
  ballots: Array<{
    id: string;
    status: string;
    locked: boolean;
    revealed: boolean;
    scores: any;
    winner: string;
    submitted_at: string;
  }>;
}

export function MyJudgings() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyAssignments();
    }
  }, [user]);

  const fetchMyAssignments = async () => {
    if (!user) return;

    try {
      // First get the judge profile for this user
      const { data: judgeProfile } = await supabase
        .from('judge_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!judgeProfile) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('judge_assignments')
        .select(`
          *,
          pairing:pairings(
            id,
            room,
            scheduled_time,
            scheduling_status,
            aff_participant:tournament_registrations!aff_registration_id(participant_name),
            neg_participant:tournament_registrations!neg_registration_id(participant_name),
            round:rounds(name),
            tournament:tournaments(name, ballot_reveal_mode)
          ),
          ballots(*)
        `)
        .eq('judge_id', judgeProfile.id)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
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
    // This would open a ballot component with the appropriate template
    toast({
      title: "Ballot System",
      description: "Ballot entry system would open here with the tournament's ballot template",
    });
  };

  const canViewBallot = (assignment: JudgeAssignment) => {
    const ballot = assignment.ballots?.[0];
    if (!ballot) return false;

    return ballot.revealed || 
           (assignment.pairing.tournament.ballot_reveal_mode === 'auto_on_submit' && ballot.status === 'submitted') ||
           (assignment.pairing.tournament.ballot_reveal_mode === 'after_tournament' && new Date() > new Date());
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
            const ballot = assignment.ballots?.[0];
            const hasBallot = !!ballot;
            const ballotSubmitted = ballot?.status === 'submitted';
            const ballotLocked = ballot?.locked;

            return (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Gavel className="h-5 w-5" />
                        {assignment.pairing.tournament.name} - {assignment.pairing.round.name}
                      </CardTitle>
                      <CardDescription>
                        Room: {assignment.pairing.room || 'TBD'} • Role: {assignment.role}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={ballotSubmitted ? 'default' : 'secondary'}>
                        {ballotSubmitted ? 'Ballot Submitted' : 'Ballot Pending'}
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
                          <span className="font-medium">{assignment.pairing.aff_participant?.participant_name}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">NEG</Badge>
                          <span className="font-medium">{assignment.pairing.neg_participant?.participant_name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Time */}
                    {assignment.pairing.scheduled_time && (
                      <div>
                        <div className="text-sm text-muted-foreground">Scheduled for:</div>
                        <div className="font-medium">
                          {new Date(assignment.pairing.scheduled_time).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Ballot Info */}
                    {hasBallot && (
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-sm font-medium mb-2">Ballot Status</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Status: </span>
                            <Badge variant="outline" className="text-xs">
                              {ballot.status}
                            </Badge>
                          </div>
                          {ballot.submitted_at && (
                            <div>
                              <span className="text-muted-foreground">Submitted: </span>
                              {new Date(ballot.submitted_at).toLocaleString()}
                            </div>
                          )}
                          {ballot.winner && (
                            <div>
                              <span className="text-muted-foreground">Winner: </span>
                              <Badge variant={ballot.winner === 'aff' ? 'outline' : 'secondary'}>
                                {ballot.winner.toUpperCase()}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant={hasBallot && !ballotLocked ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => openBallot(assignment)}
                        disabled={hasBallot && ballotLocked}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {hasBallot ? (ballotLocked ? 'View Ballot' : 'Edit Ballot') : 'Enter Ballot'}
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
                            Chat interface would be integrated here (similar to MyPairings)
                          </div>
                        </DialogContent>
                      </Dialog>

                      {hasBallot && canViewBallot(assignment) && (
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

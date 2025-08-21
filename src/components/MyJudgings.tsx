
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
  tournament_name: string;
  round_name: string;
  room: string;
  scheduled_time?: string;
  aff_participant: string;
  neg_participant: string;
  role: string;
  ballot_status?: string;
  ballot_submitted?: boolean;
  ballot_locked?: boolean;
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
      // For now, we'll show placeholder data until the new tables are properly set up
      // This prevents TypeScript errors while maintaining the UI structure
      const placeholderAssignments: JudgeAssignment[] = [
        {
          id: '1',
          tournament_name: 'Sample Tournament',
          round_name: 'Round 1',
          room: 'Room A',
          scheduled_time: new Date().toISOString(),
          aff_participant: 'Team A',
          neg_participant: 'Team B',
          role: 'Judge',
          ballot_status: 'draft',
          ballot_submitted: false,
          ballot_locked: false,
        }
      ];

      // Remove placeholder when real data is available
      setAssignments([]);
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
    toast({
      title: "Feature Coming Soon",
      description: "Ballot entry system will be available once the database setup is complete",
    });
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
                        Enter Ballot
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
    </div>
  );
}

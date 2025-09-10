
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  Clock, 
  MapPin, 
  Gavel, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Send,
  Lock
} from 'lucide-react';
import { Pairing, JudgeProfile } from '@/types/database';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { resolveJudgeRequest, finalizeScheduleProposal } from '@/utils/adminActions';

interface AdminPostingsProps {
  tournamentId: string;
  judges: JudgeProfile[];
  onUpdate: () => void;
}

interface JudgeRequest {
  id: string;
  pairing_id: string;
  judge_id: string;
  requester_id: string;
  request_reason: string | null;
  admin_response: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ScheduleProposal {
  id: string;
  pairing_id: string;
  proposer_user_id: string;
  proposed_time: string | null;
  proposed_room: string | null;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function AdminPostings({ tournamentId, judges, onUpdate }: AdminPostingsProps) {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [judgeRequests, setJudgeRequests] = useState<JudgeRequest[]>([]);
  const [scheduleProposals, setScheduleProposals] = useState<ScheduleProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Use realtime notifications
  const { counts, refreshCounts } = useRealtimeNotifications({ tournamentId });

  useEffect(() => {
    if (tournamentId) {
      fetchPostingsData();
    }
  }, [tournamentId]);

  const fetchPostingsData = async () => {
    try {
      setLoading(true);

      // Fetch pairings with related data
      const { data: pairingsData, error: pairingsError } = await supabase
        .from('pairings')
        .select(`
          *,
          aff_registration:tournament_registrations!aff_registration_id(participant_name, participant_email),
          neg_registration:tournament_registrations!neg_registration_id(participant_name, participant_email),
          round:rounds(name),
          tournaments(name),
          judge_profiles(name, email)
        `)
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false });

      if (pairingsError) throw pairingsError;

      // Fetch judge requests for this tournament
      const tournamentPairingIds = (pairingsData || []).map(p => p.id);
      
      if (tournamentPairingIds.length > 0) {
        const { data: requestsData, error: requestsError } = await supabase
          .from('judge_requests')
          .select('*')
          .in('pairing_id', tournamentPairingIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (requestsError) {
          console.warn('Error fetching judge requests:', requestsError);
          setJudgeRequests([]);
        } else {
          setJudgeRequests(requestsData || []);
        }

        // Fetch schedule proposals for this tournament
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('schedule_proposals')
          .select('*')
          .in('pairing_id', tournamentPairingIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (proposalsError) {
          console.warn('Error fetching schedule proposals:', proposalsError);
          setScheduleProposals([]);
        } else {
          setScheduleProposals(proposalsData || []);
        }
      } else {
        setJudgeRequests([]);
        setScheduleProposals([]);
      }

      setPairings((pairingsData || []).map((pairing: any) => ({
        ...pairing,
        method: pairing.method || null,
        seed: pairing.seed || null
      })));
    } catch (error: any) {
      console.error('Error fetching postings data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch postings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignJudge = async (pairingId: string, judgeId: string) => {
    try {
      const { error } = await supabase
        .from('pairings')
        .update({ judge_id: judgeId })
        .eq('id', pairingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Judge assigned successfully",
      });
      
      fetchPostingsData();
      onUpdate();
    } catch (error: any) {
      console.error('Error assigning judge:', error);
      toast({
        title: "Error",
        description: "Failed to assign judge",
        variant: "destructive",
      });
    }
  };

  const updateSchedule = async (pairingId: string, room: string, time: string) => {
    try {
      const updateData: any = {};
      if (room) updateData.room = room;
      if (time) updateData.scheduled_time = time;

      const { error } = await supabase
        .from('pairings')
        .update(updateData)
        .eq('id', pairingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      
      fetchPostingsData();
      onUpdate();
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    }
  };

  const handleResolveJudgeRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await resolveJudgeRequest(requestId, action);
      toast({
        title: "Success",
        description: `Judge request ${action}d successfully`,
      });
      
      fetchPostingsData();
      refreshCounts();
      onUpdate();
    } catch (error: any) {
      console.error('Error resolving judge request:', error);
      toast({
        title: "Error",
        description: "Failed to resolve judge request",
        variant: "destructive",
      });
    }
  };

  const handleFinalizeScheduleProposal = async (proposalId: string, action: 'approve' | 'reject') => {
    try {
      await finalizeScheduleProposal(proposalId, action);
      toast({
        title: "Success",
        description: `Schedule proposal ${action}d successfully`,
      });
      
      fetchPostingsData();
      refreshCounts();
      onUpdate();
    } catch (error: any) {
      console.error('Error finalizing schedule proposal:', error);
      toast({
        title: "Error",
        description: "Failed to finalize schedule proposal",
        variant: "destructive",
      });
    }
  };

  const lockAllBallots = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_lock_ballots', {
        _tournament_id: tournamentId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Locked ${data || 0} ballots for submission`,
      });
    } catch (error: any) {
      console.error('Error locking ballots:', error);
      toast({
        title: "Error",
        description: "Failed to lock ballots",
        variant: "destructive",
      });
    }
  };

  const getFilteredData = () => {
    const missingJudges = pairings.filter(p => !p.judge_id);
    const unscheduled = pairings.filter(p => !p.scheduled_time || !p.room);
    
    switch (filter) {
      case 'missing_judges':
        return { pairings: missingJudges, requests: [], proposals: [] };
      case 'unscheduled':
        return { pairings: unscheduled, requests: [], proposals: [] };
      case 'judge_requests':
        return { pairings: [], requests: judgeRequests, proposals: [] };
      case 'schedule_proposals':
        return { pairings: [], requests: [], proposals: scheduleProposals };
      default:
        return { 
          pairings: [...missingJudges, ...unscheduled], 
          requests: judgeRequests, 
          proposals: scheduleProposals 
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { pairings: filteredPairings, requests, proposals } = getFilteredData();
  const totalIssues = pairings.filter(p => !p.judge_id).length + 
                     pairings.filter(p => !p.scheduled_time || !p.room).length + 
                     judgeRequests.length + 
                     scheduleProposals.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Admin Postings</h3>
          <p className="text-sm text-muted-foreground">
            Manage tournament postings and workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Issues ({totalIssues})</SelectItem>
              <SelectItem value="missing_judges">
                Missing Judges ({pairings.filter(p => !p.judge_id).length})
              </SelectItem>
              <SelectItem value="unscheduled">
                Unscheduled ({pairings.filter(p => !p.scheduled_time || !p.room).length})
              </SelectItem>
              <SelectItem value="judge_requests">
                Judge Requests ({counts.pendingRequests})
                {counts.pendingRequests > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {counts.pendingRequests}
                  </Badge>
                )}
              </SelectItem>
              <SelectItem value="schedule_proposals">
                Schedule Proposals ({counts.pendingProposals})
                {counts.pendingProposals > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {counts.pendingProposals}
                  </Badge>
                )}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={lockAllBallots} variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Lock All Ballots
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Missing Judges</p>
                <p className="text-2xl font-bold text-orange-600">
                  {pairings.filter(p => !p.judge_id).length}
                </p>
              </div>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unscheduled</p>
                <p className="text-2xl font-bold text-blue-600">
                  {pairings.filter(p => !p.scheduled_time || !p.room).length}
                </p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Judge Requests</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-purple-600">{counts.pendingRequests}</p>
                  {counts.pendingRequests > 0 && (
                    <Badge variant="destructive" className="text-xs">New</Badge>
                  )}
                </div>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Schedule Proposals</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-green-600">{counts.pendingProposals}</p>
                  {counts.pendingProposals > 0 && (
                    <Badge variant="destructive" className="text-xs">New</Badge>
                  )}
                </div>
              </div>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pairings Issues */}
      {filteredPairings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Pairings Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPairings.map((pairing) => (
                <div key={pairing.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">
                        {pairing.aff_registration?.participant_name} vs {pairing.neg_registration?.participant_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {pairing.round?.name} • {pairing.tournaments?.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!pairing.judge_id && (
                        <Badge variant="outline" className="text-orange-600">
                          No Judge
                        </Badge>
                      )}
                      {(!pairing.scheduled_time || !pairing.room) && (
                        <Badge variant="outline" className="text-blue-600">
                          Unscheduled
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {!pairing.judge_id && (
                      <Select onValueChange={(judgeId) => assignJudge(pairing.id, judgeId)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Assign judge..." />
                        </SelectTrigger>
                        <SelectContent>
                          {judges.map((judge) => (
                            <SelectItem key={judge.id} value={judge.id}>
                              {judge.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {(!pairing.scheduled_time || !pairing.room) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const room = prompt('Enter room:', pairing.room || '');
                          const time = prompt('Enter time (YYYY-MM-DD HH:MM):', 
                            pairing.scheduled_time ? new Date(pairing.scheduled_time).toISOString().slice(0, 16) : '');
                          if (room !== null || time !== null) {
                            updateSchedule(pairing.id, room || pairing.room || '', time || '');
                          }
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Set Schedule
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Judge Requests */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Pending Judge Requests
              {counts.pendingRequests > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {counts.pendingRequests} new
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => {
                const pairing = pairings.find(p => p.id === request.pairing_id);
                const judge = judges.find(j => j.id === request.judge_id);
                
                return (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">
                          Request for {judge?.name || 'Unknown Judge'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {pairing?.aff_registration?.participant_name} vs {pairing?.neg_registration?.participant_name}
                        </p>
                        {request.request_reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Reason: {request.request_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleResolveJudgeRequest(request.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveJudgeRequest(request.id, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Proposals */}
      {proposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Pending Schedule Proposals
              {counts.pendingProposals > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {counts.pendingProposals} new
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proposals.map((proposal) => {
                const pairing = pairings.find(p => p.id === proposal.pairing_id);
                
                return (
                  <div key={proposal.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">
                          Schedule Change Request
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {pairing?.aff_registration?.participant_name} vs {pairing?.neg_registration?.participant_name}
                        </p>
                        <div className="mt-2 text-sm">
                          {proposal.proposed_time && (
                            <p>Proposed time: {new Date(proposal.proposed_time).toLocaleString()}</p>
                          )}
                          {proposal.proposed_room && (
                            <p>Proposed room: {proposal.proposed_room}</p>
                          )}
                          {proposal.note && (
                            <p className="text-muted-foreground">Note: {proposal.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleFinalizeScheduleProposal(proposal.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFinalizeScheduleProposal(proposal.id, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {totalIssues === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">All Clear!</h3>
              <p className="text-muted-foreground">
                No pending issues found for this tournament.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

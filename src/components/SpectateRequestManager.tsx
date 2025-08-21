
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, Check, X, Clock, Users, MessageCircle } from 'lucide-react';

interface SpectateRequest {
  id: string;
  pairing_id: string;
  requester_user_id: string;
  status: string;
  aff_team_approval: boolean | null;
  neg_team_approval: boolean | null;
  request_reason: string | null;
  created_at: string;
  pairing?: {
    id: string;
    aff_registration: { participant_name: string; user_id: string };
    neg_registration: { participant_name: string; user_id: string };
    scheduled_time: string | null;
    room: string | null;
    round: { name: string };
  };
  requester?: {
    first_name: string;
    last_name: string;
  };
}

interface Pairing {
  id: string;
  aff_registration: { participant_name: string; user_id: string };
  neg_registration: { participant_name: string; user_id: string };
  scheduled_time: string | null;
  room: string | null;
  round: { name: string };
}

interface SpectateRequestManagerProps {
  tournamentId: string;
  pairings: Pairing[];
}

export function SpectateRequestManager({ tournamentId, pairings }: SpectateRequestManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [spectateRequests, setSpectateRequests] = useState<SpectateRequest[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<SpectateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedPairing, setSelectedPairing] = useState<string | null>(null);
  const [requestReason, setRequestReason] = useState('');

  useEffect(() => {
    fetchSpectateRequests();
    fetchPendingApprovals();
  }, [tournamentId, user]);

  const fetchSpectateRequests = async () => {
    if (!user) return;

    try {
      const pairingIds = pairings.map(p => p.id);
      if (pairingIds.length === 0) return;

      // First, get the spectate requests
      const { data: requests, error } = await supabase
        .from('spectate_requests')
        .select('*')
        .eq('requester_user_id', user.id)
        .in('pairing_id', pairingIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Then get pairing details for each request
      const requestsWithDetails = await Promise.all(
        (requests || []).map(async (request) => {
          // Find the pairing from the props
          const pairing = pairings.find(p => p.id === request.pairing_id);
          
          return {
            ...request,
            pairing: pairing ? {
              id: pairing.id,
              aff_registration: pairing.aff_registration,
              neg_registration: pairing.neg_registration,
              scheduled_time: pairing.scheduled_time,
              room: pairing.room,
              round: pairing.round
            } : undefined
          };
        })
      );

      setSpectateRequests(requestsWithDetails);
    } catch (error: any) {
      console.error('Error fetching spectate requests:', error);
    }
  };

  const fetchPendingApprovals = async () => {
    if (!user) return;

    try {
      const pairingIds = pairings.map(p => p.id);
      if (pairingIds.length === 0) return;

      // Get spectate requests that need approval
      const { data: requests, error } = await supabase
        .from('spectate_requests')
        .select('*')
        .eq('status', 'pending')
        .in('pairing_id', pairingIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get requester profiles
      const requesterIds = [...new Set((requests || []).map(r => r.requester_user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', requesterIds);

      // Combine requests with pairing and requester details
      const requestsWithDetails = (requests || []).map(request => {
        const pairing = pairings.find(p => p.id === request.pairing_id);
        const requester = profiles?.find(p => p.user_id === request.requester_user_id);
        
        return {
          ...request,
          pairing: pairing ? {
            id: pairing.id,
            aff_registration: pairing.aff_registration,
            neg_registration: pairing.neg_registration,
            scheduled_time: pairing.scheduled_time,
            room: pairing.room,
            round: pairing.round
          } : undefined,
          requester: requester ? {
            first_name: requester.first_name || 'Unknown',
            last_name: requester.last_name || 'User'
          } : { first_name: 'Unknown', last_name: 'User' }
        };
      });

      // Filter to only show requests for pairings where the current user is a participant
      const userPendingApprovals = requestsWithDetails.filter(request => {
        const pairing = request.pairing;
        return pairing && (
          pairing.aff_registration?.user_id === user.id || 
          pairing.neg_registration?.user_id === user.id
        );
      });

      setPendingApprovals(userPendingApprovals);
    } catch (error: any) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const requestSpectate = async () => {
    if (!selectedPairing || !user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('spectate_requests')
        .insert({
          pairing_id: selectedPairing,
          requester_user_id: user.id,
          request_reason: requestReason || null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Spectate request submitted. Both teams must approve before you can view the pairing.',
      });

      setRequestDialogOpen(false);
      setSelectedPairing(null);
      setRequestReason('');
      fetchSpectateRequests();
    } catch (error: any) {
      console.error('Error requesting spectate:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit spectate request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId: string, approved: boolean) => {
    if (!user) return;

    try {
      setLoading(true);

      const request = pendingApprovals.find(r => r.id === requestId);
      if (!request || !request.pairing) return;

      // Determine which team approval to update
      const updateData: any = {};
      if (request.pairing.aff_registration?.user_id === user.id) {
        updateData.aff_team_approval = approved;
      } else if (request.pairing.neg_registration?.user_id === user.id) {
        updateData.neg_team_approval = approved;
      }

      const { error } = await supabase
        .from('spectate_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Spectate request ${approved ? 'approved' : 'rejected'}`,
      });

      fetchPendingApprovals();
    } catch (error: any) {
      console.error('Error handling approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to update approval. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (request: SpectateRequest) => {
    if (request.status === 'approved') {
      return <Badge variant="default">Approved</Badge>;
    }
    if (request.status === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    
    // Pending - show approval status
    return (
      <div className="flex gap-1">
        <Badge variant="outline">
          Aff: {request.aff_team_approval === null ? '⏳' : request.aff_team_approval ? '✓' : '✗'}
        </Badge>
        <Badge variant="outline">
          Neg: {request.neg_team_approval === null ? '⏳' : request.neg_team_approval ? '✓' : '✗'}
        </Badge>
      </div>
    );
  };

  // Filter out pairings where user is already a participant
  const spectablePairings = pairings.filter(pairing => 
    pairing.aff_registration.user_id !== user?.id && 
    pairing.neg_registration.user_id !== user?.id
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Spectate Requests</h3>
          <p className="text-sm text-muted-foreground">
            Request to spectate rounds you're not participating in
          </p>
        </div>
        
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Eye className="h-4 w-4 mr-2" />
              Request to Spectate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request to Spectate</DialogTitle>
              <DialogDescription>
                Select a pairing to request spectator access. Both teams must approve your request.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Pairing</label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {spectablePairings.map((pairing) => (
                    <div 
                      key={pairing.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPairing === pairing.id 
                          ? 'border-primary bg-primary/10' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedPairing(pairing.id)}
                    >
                      <div className="font-medium">
                        {pairing.aff_registration.participant_name} vs {pairing.neg_registration.participant_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {pairing.round.name}
                        {pairing.scheduled_time && (
                          <> • {new Date(pairing.scheduled_time).toLocaleString()}</>
                        )}
                        {pairing.room && <> • {pairing.room}</>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Reason (Optional)</label>
                <Textarea
                  placeholder="Why would you like to spectate this round?"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={requestSpectate} 
                  disabled={!selectedPairing || loading}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Pending Your Approval
            </CardTitle>
            <CardDescription>
              Other users have requested to spectate your matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">
                        {request.requester?.first_name} {request.requester?.last_name} 
                        wants to spectate your match
                      </h4>
                      {request.pairing && (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {request.pairing.aff_registration.participant_name} vs {request.pairing.neg_registration.participant_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.pairing.round.name}
                          </p>
                        </>
                      )}
                    </div>
                    {getStatusBadge(request)}
                  </div>
                  
                  {request.request_reason && (
                    <div className="mb-3 p-2 bg-muted rounded text-sm">
                      <MessageCircle className="h-4 w-4 inline mr-1" />
                      {request.request_reason}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApproval(request.id, true)}
                      disabled={loading}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleApproval(request.id, false)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Spectate Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            My Spectate Requests
          </CardTitle>
          <CardDescription>
            Track the status of your spectator requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {spectateRequests.length > 0 ? (
            <div className="space-y-4">
              {spectateRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      {request.pairing && (
                        <>
                          <h4 className="font-medium">
                            {request.pairing.aff_registration.participant_name} vs {request.pairing.neg_registration.participant_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {request.pairing.round.name}
                            {request.pairing.scheduled_time && (
                              <> • {new Date(request.pairing.scheduled_time).toLocaleString()}</>
                            )}
                            {request.pairing.room && <> • {request.pairing.room}</>}
                          </p>
                        </>
                      )}
                    </div>
                    {getStatusBadge(request)}
                  </div>
                  
                  {request.request_reason && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <MessageCircle className="h-4 w-4 inline mr-1" />
                      {request.request_reason}
                    </div>
                  )}
                  
                  {request.status === 'approved' && (
                    <div className="mt-3">
                      <Button size="sm" asChild>
                        <a href={`/pairings/${request.pairing_id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Pairing
                        </a>
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    Requested: {new Date(request.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No spectate requests yet. Click "Request to Spectate" to watch other matches!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

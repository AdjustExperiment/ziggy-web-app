
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserMinus, UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';

interface OptOutWithDetails {
  id: string;
  reason: string | null;
  created_at: string;
  round: {
    name: string;
    round_number: number;
  };
  registration: {
    participant_name: string;
    participant_email: string;
  };
}

interface ExtraRequestWithDetails {
  id: string;
  note: string | null;
  status: string;
  created_at: string;
  round: {
    name: string;
    round_number: number;
  };
  registration: {
    participant_name: string;
    participant_email: string;
  };
}

interface ParticipationManagerProps {
  tournamentId: string;
}

export function ParticipationManager({ tournamentId }: ParticipationManagerProps) {
  const [optOuts, setOptOuts] = useState<OptOutWithDetails[]>([]);
  const [extraRequests, setExtraRequests] = useState<ExtraRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch opt-outs
      const { data: optOutsData, error: optOutsError } = await supabase
        .from('round_opt_outs')
        .select(`
          *,
          round:rounds(name, round_number),
          registration:tournament_registrations(participant_name, participant_email)
        `)
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false });

      if (optOutsError) throw optOutsError;

      // Fetch extra round requests
      const { data: extraRequestsData, error: extraRequestsError } = await supabase
        .from('extra_round_requests')
        .select(`
          *,
          round:rounds(name, round_number),
          registration:tournament_registrations(participant_name, participant_email)
        `)
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false });

      if (extraRequestsError) throw extraRequestsError;

      setOptOuts(optOutsData || []);
      setExtraRequests(extraRequestsData || []);
    } catch (error: any) {
      console.error('Error fetching participation data:', error);
      toast({
        title: "Error",
        description: "Failed to load participation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtraRequestStatus = async (requestId: string, newStatus: 'accepted' | 'declined') => {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from('extra_round_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setExtraRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: newStatus }
            : req
        )
      );

      toast({
        title: "Success",
        description: `Extra round request ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update request status",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tournament Participation Management
          </CardTitle>
          <CardDescription>
            Manage round opt-outs and extra round requests for this tournament
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="opt-outs">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="opt-outs" className="flex items-center gap-2">
                <UserMinus className="h-4 w-4" />
                Opt-Outs ({optOuts.length})
              </TabsTrigger>
              <TabsTrigger value="extra-requests" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Extra Requests ({extraRequests.filter(req => req.status === 'pending').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="opt-outs" className="space-y-4">
              {optOuts.map(optOut => (
                <Card key={optOut.id} className="border-l-4 border-l-destructive">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">
                          {optOut.registration.participant_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {optOut.registration.participant_email}
                        </p>
                        <div className="mt-2">
                          <Badge variant="outline">
                            {optOut.round.name}
                          </Badge>
                        </div>
                        {optOut.reason && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded">
                            <strong>Reason:</strong> {optOut.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(optOut.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {optOuts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No round opt-outs for this tournament.
                </div>
              )}
            </TabsContent>

            <TabsContent value="extra-requests" className="space-y-4">
              {extraRequests.map(request => (
                <Card 
                  key={request.id} 
                  className={`border-l-4 ${
                    request.status === 'pending' ? 'border-l-yellow-500' :
                    request.status === 'accepted' ? 'border-l-green-500' :
                    'border-l-red-500'
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {request.registration.participant_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {request.registration.participant_email}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {request.round.name}
                          </Badge>
                          <Badge 
                            variant={
                              request.status === 'pending' ? 'secondary' :
                              request.status === 'accepted' ? 'default' :
                              'destructive'
                            }
                            className="flex items-center gap-1"
                          >
                            {request.status === 'pending' && <Clock className="h-3 w-3" />}
                            {request.status === 'accepted' && <CheckCircle className="h-3 w-3" />}
                            {request.status === 'declined' && <XCircle className="h-3 w-3" />}
                            {request.status}
                          </Badge>
                        </div>
                        {request.note && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded">
                            <strong>Note:</strong> {request.note}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                        
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleExtraRequestStatus(request.id, 'accepted')}
                              disabled={processingId === request.id}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleExtraRequestStatus(request.id, 'declined')}
                              disabled={processingId === request.id}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {extraRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No extra round requests for this tournament.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

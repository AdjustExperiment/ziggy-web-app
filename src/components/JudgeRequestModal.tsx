import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gavel, Send, Calendar, Clock } from 'lucide-react';

interface Judge {
  id: string;
  name: string;
  experience_level: string;
  qualifications: string | null;
  bio: string | null;
}

interface JudgeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairingId: string;
  tournamentName: string;
  roundName: string;
}

export default function JudgeRequestModal({ 
  isOpen, 
  onClose, 
  pairingId, 
  tournamentName, 
  roundName 
}: JudgeRequestModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [judges, setJudges] = useState<Judge[]>([]);
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchJudges();
      checkExistingRequest();
    }
  }, [isOpen, pairingId]);

  const fetchJudges = async () => {
    try {
      const { data, error } = await supabase
        .from('judge_profiles')
        .select('id, name, experience_level, qualifications, bio')
        .order('name');

      if (error) throw error;
      setJudges(data || []);
    } catch (error) {
      console.error('Error fetching judges:', error);
    }
  };

  const checkExistingRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('judge_requests')
        .select(`
          *,
          judge:judge_profiles (name, email)
        `)
        .eq('pairing_id', pairingId)
        .eq('requester_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setExistingRequest(data);
    } catch (error) {
      console.error('Error checking existing request:', error);
    }
  };

  const submitRequest = async () => {
    if (!selectedJudgeId || !user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('judge_requests')
        .insert({
          pairing_id: pairingId,
          requester_id: user.id,
          judge_id: selectedJudgeId,
          request_reason: requestReason.trim() || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Request Submitted',
        description: 'Your judge request has been submitted for admin review.',
      });

      onClose();
      setSelectedJudgeId('');
      setRequestReason('');
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit judge request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'expert': return 'default';
      case 'experienced': return 'secondary';
      case 'novice': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Request Judge Assignment
          </DialogTitle>
          <DialogDescription>
            Request a specific judge for {tournamentName} - {roundName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tournament Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Tournament: {tournamentName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Round: {roundName}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {existingRequest ? (
            /* Existing Request Display */
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Existing Request</CardTitle>
                <CardDescription>
                  You have already submitted a judge request for this pairing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Requested Judge:</span>
                  <span>{existingRequest.judge?.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge variant={getStatusColor(existingRequest.status)}>
                    {existingRequest.status.charAt(0).toUpperCase() + existingRequest.status.slice(1)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Submitted:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(existingRequest.created_at).toLocaleDateString()}
                  </span>
                </div>

                {existingRequest.request_reason && (
                  <div>
                    <span className="font-medium">Reason:</span>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded mt-1">
                      {existingRequest.request_reason}
                    </p>
                  </div>
                )}

                {existingRequest.admin_response && (
                  <div>
                    <span className="font-medium">Admin Response:</span>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded mt-1">
                      {existingRequest.admin_response}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* New Request Form */
            <>
              <div>
                <Label htmlFor="judge">Select Judge</Label>
                <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a judge to request" />
                  </SelectTrigger>
                  <SelectContent>
                    {judges.map(judge => (
                      <SelectItem key={judge.id} value={judge.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{judge.name}</span>
                          <Badge variant={getExperienceColor(judge.experience_level)} className="ml-2">
                            {judge.experience_level}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Judge Details */}
              {selectedJudgeId && (
                <Card>
                  <CardContent className="pt-6">
                    {(() => {
                      const selectedJudge = judges.find(j => j.id === selectedJudgeId);
                      if (!selectedJudge) return null;
                      
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{selectedJudge.name}</h4>
                            <Badge variant={getExperienceColor(selectedJudge.experience_level)}>
                              {selectedJudge.experience_level}
                            </Badge>
                          </div>
                          
                           <div className="text-sm text-muted-foreground">
                             Contact information available to admins only
                           </div>

                          {selectedJudge.qualifications && (
                            <div>
                              <span className="text-sm font-medium">Qualifications:</span>
                              <p className="text-sm text-muted-foreground">
                                {selectedJudge.qualifications}
                              </p>
                            </div>
                          )}

                          {selectedJudge.bio && (
                            <div>
                              <span className="text-sm font-medium">About:</span>
                              <p className="text-sm text-muted-foreground">
                                {selectedJudge.bio}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              <div>
                <Label htmlFor="reason">Reason for Request (Optional)</Label>
                <Textarea
                  id="reason"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Explain why you would prefer this specific judge..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={submitRequest}
                  disabled={!selectedJudgeId || loading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
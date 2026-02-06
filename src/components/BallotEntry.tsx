import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Gavel, Save, Send, Eye } from 'lucide-react';

interface BallotEntryProps {
  assignmentId: string;
  tournamentName: string;
  roundName: string;
  affParticipant: string;
  negParticipant: string;
  isOpen: boolean;
  onClose: () => void;
  onBallotSubmitted: () => void;
}

export function BallotEntry({
  assignmentId,
  tournamentName,
  roundName,
  affParticipant,
  negParticipant,
  isOpen,
  onClose,
  onBallotSubmitted,
}: BallotEntryProps) {
  const [ballot, setBallot] = useState<any>(null);
  const [winner, setWinner] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [affSpeaks, setAffSpeaks] = useState<string>('');
  const [negSpeaks, setNegSpeaks] = useState<string>('');
  const [affRank, setAffRank] = useState<string>('');
  const [negRank, setNegRank] = useState<string>('');
  const [affFeedback, setAffFeedback] = useState<string>('');
  const [negFeedback, setNegFeedback] = useState<string>('');
  const [speaksError, setSpeaksError] = useState<string | null>(null);
  
  // Speaker point validation
  const SPEAKS_MIN = 20;
  const SPEAKS_MAX = 30;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [judgeProfileId, setJudgeProfileId] = useState<string | null>(null);
  const [judgeUserId, setJudgeUserId] = useState<string | null>(null);
  const canEdit = !ballot || ballot.status !== 'submitted';

  useEffect(() => {
    if (isOpen && assignmentId) {
      fetchBallot();
    }
  }, [isOpen, assignmentId]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (canEdit) saveBallot('draft', true);
    }, 3000); // Increased from 1000ms to reduce API calls
    return () => clearTimeout(timer);
  }, [winner, comments, affSpeaks, negSpeaks, affRank, negRank, affFeedback, negFeedback, isOpen]);

  const fetchBallot = async () => {
    setLoading(true);
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id || null;
      setJudgeUserId(userId);

      const { data: judgeProfile } = await supabase
        .from('judge_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      setJudgeProfileId(judgeProfile?.id || null);

      // Get the pairing_id from the assignment
      const { data: assignment } = await supabase
        .from('pairing_judge_assignments')
        .select('pairing_id')
        .eq('id', assignmentId)
        .single();

      if (!assignment) return;

      const { data, error } = await supabase
        .from('ballots')
        .select('*')
        .eq('pairing_id', assignment.pairing_id)
        .eq('judge_user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBallot(data);
        const payload = data.payload as any || {};
        setWinner(payload.winner || '');
        setComments(payload.comments || '');
        // Support both legacy aff_points and new aff_speaks field names
        setAffSpeaks(payload.aff_speaks?.toString() || payload.aff_points?.toString() || '');
        setNegSpeaks(payload.neg_speaks?.toString() || payload.neg_points?.toString() || '');
        setAffRank(payload.aff_rank?.toString() || '');
        setNegRank(payload.neg_rank?.toString() || '');
        setAffFeedback(payload.aff_feedback || '');
        setNegFeedback(payload.neg_feedback || '');
      } else {
        setBallot(null);
        setWinner('');
        setComments('');
        setAffSpeaks('');
        setNegSpeaks('');
        setAffRank('');
        setNegRank('');
        setAffFeedback('');
        setNegFeedback('');
      }
    } catch (error: any) {
      console.error('Error fetching ballot:', error);
      toast({
        title: "Error",
        description: "Failed to load ballot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateSpeakerPoints = (): boolean => {
    setSpeaksError(null);
    const affValue = affSpeaks ? parseFloat(affSpeaks) : null;
    const negValue = negSpeaks ? parseFloat(negSpeaks) : null;
    
    if (affValue !== null && (affValue < SPEAKS_MIN || affValue > SPEAKS_MAX)) {
      setSpeaksError(`Affirmative speaker points must be between ${SPEAKS_MIN} and ${SPEAKS_MAX}`);
      return false;
    }
    if (negValue !== null && (negValue < SPEAKS_MIN || negValue > SPEAKS_MAX)) {
      setSpeaksError(`Negative speaker points must be between ${SPEAKS_MIN} and ${SPEAKS_MAX}`);
      return false;
    }
    return true;
  };

  const saveBallot = async (status: 'draft' | 'submitted', auto = false) => {
    if (!judgeProfileId || !judgeUserId) return;
    
    // Validate speaker points on submit
    if (status === 'submitted' && !validateSpeakerPoints()) {
      toast({
        title: "Validation Error",
        description: speaksError || "Please check speaker points",
        variant: "destructive",
      });
      return;
    }
    
    if (!auto) setSaving(true);
    try {
      // Use aff_speaks/neg_speaks as the standard field names
      const payload = {
        winner,
        comments,
        aff_speaks: affSpeaks ? parseFloat(affSpeaks) : null,
        neg_speaks: negSpeaks ? parseFloat(negSpeaks) : null,
        aff_rank: affRank ? parseInt(affRank) : null,
        neg_rank: negRank ? parseInt(negRank) : null,
        aff_feedback: affFeedback,
        neg_feedback: negFeedback,
      };

      // Get the pairing_id from the assignment
      const { data: assignment } = await supabase
        .from('pairing_judge_assignments')
        .select('pairing_id')
        .eq('id', assignmentId)
        .single();

      if (!assignment) throw new Error('Assignment not found');

      if (ballot) {
        const { data, error } = await supabase
          .from('ballots')
          .update({ 
            payload,
            status, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', ballot.id)
          .select()
          .single();

        if (error) throw error;
        setBallot(data);
      } else {
        const { data, error } = await supabase
          .from('ballots')
          .insert({
            pairing_id: assignment.pairing_id,
            judge_profile_id: judgeProfileId,
            judge_user_id: judgeUserId,
            payload,
            status,
          })
          .select()
          .single();

        if (error) throw error;
        setBallot(data);
      }

      if (!auto) {
        toast({
          title: "Success",
          description: status === 'submitted' ? 'Ballot submitted successfully' : 'Ballot saved as draft',
        });
      }

      if (status === 'submitted') {
        // Check if tournament has auto_on_submit mode and notify competitors
        const { data: pairing } = await supabase
          .from('pairings')
          .select(`
            tournament_id,
            aff_registration_id,
            neg_registration_id,
            rounds(name),
            tournaments(ballot_reveal_mode)
          `)
          .eq('id', assignment.pairing_id)
          .single();

        if (pairing && (pairing.tournaments as any)?.ballot_reveal_mode === 'auto_on_submit') {
          const roundName = (pairing.rounds as any)?.name || 'your round';
          const notifications: any[] = [];
          
          if (pairing.aff_registration_id) {
            notifications.push({
              registration_id: pairing.aff_registration_id,
              tournament_id: pairing.tournament_id,
              pairing_id: assignment.pairing_id,
              title: 'Ballot Submitted',
              message: `Results for ${roundName} are now available. View your ballot feedback.`,
              type: 'result_published'
            });
          }
          if (pairing.neg_registration_id && pairing.neg_registration_id !== pairing.aff_registration_id) {
            notifications.push({
              registration_id: pairing.neg_registration_id,
              tournament_id: pairing.tournament_id,
              pairing_id: assignment.pairing_id,
              title: 'Ballot Submitted',
              message: `Results for ${roundName} are now available. View your ballot feedback.`,
              type: 'result_published'
            });
          }

          if (notifications.length > 0) {
            await supabase.from('competitor_notifications').insert(notifications);
          }
        }

        onBallotSubmitted();
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving ballot:', error);
      if (!auto) {
        toast({
          title: "Error",
          description: "Failed to save ballot",
          variant: "destructive",
        });
      }
    } finally {
      if (!auto) setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Ballot Entry
          </DialogTitle>
          <DialogDescription>
            {tournamentName} - {roundName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pairing Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">AFF</Badge>
                    <span className="font-medium">{affParticipant}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">NEG</Badge>
                    <span className="font-medium">{negParticipant}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            {ballot && (
              <div className="flex items-center gap-2">
                <Badge variant={ballot.status === 'submitted' ? 'default' : 'secondary'}>
                  {ballot.status === 'submitted' ? 'Submitted' : 'Draft'}
                </Badge>
                {ballot.status === 'submitted' && (
                  <Badge variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Read Only
                  </Badge>
                )}
              </div>
            )}

            {/* Winner Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Winner</Label>
              <RadioGroup 
                value={winner} 
                onValueChange={setWinner}
                disabled={!canEdit}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="aff" id="aff" />
                  <Label htmlFor="aff">Affirmative ({affParticipant})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="neg" id="neg" />
                  <Label htmlFor="neg">Negative ({negParticipant})</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Speaker Points */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aff-speaks">Affirmative Speaker Points</Label>
                <input
                  id="aff-speaks"
                  type="number"
                  min={SPEAKS_MIN}
                  max={SPEAKS_MAX}
                  step="0.1"
                  value={affSpeaks}
                  onChange={(e) => {
                    setAffSpeaks(e.target.value);
                    setSpeaksError(null);
                  }}
                  disabled={!canEdit}
                  className="w-full p-2 border rounded-md disabled:opacity-50 disabled:bg-muted"
                  placeholder={`${SPEAKS_MIN}-${SPEAKS_MAX}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neg-speaks">Negative Speaker Points</Label>
                <input
                  id="neg-speaks"
                  type="number"
                  min={SPEAKS_MIN}
                  max={SPEAKS_MAX}
                  step="0.1"
                  value={negSpeaks}
                  onChange={(e) => {
                    setNegSpeaks(e.target.value);
                    setSpeaksError(null);
                  }}
                  disabled={!canEdit}
                  className="w-full p-2 border rounded-md disabled:opacity-50 disabled:bg-muted"
                  placeholder={`${SPEAKS_MIN}-${SPEAKS_MAX}`}
                />
              </div>
            </div>
            
            {/* Speaker Points Validation Error */}
            {speaksError && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                {speaksError}
              </div>
            )}

            {/* Rankings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aff-rank">Affirmative Rank</Label>
                <input
                  id="aff-rank"
                  type="number"
                  min="1"
                  value={affRank}
                  onChange={(e) => setAffRank(e.target.value)}
                  disabled={!canEdit}
                  className="w-full p-2 border rounded-md disabled:opacity-50 disabled:bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neg-rank">Negative Rank</Label>
                <input
                  id="neg-rank"
                  type="number"
                  min="1"
                  value={negRank}
                  onChange={(e) => setNegRank(e.target.value)}
                  disabled={!canEdit}
                  className="w-full p-2 border rounded-md disabled:opacity-50 disabled:bg-muted"
                />
              </div>
            </div>

            {/* Feedback */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aff-feedback">Affirmative Feedback</Label>
                <Textarea
                  id="aff-feedback"
                  value={affFeedback}
                  onChange={(e) => setAffFeedback(e.target.value)}
                  disabled={!canEdit}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neg-feedback">Negative Feedback</Label>
                <Textarea
                  id="neg-feedback"
                  value={negFeedback}
                  onChange={(e) => setNegFeedback(e.target.value)}
                  disabled={!canEdit}
                  rows={3}
                />
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments">Comments & Feedback</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={!canEdit}
                placeholder="Provide feedback on the debate..."
                rows={4}
              />
            </div>

            {/* Actions */}
            {canEdit && (
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => saveBallot('draft')}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => saveBallot('submitted')}
                  disabled={saving || !winner}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Ballot
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
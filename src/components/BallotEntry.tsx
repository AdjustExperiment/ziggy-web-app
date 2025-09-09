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
  const [affPoints, setAffPoints] = useState<string>('');
  const [negPoints, setNegPoints] = useState<string>('');
  const [affRank, setAffRank] = useState<string>('');
  const [negRank, setNegRank] = useState<string>('');
  const [affFeedback, setAffFeedback] = useState<string>('');
  const [negFeedback, setNegFeedback] = useState<string>('');
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
    }, 1000);
    return () => clearTimeout(timer);
  }, [winner, comments, affPoints, negPoints, affRank, negRank, affFeedback, negFeedback, isOpen]);

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

      const { data, error } = await supabase
        .from('ballot_entries')
        .select('*')
        .eq('judge_assignment_id', assignmentId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBallot(data);
        setWinner(data.winner || '');
        setComments(data.comments || '');
        setAffPoints(data.aff_points?.toString() || '');
        setNegPoints(data.neg_points?.toString() || '');
        setAffRank(data.aff_rank?.toString() || '');
        setNegRank(data.neg_rank?.toString() || '');
        setAffFeedback(data.aff_feedback || '');
        setNegFeedback(data.neg_feedback || '');
      } else {
        setBallot(null);
        setWinner('');
        setComments('');
        setAffPoints('');
        setNegPoints('');
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

  const saveBallot = async (status: 'draft' | 'submitted', auto = false) => {
    if (!judgeProfileId || !judgeUserId) return;
    if (!auto) setSaving(true);
    try {
      const payload = {
        winner,
        comments,
        aff_points: affPoints ? parseFloat(affPoints) : null,
        neg_points: negPoints ? parseFloat(negPoints) : null,
        aff_rank: affRank ? parseInt(affRank) : null,
        neg_rank: negRank ? parseInt(negRank) : null,
        aff_feedback: affFeedback,
        neg_feedback: negFeedback,
      };

      if (ballot) {
        const { data, error } = await supabase
          .from('ballot_entries')
          .update({ ...payload, status, updated_at: new Date().toISOString() })
          .eq('id', ballot.id)
          .select()
          .single();

        if (error) throw error;
        setBallot(data);
      } else {
        const { data, error } = await supabase
          .from('ballot_entries')
          .insert({
            judge_assignment_id: assignmentId,
            judge_profile_id: judgeProfileId,
            judge_user_id: judgeUserId,
            ...payload,
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
                <Label htmlFor="aff-points">Affirmative Points</Label>
                <input
                  id="aff-points"
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  value={affPoints}
                  onChange={(e) => setAffPoints(e.target.value)}
                  disabled={!canEdit}
                  className="w-full p-2 border rounded-md disabled:opacity-50 disabled:bg-muted"
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neg-points">Negative Points</Label>
                <input
                  id="neg-points"
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  value={negPoints}
                  onChange={(e) => setNegPoints(e.target.value)}
                  disabled={!canEdit}
                  className="w-full p-2 border rounded-md disabled:opacity-50 disabled:bg-muted"
                  placeholder="0.0"
                />
              </div>
            </div>

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
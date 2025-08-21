import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Gavel, Save, Send, Eye } from 'lucide-react';

interface BallotEntryProps {
  pairingId: string;
  tournamentName: string;
  roundName: string;
  affParticipant: string;
  negParticipant: string;
  isOpen: boolean;
  onClose: () => void;
  onBallotSubmitted: () => void;
}

export function BallotEntry({
  pairingId,
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && pairingId) {
      fetchBallot();
    }
  }, [isOpen, pairingId]);

  const fetchBallot = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ballots')
        .select('*')
        .eq('pairing_id', pairingId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBallot(data);
        const payload = (data.payload as any) || {};
        setWinner(payload.winner || '');
        setComments(payload.comments || '');
        setAffPoints(payload.aff_points || '');
        setNegPoints(payload.neg_points || '');
      } else {
        // Initialize empty ballot
        setBallot(null);
        setWinner('');
        setComments('');
        setAffPoints('');
        setNegPoints('');
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

  const saveBallot = async (status: 'draft' | 'submitted') => {
    setSaving(true);
    try {
      const payload = {
        winner,
        comments,
        aff_points: affPoints,
        neg_points: negPoints,
      };

      if (ballot) {
        // Update existing ballot
        const { error } = await supabase
          .from('ballots')
          .update({
            payload,
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ballot.id);

        if (error) throw error;
      } else {
        // Create new ballot
        const { data: judgeProfile } = await supabase
          .from('judge_profiles')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (!judgeProfile) throw new Error('Judge profile not found');

        const { error } = await supabase
          .from('ballots')
          .insert({
            pairing_id: pairingId,
            judge_profile_id: judgeProfile.id,
            judge_user_id: (await supabase.auth.getUser()).data.user?.id,
            payload,
            status,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: status === 'submitted' ? "Ballot submitted successfully" : "Ballot saved as draft",
      });

      if (status === 'submitted') {
        onBallotSubmitted();
        onClose();
      } else {
        fetchBallot(); // Refresh ballot data
      }
    } catch (error: any) {
      console.error('Error saving ballot:', error);
      toast({
        title: "Error",
        description: "Failed to save ballot",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const canEdit = !ballot || ballot.status !== 'submitted';

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
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface ScheduleProposalModalProps {
  pairingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function ScheduleProposalModal({ pairingId, isOpen, onClose, onSubmit }: ScheduleProposalModalProps) {
  const { user } = useOptimizedAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    proposed_time: '',
    proposed_room: '',
    note: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.proposed_time) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('schedule_proposals')
        .insert({
          pairing_id: pairingId,
          proposer_user_id: user.id,
          proposed_time: formData.proposed_time,
          proposed_room: formData.proposed_room || null,
          note: formData.note || null
        });

      if (error) throw error;

      toast({
        title: "Schedule Proposal Submitted",
        description: "Your schedule proposal has been sent for approval.",
      });

      setFormData({ proposed_time: '', proposed_room: '', note: '' });
      onSubmit();
      onClose();
    } catch (error: any) {
      console.error('Error submitting schedule proposal:', error);
      toast({
        title: "Error",
        description: "Failed to submit schedule proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Propose Schedule Change
          </DialogTitle>
          <DialogDescription>
            Suggest an alternative time or room for your match. This will need approval from all parties.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proposed_time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Proposed Time *
            </Label>
            <Input
              id="proposed_time"
              type="datetime-local"
              value={formData.proposed_time}
              onChange={(e) => setFormData(prev => ({ ...prev, proposed_time: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposed_room" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Proposed Room/Location
            </Label>
            <Input
              id="proposed_room"
              value={formData.proposed_room}
              onChange={(e) => setFormData(prev => ({ ...prev, proposed_room: e.target.value }))}
              placeholder="e.g., Zoom Room 1, Classroom A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Additional Notes</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Explain the reason for the schedule change..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.proposed_time}>
              {loading ? "Submitting..." : "Submit Proposal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
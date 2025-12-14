import { useState, useEffect } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Loader2, Check, Clock, X } from 'lucide-react';
import { toast } from 'sonner';

interface SpectateRequestButtonProps {
  pairingId: string;
  tournamentId: string;
  compact?: boolean;
}

interface SpectateRequest {
  id: string;
  status: string;
  aff_team_approval: boolean;
  neg_team_approval: boolean;
}

export default function SpectateRequestButton({
  pairingId,
  tournamentId,
  compact = false
}: SpectateRequestButtonProps) {
  const { user } = useOptimizedAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<SpectateRequest | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from('spectate_requests')
        .select('id, status, aff_team_approval, neg_team_approval')
        .eq('pairing_id', pairingId)
        .eq('requester_user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setExistingRequest(data);
      }
      setChecking(false);
    };

    checkExistingRequest();
    
    // Poll for updates every 15 seconds
    const interval = setInterval(checkExistingRequest, 15000);
    return () => clearInterval(interval);
  }, [pairingId, user]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to request spectating');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('spectate_requests')
        .insert({
          pairing_id: pairingId,
          tournament_id: tournamentId,
          requester_user_id: user.id,
          reason: reason.trim() || null,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Spectate request submitted');
      setExistingRequest({
        id: '',
        status: 'pending',
        aff_team_approval: false,
        neg_team_approval: false
      });
      setOpen(false);
    } catch (error: any) {
      console.error('Error submitting spectate request:', error);
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return compact ? (
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    ) : (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking...
      </Button>
    );
  }

  // Show status if request exists
  if (existingRequest) {
    if (existingRequest.status === 'approved') {
      return compact ? (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <Check className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      ) : (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
          <Check className="h-4 w-4" />
          Spectate Approved
        </Badge>
      );
    }

    if (existingRequest.status === 'rejected') {
      return compact ? (
        <Badge variant="destructive">
          <X className="h-3 w-3 mr-1" />
          Denied
        </Badge>
      ) : (
        <Badge variant="destructive" className="gap-1">
          <X className="h-4 w-4" />
          Request Denied
        </Badge>
      );
    }

    // Pending status
    return compact ? (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <Clock className="h-3 w-3 mr-1" />
        {existingRequest.aff_team_approval ? '✓' : '⏳'}
        {existingRequest.neg_team_approval ? '✓' : '⏳'}
      </Badge>
    ) : (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
        <Clock className="h-4 w-4" />
        Pending: AFF {existingRequest.aff_team_approval ? '✓' : '⏳'} NEG {existingRequest.neg_team_approval ? '✓' : '⏳'}
      </Badge>
    );
  }

  // No request - show button to request
  if (compact) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Request to Spectate</DialogTitle>
            <DialogDescription>
              Both teams must approve your request before you can observe this match.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Why would you like to spectate this match? (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Eye className="h-4 w-4" />
          Request to Spectate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request to Spectate</DialogTitle>
          <DialogDescription>
            Both teams must approve your request before you can observe this match.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Why would you like to spectate this match? (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[100px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

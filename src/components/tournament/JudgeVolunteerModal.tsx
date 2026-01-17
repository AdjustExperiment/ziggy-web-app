import { useState } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Gavel, Calendar, Users, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Pairing {
  id: string;
  scheduled_time: string | null;
  aff_team?: {
    id?: string;
    participant_name: string;
    partner_name: string | null;
    school_organization: string | null;
    participant_email?: string;
  };
  neg_team?: {
    id?: string;
    participant_name: string;
    partner_name: string | null;
    school_organization: string | null;
    participant_email?: string;
  };
}

interface JudgeVolunteerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pairing: Pairing;
  tournamentId: string;
  onSuccess?: () => void;
}

export default function JudgeVolunteerModal({
  open,
  onOpenChange,
  pairing,
  tournamentId,
  onSuccess
}: JudgeVolunteerModalProps) {
  const { user } = useOptimizedAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hasConflicts, setHasConflicts] = useState(false);

  const formatTeamName = (team?: Pairing['aff_team']) => {
    if (!team) return 'TBD';
    if (team.partner_name) {
      return `${team.participant_name} / ${team.partner_name}`;
    }
    return team.participant_name;
  };

  const handleVolunteer = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's judge profile
      const { data: judgeProfile, error: profileError } = await supabase
        .from('judge_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !judgeProfile) {
        toast.error('You must have a judge profile to volunteer');
        return;
      }

      // Check for conflicts
      const { data: conflicts } = await supabase
        .from('judge_team_conflicts')
        .select('registration_id')
        .eq('judge_profile_id', judgeProfile.id)
        .eq('tournament_id', tournamentId);

      const conflictIds = conflicts?.map(c => c.registration_id) || [];

      // Check if either team's registration is a conflict - we'll check after getting pairing data
      if (conflictIds.length > 0) {
        // We'll check conflicts when we have the actual registration IDs
        const { data: pairingCheck } = await supabase
          .from('pairings')
          .select('aff_registration_id, neg_registration_id')
          .eq('id', pairing.id)
          .single();
        
        if (pairingCheck && (conflictIds.includes(pairingCheck.aff_registration_id) || conflictIds.includes(pairingCheck.neg_registration_id))) {
          setHasConflicts(true);
          toast.error('You have a conflict with one of the teams in this pairing');
          setLoading(false);
          return;
        }
      }

      // Insert volunteer assignment
      const { error: assignError } = await supabase
        .from('pairing_judge_assignments')
        .insert({
          pairing_id: pairing.id,
          judge_profile_id: judgeProfile.id,
          role: 'chair',
          status: 'volunteered',
          notes: 'Volunteered through tournament interface'
        });

      if (assignError) {
        throw assignError;
      }

      // Create notification for competitors
      const { data: pairingData } = await supabase
        .from('pairings')
        .select('aff_registration_id, neg_registration_id, tournament_id, round_id')
        .eq('id', pairing.id)
        .single();

      if (pairingData) {
        const notifications = [
          {
            registration_id: pairingData.aff_registration_id,
            tournament_id: pairingData.tournament_id,
            round_id: pairingData.round_id,
            pairing_id: pairing.id,
            type: 'judge_volunteer',
            title: 'Judge Volunteered',
            message: `A judge has volunteered for your match`
          },
          {
            registration_id: pairingData.neg_registration_id,
            tournament_id: pairingData.tournament_id,
            round_id: pairingData.round_id,
            pairing_id: pairing.id,
            type: 'judge_volunteer',
            title: 'Judge Volunteered',
            message: `A judge has volunteered for your match`
          }
        ];

        await supabase.from('competitor_notifications').insert(notifications);
      }

      toast.success('Successfully volunteered to judge this round!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error volunteering:', error);
      toast.error(error.message || 'Failed to volunteer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            Volunteer to Judge
          </DialogTitle>
          <DialogDescription>
            Review the match details before confirming your availability
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Match Preview */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Affirmative</p>
                  <p className="font-medium text-primary">{formatTeamName(pairing.aff_team)}</p>
                  {pairing.aff_team?.school_organization && (
                    <p className="text-xs text-muted-foreground">{pairing.aff_team.school_organization}</p>
                  )}
                </div>
                <span className="text-muted-foreground px-2">vs</span>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase">Negative</p>
                  <p className="font-medium">{formatTeamName(pairing.neg_team)}</p>
                  {pairing.neg_team?.school_organization && (
                    <p className="text-xs text-muted-foreground">{pairing.neg_team.school_organization}</p>
                  )}
                </div>
              </div>

              {pairing.scheduled_time && (
                <div className="flex items-center gap-2 text-sm pt-2 border-t border-border">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(pairing.scheduled_time), 'EEEE, MMMM d, yyyy')}</span>
                  <span className="text-muted-foreground">at</span>
                  <span>{format(new Date(pairing.scheduled_time), 'h:mm a')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {hasConflicts && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">You have a conflict with one of these teams</span>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              By volunteering, you confirm you're available and have no conflicts
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleVolunteer} disabled={loading || hasConflicts}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <Gavel className="h-4 w-4 mr-2" />
                Confirm Volunteer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

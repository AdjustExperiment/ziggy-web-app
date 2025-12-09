import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Eye, Clock, CheckCircle, EyeOff, Loader2 } from 'lucide-react';

interface TournamentBallotRevealSettingsProps {
  tournamentId: string;
}

export function TournamentBallotRevealSettings({ tournamentId }: TournamentBallotRevealSettingsProps) {
  const [ballotRevealMode, setBallotRevealMode] = useState<string>('after_tournament');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    fetchTournamentSettings();
  }, [tournamentId]);

  const fetchTournamentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('ballot_reveal_mode')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      setBallotRevealMode(data?.ballot_reveal_mode || 'after_tournament');
    } catch (error: any) {
      console.error('Error fetching tournament settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRevealMode = async (mode: string) => {
    try {
      setUpdating(true);
      setBallotRevealMode(mode);

      const { error } = await supabase
        .from('tournaments')
        .update({ ballot_reveal_mode: mode })
        .eq('id', tournamentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ballot reveal mode updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update ballot reveal mode",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const revealTournamentResults = async () => {
    if (!confirm('Are you sure you want to reveal all results? This action cannot be undone.')) {
      return;
    }

    try {
      setRevealing(true);

      const { data, error } = await supabase.rpc('reveal_tournament_results', {
        p_tournament_id: tournamentId
      });
      
      if (error) throw error;

      // Fetch pairings with submitted ballots and notify competitors
      const { data: pairings } = await supabase
        .from('pairings')
        .select(`
          id,
          aff_registration_id,
          neg_registration_id,
          rounds(name)
        `)
        .eq('tournament_id', tournamentId);

      const notifications: any[] = [];
      for (const pairing of pairings || []) {
        const roundName = (pairing.rounds as any)?.name || 'your round';
        if (pairing.aff_registration_id) {
          notifications.push({
            registration_id: pairing.aff_registration_id,
            tournament_id: tournamentId,
            pairing_id: pairing.id,
            title: 'Results Published',
            message: `Results for ${roundName} are now available. View your ballot feedback.`,
            type: 'result_published'
          });
        }
        if (pairing.neg_registration_id && pairing.neg_registration_id !== pairing.aff_registration_id) {
          notifications.push({
            registration_id: pairing.neg_registration_id,
            tournament_id: tournamentId,
            pairing_id: pairing.id,
            title: 'Results Published',
            message: `Results for ${roundName} are now available. View your ballot feedback.`,
            type: 'result_published'
          });
        }
      }

      if (notifications.length > 0) {
        await supabase.from('competitor_notifications').insert(notifications);
      }

      toast({
        title: "Results Revealed",
        description: `${data || 0} ballots have been revealed to competitors`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reveal results",
        variant: "destructive",
      });
    } finally {
      setRevealing(false);
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
      <div>
        <h3 className="text-lg font-semibold">Ballot Reveal Settings</h3>
        <p className="text-muted-foreground text-sm">
          Control when ballot results are revealed to competitors
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={ballotRevealMode === 'auto_on_submit' ? 'ring-2 ring-primary' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Auto on Submit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ballots are automatically revealed to competitors as soon as judges submit them. 
              Best for tournaments where immediate feedback is desired.
            </p>
          </CardContent>
        </Card>
        
        <Card className={ballotRevealMode === 'after_tournament' ? 'ring-2 ring-primary' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-blue-500" />
              After Tournament (Manual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ballots remain hidden until you manually reveal them. 
              Competitors see "Results Pending" until revealed.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Current Reveal Mode</Label>
          <Select
            value={ballotRevealMode}
            onValueChange={updateRevealMode}
            disabled={updating}
          >
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto_on_submit">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Auto on Submit
                </div>
              </SelectItem>
              <SelectItem value="after_tournament">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4 text-blue-500" />
                  After Tournament
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={revealTournamentResults}
            disabled={revealing}
            variant="outline"
          >
            {revealing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Reveal All Results Now
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This will immediately reveal all submitted ballots to competitors.
          </p>
        </div>
      </div>
    </div>
  );
}

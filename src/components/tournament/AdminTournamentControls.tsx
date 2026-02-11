import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Play,
  CheckCircle,
  Eye,
  EyeOff,
  Shield,
  Loader2,
  Settings2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Round {
  id: string;
  name: string;
  round_number: number;
  status: string;
  scheduled_date: string | null;
  event_id: string | null;
}

interface AdminTournamentControlsProps {
  tournamentId: string;
  rounds: Round[];
  selectedRoundId: string | null;
  onRoundsUpdate: () => void;
  onRoundSelect: (roundId: string) => void;
  eventId?: string | null;
}

export default function AdminTournamentControls({
  tournamentId,
  rounds,
  selectedRoundId,
  onRoundsUpdate,
  onRoundSelect,
  eventId,
}: AdminTournamentControlsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showCreateRound, setShowCreateRound] = useState(false);
  const [newRoundName, setNewRoundName] = useState('');
  const [newRoundDate, setNewRoundDate] = useState('');

  const selectedRound = rounds.find(r => r.id === selectedRoundId);

  const createRound = async () => {
    if (!newRoundName.trim()) return;
    setLoading(true);
    try {
      const nextNumber = rounds.length > 0
        ? Math.max(...rounds.map(r => r.round_number)) + 1
        : 1;

      const { error } = await supabase.from('rounds').insert({
        tournament_id: tournamentId,
        name: newRoundName.trim(),
        round_number: nextNumber,
        scheduled_date: newRoundDate || null,
        status: 'upcoming',
        event_id: eventId || null,
      });

      if (error) throw error;
      toast.success('Round created');
      setNewRoundName('');
      setNewRoundDate('');
      setShowCreateRound(false);
      onRoundsUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create round');
    } finally {
      setLoading(false);
    }
  };

  const updateRoundStatus = async (roundId: string, status: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('rounds')
        .update({ status })
        .eq('id', roundId);

      if (error) throw error;
      toast.success(`Round marked as ${status.replace('_', ' ')}`);
      onRoundsUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update round');
    } finally {
      setLoading(false);
    }
  };

  const togglePairingRelease = async (release: boolean) => {
    if (!selectedRoundId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('pairings')
        .update({ released: release })
        .eq('round_id', selectedRoundId);

      if (error) throw error;
      toast.success(release ? 'Pairings released' : 'Pairings hidden');
      onRoundsUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update pairings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/30 bg-primary/5">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Admin Controls
              </CardTitle>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Round Status Controls */}
            {selectedRound && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {selectedRound.name} — Status: <Badge variant="outline" className="ml-1">{selectedRound.status}</Badge>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedRound.status !== 'in_progress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      onClick={() => updateRoundStatus(selectedRound.id, 'in_progress')}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start Round
                    </Button>
                  )}
                  {selectedRound.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      onClick={() => updateRoundStatus(selectedRound.id, 'completed')}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete Round
                    </Button>
                  )}
                  {selectedRound.status !== 'upcoming' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={loading}
                      onClick={() => updateRoundStatus(selectedRound.id, 'upcoming')}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset to Upcoming
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Pairing Release Controls */}
            {selectedRoundId && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={() => togglePairingRelease(true)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Release Pairings
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loading}
                  onClick={() => togglePairingRelease(false)}
                >
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide Pairings
                </Button>
              </div>
            )}

            {/* Create Round */}
            <Dialog open={showCreateRound} onOpenChange={setShowCreateRound}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="w-full">
                  <Plus className="h-3 w-3 mr-1" />
                  Create New Round
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Round</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label htmlFor="round-name">Round Name</Label>
                    <Input
                      id="round-name"
                      value={newRoundName}
                      onChange={(e) => setNewRoundName(e.target.value)}
                      placeholder="e.g., Preliminary Round 3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="round-date">Scheduled Date (optional)</Label>
                    <Input
                      id="round-date"
                      type="date"
                      value={newRoundDate}
                      onChange={(e) => setNewRoundDate(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateRound(false)}>Cancel</Button>
                  <Button onClick={createRound} disabled={loading || !newRoundName.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Link to full admin dashboard */}
            <Button
              size="sm"
              variant="link"
              className="text-xs p-0 h-auto"
              onClick={() => window.open(`/admin?tab=tabulation&tournament=${tournamentId}`, '_blank')}
            >
              <Settings2 className="h-3 w-3 mr-1" />
              Open Full Admin Dashboard
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AlertTriangle, Search, User, Users, Loader2, X, ArrowLeftRight, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  participant_name: string;
  partner_name: string | null;
  school_organization: string | null;
}

interface Judge {
  id: string;
  name: string;
  email?: string;
  alumni: boolean;
}

interface Pairing {
  id: string;
  aff_registration_id: string;
  neg_registration_id: string;
  judge_id: string | null;
  room: string | null;
  scheduled_time: string | null;
  status: string;
  result: any;
  released: boolean;
  aff_team?: Team;
  neg_team?: Team;
  judge?: Judge | null;
}

interface PairingEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pairing: Pairing;
  tournamentId: string;
  registrations: Team[];
  judges: Judge[];
  onSave: () => void;
}

export default function PairingEditModal({
  open,
  onOpenChange,
  pairing,
  tournamentId,
  registrations,
  judges,
  onSave
}: PairingEditModalProps) {
  const [affTeamId, setAffTeamId] = useState(pairing.aff_registration_id);
  const [negTeamId, setNegTeamId] = useState(pairing.neg_registration_id);
  const [judgeId, setJudgeId] = useState<string | null>(pairing.judge_id);
  const [room, setRoom] = useState(pairing.room || '');
  const [scheduledTime, setScheduledTime] = useState(
    pairing.scheduled_time ? format(new Date(pairing.scheduled_time), "yyyy-MM-dd'T'HH:mm") : ''
  );
  
  const [affSearch, setAffSearch] = useState('');
  const [negSearch, setNegSearch] = useState('');
  const [judgeSearch, setJudgeSearch] = useState('');
  
  const [showAffDropdown, setShowAffDropdown] = useState(false);
  const [showNegDropdown, setShowNegDropdown] = useState(false);
  const [showJudgeDropdown, setShowJudgeDropdown] = useState(false);
  
  const [saving, setSaving] = useState(false);

  // Track if we have tab data that would be affected
  const hasTabData = pairing.result !== null;
  
  // Check if team changes occurred
  const teamChanged = affTeamId !== pairing.aff_registration_id || 
                      negTeamId !== pairing.neg_registration_id;
  
  // Show warning if changing teams when there's tab data
  const showWarning = hasTabData && teamChanged;

  // Filter registrations based on search
  const filteredAffTeams = useMemo(() => {
    if (!affSearch) return registrations.slice(0, 10);
    const search = affSearch.toLowerCase();
    return registrations.filter(r => 
      r.participant_name.toLowerCase().includes(search) ||
      (r.partner_name && r.partner_name.toLowerCase().includes(search)) ||
      (r.school_organization && r.school_organization.toLowerCase().includes(search))
    ).slice(0, 10);
  }, [registrations, affSearch]);

  const filteredNegTeams = useMemo(() => {
    if (!negSearch) return registrations.slice(0, 10);
    const search = negSearch.toLowerCase();
    return registrations.filter(r => 
      r.participant_name.toLowerCase().includes(search) ||
      (r.partner_name && r.partner_name.toLowerCase().includes(search)) ||
      (r.school_organization && r.school_organization.toLowerCase().includes(search))
    ).slice(0, 10);
  }, [registrations, negSearch]);

  const filteredJudges = useMemo(() => {
    if (!judgeSearch) return judges.slice(0, 10);
    const search = judgeSearch.toLowerCase();
    return judges.filter(j => 
      j.name.toLowerCase().includes(search) ||
      j.email.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [judges, judgeSearch]);

  const selectedAffTeam = registrations.find(r => r.id === affTeamId);
  const selectedNegTeam = registrations.find(r => r.id === negTeamId);
  const selectedJudge = judges.find(j => j.id === judgeId);

  const formatTeamDisplay = (team?: Team) => {
    if (!team) return 'Select team...';
    if (team.partner_name) {
      return `${team.participant_name} / ${team.partner_name}`;
    }
    return team.participant_name;
  };

  const handleSwapSides = () => {
    const temp = affTeamId;
    setAffTeamId(negTeamId);
    setNegTeamId(temp);
  };

  const handleSave = async () => {
    if (!affTeamId || !negTeamId) {
      toast.error('Both teams are required');
      return;
    }

    if (affTeamId === negTeamId) {
      toast.error('A team cannot debate itself');
      return;
    }

    setSaving(true);

    try {
      const updates: any = {
        aff_registration_id: affTeamId,
        neg_registration_id: negTeamId,
        judge_id: judgeId || null,
        room: room || null,
        scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : null
      };

      // If teams changed and there's tab data, log it
      if (showWarning) {
        // Get user ID first to avoid async issues in insert
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id || 'unknown';
        
        // Log the edit for audit purposes
        await supabase.from('pairing_edit_history').insert({
          pairing_id: pairing.id,
          changed_by: userId,
          field_changed: 'team_replacement',
          old_value: {
            aff: pairing.aff_registration_id,
            neg: pairing.neg_registration_id
          },
          new_value: {
            aff: affTeamId,
            neg: negTeamId
          },
          change_reason: 'Admin team replacement with existing tab data'
        });
      }

      const { error } = await supabase
        .from('pairings')
        .update(updates)
        .eq('id', pairing.id);

      if (error) throw error;

      toast.success('Pairing updated successfully');
      onSave();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error updating pairing:', err);
      toast.error('Failed to update pairing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Pairing</DialogTitle>
          <DialogDescription>
            Modify teams, judge, room, and schedule for this pairing.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Warning for tab data */}
            {showWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Tab Data Warning</AlertTitle>
                <AlertDescription>
                  This pairing has existing results/ballots. Changing teams may affect tabulation standings and records.
                  This change will be logged for audit purposes.
                </AlertDescription>
              </Alert>
            )}

            {/* Team Selection */}
            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-start">
              {/* Affirmative Team */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary">AFF</Badge>
                  Affirmative Team
                </Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={affSearch || formatTeamDisplay(selectedAffTeam)}
                      onChange={(e) => {
                        setAffSearch(e.target.value);
                        setShowAffDropdown(true);
                      }}
                      onFocus={() => {
                        setAffSearch('');
                        setShowAffDropdown(true);
                      }}
                      onBlur={() => setTimeout(() => setShowAffDropdown(false), 200)}
                      placeholder="Search teams..."
                      className="pl-10"
                    />
                  </div>
                  
                  {showAffDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-auto">
                      {filteredAffTeams.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">No teams found</div>
                      ) : (
                        filteredAffTeams.map(team => (
                          <button
                            key={team.id}
                            className={cn(
                              "w-full text-left px-3 py-2 hover:bg-accent transition-colors",
                              team.id === affTeamId && "bg-accent"
                            )}
                            onClick={() => {
                              setAffTeamId(team.id);
                              setAffSearch('');
                              setShowAffDropdown(false);
                            }}
                          >
                            <div className="font-medium text-sm">
                              {team.participant_name}
                              {team.partner_name && ` / ${team.partner_name}`}
                            </div>
                            {team.school_organization && (
                              <div className="text-xs text-muted-foreground">{team.school_organization}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedAffTeam?.school_organization && (
                  <p className="text-xs text-muted-foreground">{selectedAffTeam.school_organization}</p>
                )}
              </div>

              {/* Swap Button */}
              <div className="pt-8">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleSwapSides}
                  title="Swap sides"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Negative Team */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Badge variant="outline">NEG</Badge>
                  Negative Team
                </Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={negSearch || formatTeamDisplay(selectedNegTeam)}
                      onChange={(e) => {
                        setNegSearch(e.target.value);
                        setShowNegDropdown(true);
                      }}
                      onFocus={() => {
                        setNegSearch('');
                        setShowNegDropdown(true);
                      }}
                      onBlur={() => setTimeout(() => setShowNegDropdown(false), 200)}
                      placeholder="Search teams..."
                      className="pl-10"
                    />
                  </div>
                  
                  {showNegDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-auto">
                      {filteredNegTeams.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">No teams found</div>
                      ) : (
                        filteredNegTeams.map(team => (
                          <button
                            key={team.id}
                            className={cn(
                              "w-full text-left px-3 py-2 hover:bg-accent transition-colors",
                              team.id === negTeamId && "bg-accent"
                            )}
                            onClick={() => {
                              setNegTeamId(team.id);
                              setNegSearch('');
                              setShowNegDropdown(false);
                            }}
                          >
                            <div className="font-medium text-sm">
                              {team.participant_name}
                              {team.partner_name && ` / ${team.partner_name}`}
                            </div>
                            {team.school_organization && (
                              <div className="text-xs text-muted-foreground">{team.school_organization}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedNegTeam?.school_organization && (
                  <p className="text-xs text-muted-foreground">{selectedNegTeam.school_organization}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Judge Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Judge
              </Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={judgeSearch || (selectedJudge?.name || 'No judge assigned')}
                    onChange={(e) => {
                      setJudgeSearch(e.target.value);
                      setShowJudgeDropdown(true);
                    }}
                    onFocus={() => {
                      setJudgeSearch('');
                      setShowJudgeDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowJudgeDropdown(false), 200)}
                    placeholder="Search judges..."
                    className="pl-10"
                  />
                  {judgeId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setJudgeId(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {showJudgeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-auto">
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-accent transition-colors text-muted-foreground"
                      onClick={() => {
                        setJudgeId(null);
                        setJudgeSearch('');
                        setShowJudgeDropdown(false);
                      }}
                    >
                      No judge (Needed)
                    </button>
                    {filteredJudges.map(judge => (
                      <button
                        key={judge.id}
                        className={cn(
                          "w-full text-left px-3 py-2 hover:bg-accent transition-colors",
                          judge.id === judgeId && "bg-accent"
                        )}
                        onClick={() => {
                          setJudgeId(judge.id);
                          setJudgeSearch('');
                          setShowJudgeDropdown(false);
                        }}
                      >
                        <div className="font-medium text-sm flex items-center gap-2">
                          {judge.name}
                          {judge.alumni && (
                            <Badge variant="outline" className="text-xs">[A]</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{judge.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Room & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Room / Meeting Link
                </Label>
                <Input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Room number or meeting URL"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Scheduled Time</Label>
                <Input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

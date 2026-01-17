import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, UserCheck, Clock, CheckCircle2, AlertCircle, Edit2, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import ExpandablePairing from './ExpandablePairing';
import SpectateRequestButton from './SpectateRequestButton';
import PairingEditModal from './PairingEditModal';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


interface Team {
  id: string;
  participant_name: string;
  partner_name: string | null;
  school_organization: string | null;
  participant_email?: string;
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

interface RoundPairingsTableProps {
  pairings: Pairing[];
  roundId: string;
  tournamentId: string;
  userRole: 'admin' | 'judge' | 'competitor' | 'observer' | 'spectator' | null;
  userRegistrationId?: string | null;
  userJudgeProfileId?: string | null;
  allowJudgeVolunteering?: boolean;
  onRefresh?: () => void;
  isAdmin?: boolean;
  allRegistrations?: Team[];
  allJudges?: Judge[];
}

export default function RoundPairingsTable({
  pairings,
  roundId,
  tournamentId,
  userRole,
  userRegistrationId,
  userJudgeProfileId,
  allowJudgeVolunteering = false,
  onRefresh,
  isAdmin = false,
  allRegistrations = [],
  allJudges = []
}: RoundPairingsTableProps) {
  const [expandedPairingId, setExpandedPairingId] = useState<string | null>(null);
  const [editingPairing, setEditingPairing] = useState<Pairing | null>(null);
  const isMobile = useIsMobile();

  const toggleExpand = (pairingId: string) => {
    setExpandedPairingId(expandedPairingId === pairingId ? null : pairingId);
  };

  const getStatusBadge = (pairing: Pairing) => {
    if (pairing.result) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Done
        </Badge>
      );
    }
    if (pairing.status === 'in_progress') {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
          <Clock className="h-3 w-3" />
          In Progress
        </Badge>
      );
    }
    if (!pairing.judge_id) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
          <AlertCircle className="h-3 w-3" />
          Needs Judge
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        Scheduled
      </Badge>
    );
  };

  // Format team name - delegates to shared utility but with custom logic for compact display
  const formatTeamName = (team?: Pairing['aff_team']) => {
    if (!team) return 'TBD';
    
    const getLastName = (fullName: string) => {
      const parts = fullName.trim().split(' ');
      return parts.length > 1 ? parts[parts.length - 1] : fullName;
    };
    
    if (team.partner_name) {
      // Team format: LastName/LastName (compact for table)
      return `${getLastName(team.participant_name)}/${getLastName(team.partner_name)}`;
    }
    // Individual format: Full Name
    return team.participant_name;
  };

  const isUserPairing = (pairing: Pairing) => {
    return userRegistrationId && 
      (pairing.aff_registration_id === userRegistrationId || pairing.neg_registration_id === userRegistrationId);
  };

  const isUserJudging = (pairing: Pairing) => {
    return userJudgeProfileId && pairing.judge_id === userJudgeProfileId;
  };

  const handleEditPairing = (pairing: Pairing, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPairing(pairing);
  };

  const handleSwapSides = async (pairing: Pairing, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from('pairings')
      .update({
        aff_registration_id: pairing.neg_registration_id,
        neg_registration_id: pairing.aff_registration_id
      })
      .eq('id', pairing.id);

    if (error) {
      toast.error('Failed to swap sides');
    } else {
      toast.success('Sides swapped');
      onRefresh?.();
    }
  };

  const expandedPairing = pairings.find(p => p.id === expandedPairingId);

  // Mobile card layout
  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {pairings.map((pairing) => (
            <div
              key={pairing.id}
              className={cn(
                "rounded-lg border border-border bg-card p-4 cursor-pointer transition-colors hover:bg-accent/50",
                isUserPairing(pairing) && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                isUserJudging(pairing) && "ring-2 ring-yellow-500 ring-offset-2 ring-offset-background",
                !pairing.released && "opacity-60 border-dashed"
              )}
              onClick={() => toggleExpand(pairing.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusBadge(pairing)}
                  {!pairing.released && (
                    <Badge variant="outline" className="text-xs">Unreleased</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleSwapSides(pairing, e)}>
                        <ArrowLeftRight className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleEditPairing(pairing, e)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {userRole === 'spectator' && (
                    <SpectateRequestButton pairingId={pairing.id} tournamentId={tournamentId} compact />
                  )}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary text-xs shrink-0">AFF</Badge>
                  <span className="font-medium truncate">{formatTeamName(pairing.aff_team)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs shrink-0">NEG</Badge>
                  <span className="font-medium truncate">{formatTeamName(pairing.neg_team)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  {pairing.judge?.name || 'No Judge'}
                  {pairing.judge?.alumni && <span className="text-primary">[A]</span>}
                </span>
                {pairing.scheduled_time && (
                  <span className="text-xs">{format(new Date(pairing.scheduled_time), 'h:mm a')}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Sheet for expanded view */}
        <Sheet open={!!expandedPairingId} onOpenChange={(open) => !open && setExpandedPairingId(null)}>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {expandedPairing && `${formatTeamName(expandedPairing.aff_team)} vs ${formatTeamName(expandedPairing.neg_team)}`}
              </SheetTitle>
            </SheetHeader>
            {expandedPairing && (
              <ExpandablePairing
                pairing={expandedPairing}
                roundId={roundId}
                tournamentId={tournamentId}
                userRole={userRole}
                userRegistrationId={userRegistrationId}
                userJudgeProfileId={userJudgeProfileId}
                allowJudgeVolunteering={allowJudgeVolunteering}
                onClose={() => setExpandedPairingId(null)}
                onRefresh={onRefresh}
              />
            )}
          </SheetContent>
        </Sheet>

        {/* Edit Modal */}
        {editingPairing && (
          <PairingEditModal
            open={!!editingPairing}
            onOpenChange={(open) => !open && setEditingPairing(null)}
            pairing={editingPairing}
            tournamentId={tournamentId}
            registrations={allRegistrations.length > 0 ? allRegistrations : 
              pairings.flatMap(p => [p.aff_team, p.neg_team].filter(Boolean)) as Team[]
            }
            judges={allJudges.length > 0 ? allJudges : 
              pairings.map(p => p.judge).filter(Boolean) as Judge[]
            }
            onSave={() => {
              setEditingPairing(null);
              onRefresh?.();
            }}
          />
        )}
      </>
    );
  }

  // Desktop table layout
  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px]">Affirmative</TableHead>
              <TableHead className="w-[200px]">Negative</TableHead>
              <TableHead>Judge</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pairings.map((pairing) => (
              <>
                <TableRow
                  key={pairing.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent/50",
                    expandedPairingId === pairing.id && "bg-accent",
                    isUserPairing(pairing) && "bg-primary/5",
                    isUserJudging(pairing) && "bg-yellow-500/5",
                    !pairing.released && "opacity-60"
                  )}
                  onClick={() => toggleExpand(pairing.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/20 text-primary text-xs shrink-0">AFF</Badge>
                      <span className="text-primary truncate">{formatTeamName(pairing.aff_team)}</span>
                    </div>
                    {pairing.aff_team?.school_organization && (
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        {pairing.aff_team.school_organization}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">NEG</Badge>
                      <span className="truncate">{formatTeamName(pairing.neg_team)}</span>
                    </div>
                    {pairing.neg_team?.school_organization && (
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        {pairing.neg_team.school_organization}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {pairing.judge ? (
                      <span className="flex items-center gap-1">
                        {pairing.judge.name}
                        {pairing.judge.alumni && <span className="text-primary font-medium">[A]</span>}
                      </span>
                    ) : (
                      <span className="text-red-400">Needed</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {pairing.room || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {pairing.scheduled_time ? (
                      <span className="text-sm">{format(new Date(pairing.scheduled_time), 'h:mm a')}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getStatusBadge(pairing)}
                      {!pairing.released && (
                        <Badge variant="outline" className="text-xs">Draft</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isAdmin && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={(e) => handleSwapSides(pairing, e)}
                            title="Swap sides"
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={(e) => handleEditPairing(pairing, e)}
                            title="Edit pairing"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {userRole === 'spectator' && (
                        <SpectateRequestButton pairingId={pairing.id} tournamentId={tournamentId} compact />
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {expandedPairingId === pairing.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedPairingId === pairing.id && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/30 p-0">
                      <ExpandablePairing
                        pairing={pairing}
                        roundId={roundId}
                        tournamentId={tournamentId}
                        userRole={userRole}
                        userRegistrationId={userRegistrationId}
                        userJudgeProfileId={userJudgeProfileId}
                        allowJudgeVolunteering={allowJudgeVolunteering}
                        onClose={() => setExpandedPairingId(null)}
                        onRefresh={onRefresh}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      {editingPairing && (
        <PairingEditModal
          open={!!editingPairing}
          onOpenChange={(open) => !open && setEditingPairing(null)}
          pairing={editingPairing as any}
          tournamentId={tournamentId}
          registrations={allRegistrations.length > 0 ? allRegistrations : 
            pairings.flatMap(p => [p.aff_team, p.neg_team].filter(Boolean)) as any[]
          }
          judges={allJudges.length > 0 ? allJudges : 
            pairings.map(p => p.judge).filter(Boolean) as any[]
          }
          onSave={() => {
            setEditingPairing(null);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}

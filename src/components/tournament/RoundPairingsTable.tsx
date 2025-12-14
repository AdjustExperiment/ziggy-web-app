import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Eye, UserCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import ExpandablePairing from './ExpandablePairing';
import SpectateRequestButton from './SpectateRequestButton';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
  aff_team?: {
    id: string;
    participant_name: string;
    partner_name: string | null;
    school_organization: string | null;
  };
  neg_team?: {
    id: string;
    participant_name: string;
    partner_name: string | null;
    school_organization: string | null;
  };
  judge?: {
    id: string;
    name: string;
    alumni: boolean;
  } | null;
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
}

export default function RoundPairingsTable({
  pairings,
  roundId,
  tournamentId,
  userRole,
  userRegistrationId,
  userJudgeProfileId,
  allowJudgeVolunteering = false,
  onRefresh
}: RoundPairingsTableProps) {
  const [expandedPairingId, setExpandedPairingId] = useState<string | null>(null);
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

  const formatTeamName = (team?: Pairing['aff_team']) => {
    if (!team) return 'TBD';
    if (team.partner_name) {
      return `${team.participant_name.split(' ').pop()}/${team.partner_name.split(' ').pop()}`;
    }
    return team.participant_name;
  };

  const isUserPairing = (pairing: Pairing) => {
    return userRegistrationId && 
      (pairing.aff_registration_id === userRegistrationId || pairing.neg_registration_id === userRegistrationId);
  };

  const isUserJudging = (pairing: Pairing) => {
    return userJudgeProfileId && pairing.judge_id === userJudgeProfileId;
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
                isUserJudging(pairing) && "ring-2 ring-yellow-500 ring-offset-2 ring-offset-background"
              )}
              onClick={() => toggleExpand(pairing.id)}
            >
              <div className="flex items-center justify-between mb-3">
                {getStatusBadge(pairing)}
                <div className="flex items-center gap-2">
                  {userRole === 'spectator' && (
                    <SpectateRequestButton
                      pairingId={pairing.id}
                      tournamentId={tournamentId}
                      compact
                    />
                  )}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-primary">{formatTeamName(pairing.aff_team)}</div>
                <span className="text-xs text-muted-foreground px-2">vs</span>
                <div className="font-medium">{formatTeamName(pairing.neg_team)}</div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  {pairing.judge?.name || 'No Judge'}
                  {pairing.judge?.alumni && <span className="text-primary">[A]</span>}
                </span>
                {pairing.scheduled_time && (
                  <span>{format(new Date(pairing.scheduled_time), 'MMM d, h:mm a')}</span>
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
      </>
    );
  }

  // Desktop table layout
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px]">Affirmative</TableHead>
            <TableHead className="w-[200px]">Negative</TableHead>
            <TableHead>Judge</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
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
                  isUserJudging(pairing) && "bg-yellow-500/5"
                )}
                onClick={() => toggleExpand(pairing.id)}
              >
                <TableCell className="font-medium">
                  <span className="text-primary">{formatTeamName(pairing.aff_team)}</span>
                  {pairing.aff_team?.school_organization && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({pairing.aff_team.school_organization})
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {formatTeamName(pairing.neg_team)}
                  {pairing.neg_team?.school_organization && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({pairing.neg_team.school_organization})
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
                  {pairing.scheduled_time ? (
                    format(new Date(pairing.scheduled_time), 'MMM d, h:mm a')
                  ) : (
                    <span className="text-muted-foreground">Not scheduled</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(pairing)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {userRole === 'spectator' && (
                      <SpectateRequestButton
                        pairingId={pairing.id}
                        tournamentId={tournamentId}
                        compact
                      />
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
                  <TableCell colSpan={6} className="bg-muted/30 p-0">
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
  );
}

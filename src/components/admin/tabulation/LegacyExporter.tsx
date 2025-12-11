import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react';
import {
  generateLegacyWorkbook,
  buildTeamDataRow,
  buildRoundRow,
  downloadWorkbook,
  type LegacyExportData,
} from '@/lib/legacyExcelFormat';

interface LegacyExporterProps {
  tournamentId: string;
  tournamentName?: string;
  eventId?: string | null;
}

export function LegacyExporter({ tournamentId, tournamentName, eventId }: LegacyExporterProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<LegacyExportData | null>(null);

  const fetchExportData = async (): Promise<LegacyExportData | null> => {
    try {
      // Fetch all required data in parallel
      const [registrationsRes, roundsRes, pairingsRes, ballotsRes] = await Promise.all([
        supabase
          .from('tournament_registrations')
          .select('*')
          .eq('tournament_id', tournamentId)
          .eq('is_active', true)
          .order('participant_name'),
        supabase
          .from('rounds')
          .select('*')
          .eq('tournament_id', tournamentId)
          .order('round_number'),
        supabase
          .from('pairings')
          .select(`
            *,
            aff_registration:tournament_registrations!pairings_aff_registration_id_fkey(id, participant_name, partner_name, school_organization),
            neg_registration:tournament_registrations!pairings_neg_registration_id_fkey(id, participant_name, partner_name, school_organization),
            round:rounds(id, round_number, name)
          `)
          .eq('tournament_id', tournamentId),
        supabase
          .from('ballots')
          .select('*')
          .in(
            'pairing_id',
            (await supabase.from('pairings').select('id').eq('tournament_id', tournamentId)).data?.map(p => p.id) || []
          ),
      ]);

      if (registrationsRes.error) throw registrationsRes.error;
      if (roundsRes.error) throw roundsRes.error;
      if (pairingsRes.error) throw pairingsRes.error;

      let registrations = registrationsRes.data || [];
      let rounds = roundsRes.data || [];
      let pairings = pairingsRes.data || [];
      const ballots = ballotsRes.data || [];

      // Filter by event if specified
      if (eventId) {
        registrations = registrations.filter(r => r.event_id === eventId);
        rounds = rounds.filter(r => r.event_id === eventId);
        pairings = pairings.filter(p => p.event_id === eventId);
      }

      // Build TeamData rows
      const teamData = registrations.map(reg => 
        buildTeamDataRow(reg, pairings, ballots)
      );

      // Build Round data
      const roundsData: { [roundNumber: number]: any[] } = {};
      for (const round of rounds) {
        const roundPairings = pairings.filter(p => p.round_id === round.id);
        roundsData[round.round_number] = roundPairings.map(pairing => {
          const ballot = ballots.find(b => b.pairing_id === pairing.id);
          return buildRoundRow(pairing, ballot, registrations);
        });
      }

      return { teamData, rounds: roundsData };
    } catch (error: any) {
      console.error('[LegacyExporter] Error fetching data:', error);
      toast({
        title: 'Export Error',
        description: error.message || 'Failed to fetch tournament data',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleExport = async (withPreview: boolean = false) => {
    setExporting(true);
    try {
      const data = await fetchExportData();
      if (!data) return;

      if (withPreview) {
        setPreviewData(data);
        setShowPreview(true);
      } else {
        const wb = generateLegacyWorkbook(data);
        const filename = `${tournamentName || 'tournament'}_NCFCA_Tab.xlsx`;
        downloadWorkbook(wb, filename);
        toast({
          title: 'Export Complete',
          description: `Downloaded ${filename}`,
        });
      }
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadFromPreview = () => {
    if (!previewData) return;
    const wb = generateLegacyWorkbook(previewData);
    const filename = `${tournamentName || 'tournament'}_NCFCA_Tab.xlsx`;
    downloadWorkbook(wb, filename);
    setShowPreview(false);
    toast({
      title: 'Export Complete',
      description: `Downloaded ${filename}`,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Legacy Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport(false)}>
            <Download className="h-4 w-4 mr-2" />
            Export NCFCA Format (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport(true)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Preview Before Export
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Export Preview - NCFCA Format</DialogTitle>
            <DialogDescription>
              Review the data before downloading. This format is compatible with NCFCA TP macros.
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-6">
              {/* TeamData Preview */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  TeamData Sheet ({previewData.teamData.length} teams)
                </h3>
                <div className="border rounded-md overflow-auto max-h-48">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Team</th>
                        <th className="p-2 text-left">Speaker1</th>
                        <th className="p-2 text-left">Speaker2</th>
                        <th className="p-2 text-left">Club</th>
                        <th className="p-2 text-center">W</th>
                        <th className="p-2 text-center">L</th>
                        <th className="p-2 text-center">Speaks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.teamData.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 font-mono">{row.team}</td>
                          <td className="p-2">{row.speaker1}</td>
                          <td className="p-2">{row.speaker2}</td>
                          <td className="p-2">{row.club}</td>
                          <td className="p-2 text-center">{row.wins}</td>
                          <td className="p-2 text-center">{row.losses}</td>
                          <td className="p-2 text-center">{row.totalSpeaks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.teamData.length > 10 && (
                    <p className="p-2 text-muted-foreground text-xs">
                      ... and {previewData.teamData.length - 10} more teams
                    </p>
                  )}
                </div>
              </div>

              {/* Rounds Preview */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Round Sheets ({Object.keys(previewData.rounds).filter(k => previewData.rounds[Number(k)]?.length > 0).length} rounds with data)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(previewData.rounds)
                    .filter(([_, rows]) => rows.length > 0)
                    .slice(0, 4)
                    .map(([roundNum, rows]) => (
                      <div key={roundNum} className="border rounded-md p-2">
                        <p className="font-medium text-sm mb-1">Round {roundNum}</p>
                        <p className="text-xs text-muted-foreground">
                          {rows.length} pairings
                          {rows.filter((r: any) => r.winner).length > 0 && 
                            ` • ${rows.filter((r: any) => r.winner).length} results`
                          }
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Cancel
                </Button>
                <Button onClick={handleDownloadFromPreview}>
                  <Download className="h-4 w-4 mr-2" />
                  Download XLSX
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

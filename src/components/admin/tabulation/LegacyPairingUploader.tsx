import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { parseUploadedPairings } from '@/lib/legacyExcelFormat';
import { fuzzyMatchTeam, type MatchResult } from '@/lib/legacyNameFormatter';

interface LegacyPairingUploaderProps {
  tournamentId: string;
  eventId?: string | null;
  existingRounds: any[];
  registrations: any[];
  onImportComplete: () => void;
}

interface ParsedPairing {
  aff: string;
  neg: string;
  affMatch: MatchResult | null;
  negMatch: MatchResult | null;
}

export function LegacyPairingUploader({
  tournamentId,
  eventId,
  existingRounds,
  registrations,
  onImportComplete,
}: LegacyPairingUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedPairings, setParsedPairings] = useState<ParsedPairing[]>([]);
  const [roundName, setRoundName] = useState('');
  const [roundNumber, setRoundNumber] = useState(existingRounds.length + 1);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const rawPairings = parseUploadedPairings(buffer);

      // Match each pairing to registrations
      const matched: ParsedPairing[] = rawPairings.map(({ aff, neg }) => {
        const affMatches = fuzzyMatchTeam(aff, registrations);
        const negMatches = fuzzyMatchTeam(neg, registrations);

        return {
          aff,
          neg,
          affMatch: affMatches[0] || null,
          negMatch: negMatches[0] || null,
        };
      });

      setParsedPairings(matched);
      setRoundName(`Round ${roundNumber}`);
      setOpen(true);
    } catch (error: any) {
      console.error('[LegacyPairingUploader] Parse error:', error);
      toast({
        title: 'Parse Error',
        description: 'Failed to parse uploaded file. Ensure it is a valid .xlsx file.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMatchChange = (index: number, side: 'aff' | 'neg', registrationId: string) => {
    const reg = registrations.find(r => r.id === registrationId);
    if (!reg) return;

    setParsedPairings(prev => {
      const updated = [...prev];
      if (side === 'aff') {
        updated[index].affMatch = { registration: reg, confidence: 1, matchType: 'exact' };
      } else {
        updated[index].negMatch = { registration: reg, confidence: 1, matchType: 'exact' };
      }
      return updated;
    });
  };

  const allMatched = parsedPairings.every(p => p.affMatch && p.negMatch);
  const unmatchedCount = parsedPairings.filter(p => !p.affMatch || !p.negMatch).length;

  const handleImport = async () => {
    if (!allMatched) {
      toast({
        title: 'Unmatched Teams',
        description: 'Please match all teams before importing.',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    try {
      // Create the new round
      const { data: newRound, error: roundError } = await supabase
        .from('rounds')
        .insert({
          tournament_id: tournamentId,
          event_id: eventId || null,
          name: roundName || `Round ${roundNumber}`,
          round_number: roundNumber,
          status: 'upcoming',
        })
        .select()
        .single();

      if (roundError) throw roundError;

      // Create pairings
      const pairingsToInsert = parsedPairings.map(p => ({
        tournament_id: tournamentId,
        event_id: eventId || null,
        round_id: newRound.id,
        aff_registration_id: p.affMatch!.registration.id,
        neg_registration_id: p.negMatch!.registration.id,
        status: 'scheduled',
        released: false,
      }));

      const { error: pairingsError } = await supabase
        .from('pairings')
        .insert(pairingsToInsert);

      if (pairingsError) throw pairingsError;

      // Update aff/neg counts for registrations
      for (const pairing of parsedPairings) {
        const affReg = pairing.affMatch!.registration;
        const negReg = pairing.negMatch!.registration;
        
        await Promise.all([
          supabase
            .from('tournament_registrations')
            .update({ aff_count: (affReg.aff_count || 0) + 1 })
            .eq('id', affReg.id),
          supabase
            .from('tournament_registrations')
            .update({ neg_count: (negReg.neg_count || 0) + 1 })
            .eq('id', negReg.id),
        ]).catch(() => {
          // Silent fail - counts can be recalculated later
        });
      }

      toast({
        title: 'Import Successful',
        description: `Created ${roundName} with ${parsedPairings.length} pairings`,
      });

      setOpen(false);
      setParsedPairings([]);
      onImportComplete();
    } catch (error: any) {
      console.error('[LegacyPairingUploader] Import error:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to create round and pairings',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const getConfidenceBadge = (match: MatchResult | null) => {
    if (!match) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />No Match</Badge>;
    }
    if (match.confidence >= 0.95) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Exact</Badge>;
    }
    if (match.confidence >= 0.8) {
      return <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" />Good</Badge>;
    }
    return <Badge variant="outline" className="text-amber-600"><AlertCircle className="h-3 w-3 mr-1" />Low</Badge>;
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        Import Pairings
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Import Pairings from Legacy Format</DialogTitle>
            <DialogDescription>
              Review matched teams and create a new round. Column A = Affirmative, Column B = Negative.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Round Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Round Name</Label>
                <Input
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder="e.g., Round 1"
                />
              </div>
              <div className="space-y-2">
                <Label>Round Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={roundNumber}
                  onChange={(e) => setRoundNumber(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Match Summary */}
            <div className="flex items-center gap-4 p-3 bg-muted rounded-md">
              <span className="text-sm">
                {parsedPairings.length} pairings found
              </span>
              {unmatchedCount > 0 ? (
                <Badge variant="destructive">
                  {unmatchedCount} unmatched
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-600">
                  All matched
                </Badge>
              )}
            </div>

            {/* Pairings Table */}
            <div className="border rounded-md overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left w-8">#</th>
                    <th className="p-2 text-left">Uploaded Aff</th>
                    <th className="p-2 text-left">Matched Aff</th>
                    <th className="p-2 text-center w-20">Status</th>
                    <th className="p-2 text-left">Uploaded Neg</th>
                    <th className="p-2 text-left">Matched Neg</th>
                    <th className="p-2 text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedPairings.map((pairing, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2 text-muted-foreground">{index + 1}</td>
                      
                      {/* Aff */}
                      <td className="p-2 font-mono text-xs">{pairing.aff}</td>
                      <td className="p-2">
                        <Select
                          value={pairing.affMatch?.registration.id || ''}
                          onValueChange={(val) => handleMatchChange(index, 'aff', val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select team...">
                              {pairing.affMatch?.registration.participant_name || 'Select...'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {registrations.map(reg => (
                              <SelectItem key={reg.id} value={reg.id}>
                                {reg.participant_name}
                                {reg.partner_name && ` / ${reg.partner_name}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 text-center">
                        {getConfidenceBadge(pairing.affMatch)}
                      </td>
                      
                      {/* Neg */}
                      <td className="p-2 font-mono text-xs">{pairing.neg}</td>
                      <td className="p-2">
                        <Select
                          value={pairing.negMatch?.registration.id || ''}
                          onValueChange={(val) => handleMatchChange(index, 'neg', val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select team...">
                              {pairing.negMatch?.registration.participant_name || 'Select...'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {registrations.map(reg => (
                              <SelectItem key={reg.id} value={reg.id}>
                                {reg.participant_name}
                                {reg.partner_name && ` / ${reg.partner_name}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 text-center">
                        {getConfidenceBadge(pairing.negMatch)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!allMatched || importing}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Create Round ({parsedPairings.length} pairings)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

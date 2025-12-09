import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  UserCheck, 
  UserX,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download
} from 'lucide-react';

interface Participant {
  id: string;
  participant_name: string;
  school_organization: string | null;
  isCheckedIn: boolean;
  checkedInAt: string | null;
}

interface Judge {
  id: string;
  name: string;
  email: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
}

interface CheckInManagerProps {
  tournamentId: string;
}

export function CheckInManager({ tournamentId }: CheckInManagerProps) {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkInEnabled, setCheckInEnabled] = useState(false);

  useEffect(() => {
    fetchData();
    fetchTournamentSettings();
  }, [tournamentId]);

  const fetchTournamentSettings = async () => {
    const { data } = await supabase
      .from('tournaments')
      .select('check_in_enabled')
      .eq('id', tournamentId)
      .single();
    
    if (data) {
      setCheckInEnabled(data.check_in_enabled);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch registrations
      const { data: regData, error: regError } = await supabase
        .from('tournament_registrations')
        .select('id, participant_name, school_organization')
        .eq('tournament_id', tournamentId)
        .eq('is_active', true)
        .order('participant_name');

      if (regError) throw regError;

      // Fetch check-ins for registrations
      const { data: checkInData } = await supabase
        .from('participant_checkins')
        .select('registration_id, checked_in_at')
        .eq('tournament_id', tournamentId)
        .not('registration_id', 'is', null);

      const checkInMap = new Map(
        checkInData?.map(c => [c.registration_id, c.checked_in_at]) || []
      );

      const participantsWithCheckIn: Participant[] = (regData || []).map(r => ({
        id: r.id,
        participant_name: r.participant_name,
        school_organization: r.school_organization,
        isCheckedIn: checkInMap.has(r.id),
        checkedInAt: checkInMap.get(r.id) || null
      }));

      setParticipants(participantsWithCheckIn);

      // Fetch judges with check-in status
      const { data: judgeData } = await supabase
        .from('judge_profiles')
        .select('id, name, email')
        .order('name');

      const { data: judgeCheckInData } = await supabase
        .from('participant_checkins')
        .select('judge_profile_id, checked_in_at')
        .eq('tournament_id', tournamentId)
        .not('judge_profile_id', 'is', null);

      const judgeCheckInMap = new Map(
        judgeCheckInData?.map(c => [c.judge_profile_id, c.checked_in_at]) || []
      );

      const judgesWithCheckIn: Judge[] = (judgeData || []).map(j => ({
        id: j.id,
        name: j.name,
        email: j.email,
        isCheckedIn: judgeCheckInMap.has(j.id),
        checkedInAt: judgeCheckInMap.get(j.id) || null
      }));

      setJudges(judgesWithCheckIn);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load check-in data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCheckInEnabled = async () => {
    try {
      const newValue = !checkInEnabled;
      const { error } = await supabase
        .from('tournaments')
        .update({ check_in_enabled: newValue })
        .eq('id', tournamentId);

      if (error) throw error;

      setCheckInEnabled(newValue);
      toast({
        title: "Success",
        description: newValue ? "Check-in is now enabled" : "Check-in is now disabled"
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleParticipantCheckIn = async (participant: Participant) => {
    try {
      if (participant.isCheckedIn) {
        // Check out - delete the record
        const { error } = await supabase
          .from('participant_checkins')
          .delete()
          .eq('tournament_id', tournamentId)
          .eq('registration_id', participant.id);

        if (error) throw error;
      } else {
        // Check in - insert record
        const { error } = await supabase
          .from('participant_checkins')
          .insert({
            tournament_id: tournamentId,
            registration_id: participant.id
          });

        if (error) throw error;
      }

      setParticipants(prev => prev.map(p => 
        p.id === participant.id 
          ? { ...p, isCheckedIn: !p.isCheckedIn, checkedInAt: !p.isCheckedIn ? new Date().toISOString() : null }
          : p
      ));

      toast({
        title: "Success",
        description: participant.isCheckedIn ? `${participant.participant_name} checked out` : `${participant.participant_name} checked in`
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleJudgeCheckIn = async (judge: Judge) => {
    try {
      if (judge.isCheckedIn) {
        const { error } = await supabase
          .from('participant_checkins')
          .delete()
          .eq('tournament_id', tournamentId)
          .eq('judge_profile_id', judge.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('participant_checkins')
          .insert({
            tournament_id: tournamentId,
            judge_profile_id: judge.id
          });

        if (error) throw error;
      }

      setJudges(prev => prev.map(j => 
        j.id === judge.id 
          ? { ...j, isCheckedIn: !j.isCheckedIn, checkedInAt: !j.isCheckedIn ? new Date().toISOString() : null }
          : j
      ));

      toast({
        title: "Success",
        description: judge.isCheckedIn ? `${judge.name} checked out` : `${judge.name} checked in`
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const checkInAll = async (type: 'participants' | 'judges') => {
    try {
      if (type === 'participants') {
        const notCheckedIn = participants.filter(p => !p.isCheckedIn);
        for (const p of notCheckedIn) {
          await supabase
            .from('participant_checkins')
            .insert({
              tournament_id: tournamentId,
              registration_id: p.id
            });
        }
        setParticipants(prev => prev.map(p => ({ ...p, isCheckedIn: true, checkedInAt: new Date().toISOString() })));
      } else {
        const notCheckedIn = judges.filter(j => !j.isCheckedIn);
        for (const j of notCheckedIn) {
          await supabase
            .from('participant_checkins')
            .insert({
              tournament_id: tournamentId,
              judge_profile_id: j.id
            });
        }
        setJudges(prev => prev.map(j => ({ ...j, isCheckedIn: true, checkedInAt: new Date().toISOString() })));
      }

      toast({ title: "Success", description: `All ${type} checked in` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const exportCheckIns = () => {
    const checkedInParticipants = participants.filter(p => p.isCheckedIn);
    const checkedInJudges = judges.filter(j => j.isCheckedIn);

    const csv = [
      'Type,Name,Organization/Email,Checked In At',
      ...checkedInParticipants.map(p => `Participant,"${p.participant_name}","${p.school_organization || ''}","${p.checkedInAt}"`),
      ...checkedInJudges.map(j => `Judge,"${j.name}","${j.email}","${j.checkedInAt}"`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'check-ins.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredParticipants = participants.filter(p =>
    p.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.school_organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJudges = judges.filter(j =>
    j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkedInCount = participants.filter(p => p.isCheckedIn).length;
  const judgesCheckedInCount = judges.filter(j => j.isCheckedIn).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Check-in Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Tournament Check-In
              </CardTitle>
              <CardDescription>
                Manage participant and judge check-ins for live tournaments
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="check-in-enabled">Enable Check-In</Label>
                <Switch
                  id="check-in-enabled"
                  checked={checkInEnabled}
                  onCheckedChange={toggleCheckInEnabled}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{checkedInCount}/{participants.length}</div>
                <div className="text-sm text-muted-foreground">Participants Checked In</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{judgesCheckedInCount}/{judges.length}</div>
                <div className="text-sm text-muted-foreground">Judges Checked In</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{participants.length - checkedInCount}</div>
                <div className="text-sm text-muted-foreground">Participants Missing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{judges.length - judgesCheckedInCount}</div>
                <div className="text-sm text-muted-foreground">Judges Missing</div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search participants or judges..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportCheckIns}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Check-in Tabs */}
      <Tabs defaultValue="participants">
        <TabsList>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participants ({checkedInCount}/{participants.length})
          </TabsTrigger>
          <TabsTrigger value="judges" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Judges ({judgesCheckedInCount}/{judges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Participant Check-Ins</CardTitle>
                <Button size="sm" onClick={() => checkInAll('participants')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Check In All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>School/Organization</TableHead>
                    <TableHead>Checked In At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map(participant => (
                    <TableRow key={participant.id} className={participant.isCheckedIn ? 'bg-primary/5' : ''}>
                      <TableCell>
                        {participant.isCheckedIn ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Checked In
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            Not Checked In
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{participant.participant_name}</TableCell>
                      <TableCell>{participant.school_organization || '-'}</TableCell>
                      <TableCell>
                        {participant.checkedInAt 
                          ? new Date(participant.checkedInAt).toLocaleTimeString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={participant.isCheckedIn ? "outline" : "default"}
                          onClick={() => toggleParticipantCheckIn(participant)}
                        >
                          {participant.isCheckedIn ? (
                            <><UserX className="h-4 w-4 mr-1" /> Check Out</>
                          ) : (
                            <><UserCheck className="h-4 w-4 mr-1" /> Check In</>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="judges">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Judge Check-Ins</CardTitle>
                <Button size="sm" onClick={() => checkInAll('judges')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Check In All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Checked In At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJudges.map(judge => (
                    <TableRow key={judge.id} className={judge.isCheckedIn ? 'bg-primary/5' : ''}>
                      <TableCell>
                        {judge.isCheckedIn ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Checked In
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            Not Checked In
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{judge.name}</TableCell>
                      <TableCell>{judge.email}</TableCell>
                      <TableCell>
                        {judge.checkedInAt 
                          ? new Date(judge.checkedInAt).toLocaleTimeString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={judge.isCheckedIn ? "outline" : "default"}
                          onClick={() => toggleJudgeCheckIn(judge)}
                        >
                          {judge.isCheckedIn ? (
                            <><UserX className="h-4 w-4 mr-1" /> Check Out</>
                          ) : (
                            <><UserCheck className="h-4 w-4 mr-1" /> Check In</>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

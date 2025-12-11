import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Eye, EyeOff, Crown, Medal, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  status: string;
  format: string;
  is_championship: boolean;
  results_published?: boolean;
  results_visibility?: {
    prelim_rounds?: boolean;
    elim_rounds?: boolean;
    break_results?: boolean;
    finals?: boolean;
  } | null;
}

interface Standing {
  id: string;
  registration_id: string;
  rank: number;
  wins: number;
  losses: number;
  speaks_avg: number;
  registration?: {
    debater1_name?: string;
    debater2_name?: string | null;
    school_organization?: string;
    participant_name?: string;
  } | null;
}

export function ResultsManager() {
  const [completedTournaments, setCompletedTournaments] = useState<Tournament[]>([]);
  const [publishedTournaments, setPublishedTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('publish');
  const { toast } = useToast();

  // Dialog states
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [publishSettings, setPublishSettings] = useState({
    is_championship: false,
    prelim_rounds: true,
    elim_rounds: true,
    break_results: true,
    finals: true
  });

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, start_date, end_date, location, status, format, is_championship, results_published, results_visibility')
        .order('start_date', { ascending: false });

      if (error) throw error;

      const allTournaments = (data || []).map(t => ({
        ...t,
        results_published: (t as any).results_published ?? false,
        results_visibility: (t as any).results_visibility ?? null
      })) as Tournament[];
      
      // Split into completed (unpublished) and published
      setCompletedTournaments(
        allTournaments.filter(t => t.status === 'Completed' && !t.results_published)
      );
      setPublishedTournaments(
        allTournaments.filter(t => t.results_published)
      );
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tournaments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStandings = async (tournamentId: string) => {
    try {
      // Fetch standings separately then registrations
      const { data: standingsData, error: standingsError } = await supabase
        .from('tournament_standings')
        .select('id, registration_id, rank, wins, losses, speaks_avg')
        .eq('tournament_id', tournamentId)
        .order('rank', { ascending: true });

      if (standingsError) throw standingsError;

      if (!standingsData || standingsData.length === 0) {
        setStandings([]);
        return;
      }

      // Fetch registration details
      const registrationIds = standingsData.map(s => s.registration_id);
      const { data: regsData, error: regsError } = await supabase
        .from('tournament_registrations')
        .select('id, participant_name, school_organization')
        .in('id', registrationIds);

      if (regsError) throw regsError;

      // Combine data
      const regMap = new Map((regsData || []).map(r => [r.id, r]));
      const combinedStandings: Standing[] = standingsData.map(s => ({
        ...s,
        registration: regMap.get(s.registration_id) || null
      }));

      setStandings(combinedStandings);
    } catch (error: any) {
      console.error('Error fetching standings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch standings',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const openPublishDialog = async (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setPublishSettings({
      is_championship: tournament.is_championship || false,
      prelim_rounds: tournament.results_visibility?.prelim_rounds ?? true,
      elim_rounds: tournament.results_visibility?.elim_rounds ?? true,
      break_results: tournament.results_visibility?.break_results ?? true,
      finals: tournament.results_visibility?.finals ?? true
    });
    await fetchStandings(tournament.id);
    setIsPublishDialogOpen(true);
  };

  const publishResults = async () => {
    if (!selectedTournament) return;

    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          is_championship: publishSettings.is_championship,
          results_published: true,
          results_visibility: {
            prelim_rounds: publishSettings.prelim_rounds,
            elim_rounds: publishSettings.elim_rounds,
            break_results: publishSettings.break_results,
            finals: publishSettings.finals
          }
        } as any)
        .eq('id', selectedTournament.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Results published successfully',
      });

      setIsPublishDialogOpen(false);
      setSelectedTournament(null);
      fetchTournaments();
    } catch (error: any) {
      console.error('Error publishing results:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish results',
        variant: 'destructive',
      });
    }
  };

  const unpublishResults = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to unpublish these results?')) return;

    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ results_published: false } as any)
        .eq('id', tournamentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Results unpublished',
      });

      fetchTournaments();
    } catch (error: any) {
      console.error('Error unpublishing results:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to unpublish results',
        variant: 'destructive',
      });
    }
  };

  const updateVisibility = async (tournamentId: string, visibility: Record<string, boolean>) => {
    try {
      const tournament = publishedTournaments.find(t => t.id === tournamentId);
      if (!tournament) return;

      const { error } = await supabase
        .from('tournaments')
        .update({
          results_visibility: {
            ...tournament.results_visibility,
            ...visibility
          }
        } as any)
        .eq('id', tournamentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Visibility updated',
      });

      fetchTournaments();
    } catch (error: any) {
      console.error('Error updating visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Results Management</h2>
        <p className="text-muted-foreground">Publish and manage tournament results from completed tournaments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="publish" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Publish Results ({completedTournaments.length})
          </TabsTrigger>
          <TabsTrigger value="published" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Published ({publishedTournaments.length})
          </TabsTrigger>
        </TabsList>

        {/* Publish Results Tab */}
        <TabsContent value="publish" className="space-y-4">
          {completedTournaments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Completed Tournaments</h3>
                <p className="text-muted-foreground">
                  Tournaments marked as "Completed" will appear here for results publishing.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedTournaments.map((tournament) => (
                <Card key={tournament.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {tournament.name}
                        <Badge variant="secondary">{tournament.status}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {new Date(tournament.start_date).toLocaleDateString()} • {tournament.location || 'Online'} • {tournament.format}
                      </CardDescription>
                    </div>
                    <Button onClick={() => openPublishDialog(tournament)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Publish Results
                    </Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Published Results Tab */}
        <TabsContent value="published" className="space-y-4">
          {publishedTournaments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Published Results</h3>
                <p className="text-muted-foreground">
                  Published tournament results will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {publishedTournaments.map((tournament) => (
                <Card key={tournament.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {tournament.is_championship && <Crown className="h-5 w-5 text-yellow-500" />}
                          {tournament.name}
                          <Badge variant="default">Published</Badge>
                        </CardTitle>
                        <CardDescription>
                          {new Date(tournament.start_date).toLocaleDateString()} • {tournament.location || 'Online'}
                        </CardDescription>
                      </div>
                      <Button variant="outline" onClick={() => unpublishResults(tournament.id)}>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Unpublish
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <Label className="text-sm">Prelim Rounds</Label>
                        <Switch
                          checked={tournament.results_visibility?.prelim_rounds ?? true}
                          onCheckedChange={(checked) => 
                            updateVisibility(tournament.id, { prelim_rounds: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <Label className="text-sm">Elim Rounds</Label>
                        <Switch
                          checked={tournament.results_visibility?.elim_rounds ?? true}
                          onCheckedChange={(checked) => 
                            updateVisibility(tournament.id, { elim_rounds: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <Label className="text-sm">Break Results</Label>
                        <Switch
                          checked={tournament.results_visibility?.break_results ?? true}
                          onCheckedChange={(checked) => 
                            updateVisibility(tournament.id, { break_results: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <Label className="text-sm">Finals</Label>
                        <Switch
                          checked={tournament.results_visibility?.finals ?? true}
                          onCheckedChange={(checked) => 
                            updateVisibility(tournament.id, { finals: checked })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Publish Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Publish Results: {selectedTournament?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publication Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label className="font-medium flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Mark as Championship
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Highlights this tournament on the Championships page
                    </p>
                  </div>
                  <Switch
                    checked={publishSettings.is_championship}
                    onCheckedChange={(checked) => 
                      setPublishSettings({ ...publishSettings, is_championship: checked })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <Label className="text-sm">Prelim Rounds</Label>
                    <Switch
                      checked={publishSettings.prelim_rounds}
                      onCheckedChange={(checked) => 
                        setPublishSettings({ ...publishSettings, prelim_rounds: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <Label className="text-sm">Elim Rounds</Label>
                    <Switch
                      checked={publishSettings.elim_rounds}
                      onCheckedChange={(checked) => 
                        setPublishSettings({ ...publishSettings, elim_rounds: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <Label className="text-sm">Break Results</Label>
                    <Switch
                      checked={publishSettings.break_results}
                      onCheckedChange={(checked) => 
                        setPublishSettings({ ...publishSettings, break_results: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <Label className="text-sm">Finals</Label>
                    <Switch
                      checked={publishSettings.finals}
                      onCheckedChange={(checked) => 
                        setPublishSettings({ ...publishSettings, finals: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Standings Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Medal className="h-5 w-5" />
                  Standings Preview ({standings.length} teams)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {standings.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No standings data available for this tournament.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead className="text-center">W-L</TableHead>
                        <TableHead className="text-center">Speaks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.slice(0, 10).map((standing) => (
                        <TableRow key={standing.id}>
                          <TableCell>
                            <Badge variant={standing.rank <= 3 ? 'default' : 'secondary'}>
                              #{standing.rank}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {standing.registration?.participant_name || 
                              standing.registration?.debater1_name || 'Unknown'}
                            {standing.registration?.debater2_name && 
                              ` / ${standing.registration.debater2_name}`}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {standing.registration?.school_organization || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {standing.wins}-{standing.losses}
                          </TableCell>
                          <TableCell className="text-center">
                            {standing.speaks_avg?.toFixed(1) || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {standings.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Showing top 10 of {standings.length} teams
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={publishResults}>
                <Eye className="h-4 w-4 mr-2" />
                Publish Results
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

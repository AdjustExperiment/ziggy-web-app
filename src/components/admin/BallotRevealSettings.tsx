
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Clock, CheckCircle } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  ballot_reveal_mode: string;
  end_date: string;
  status: string;
}

export function BallotRevealSettings() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string>('');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      // Placeholder implementation - using existing tournaments table without ballot_reveal_mode
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, end_date, status')
        .order('name');

      if (error) throw error;
      
      // Add placeholder ballot_reveal_mode for display
      const tournamentsWithRevealMode = (data || []).map(tournament => ({
        ...tournament,
        ballot_reveal_mode: 'after_tournament' // Default placeholder
      }));
      
      setTournaments(tournamentsWithRevealMode);
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRevealMode = async (tournamentId: string, mode: string) => {
    try {
      setUpdating(tournamentId);
      
      // Placeholder implementation
      toast({
        title: "Feature Coming Soon",
        description: "Ballot reveal mode settings will be available once the database setup is complete",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update ballot reveal mode",
        variant: "destructive",
      });
    } finally {
      setUpdating('');
    }
  };

  const getRevealModeDescription = (mode: string) => {
    switch (mode) {
      case 'auto_on_submit':
        return 'Ballots are automatically revealed when judges submit them';
      case 'after_tournament':
        return 'Ballots are revealed after the tournament end date';
      default:
        return 'Unknown reveal mode';
    }
  };

  const getRevealModeIcon = (mode: string) => {
    switch (mode) {
      case 'auto_on_submit':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'after_tournament':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getRevealModeVariant = (mode: string) => {
    switch (mode) {
      case 'auto_on_submit':
        return 'default' as const;
      case 'after_tournament':
        return 'secondary' as const;
      default:
        return 'outline' as const;
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
        <p className="text-muted-foreground">
          Control when ballot results are revealed to competitors for each tournament
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reveal Mode Options</CardTitle>
          <CardDescription>Choose how ballots are revealed to competitors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
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
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  After Tournament
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ballots are revealed only after the tournament end date has passed. 
                  Best for maintaining competitive integrity during the tournament.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tournament Settings ({tournaments.length})</CardTitle>
          <CardDescription>
            This feature is being set up and will be fully functional soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournaments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p>No tournaments found. Tournament settings will appear here once available.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Setting</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.map((tournament) => (
                  <TableRow key={tournament.id}>
                    <TableCell>
                      <div className="font-medium">{tournament.name}</div>
                    </TableCell>
                    <TableCell>
                      {tournament.end_date ? (
                        new Date(tournament.end_date).toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tournament.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRevealModeIcon(tournament.ballot_reveal_mode)}
                        <Badge variant={getRevealModeVariant(tournament.ballot_reveal_mode)}>
                          {tournament.ballot_reveal_mode === 'auto_on_submit' ? 'Auto on Submit' : 'After Tournament'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getRevealModeDescription(tournament.ballot_reveal_mode)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={tournament.ballot_reveal_mode}
                        onValueChange={(value) => updateRevealMode(tournament.id, value)}
                        disabled={updating === tournament.id}
                      >
                        <SelectTrigger className="w-48">
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
                              <Clock className="h-4 w-4 text-blue-500" />
                              After Tournament
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

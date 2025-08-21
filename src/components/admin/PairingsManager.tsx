
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Users, MessageSquare } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
}

export function PairingsManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setTournaments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tournament & Round Selection</CardTitle>
          <CardDescription>Select a tournament and round to manage pairings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tournament</Label>
              <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map(tournament => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Round</Label>
              <Select value={selectedRound} onValueChange={setSelectedRound} disabled={!selectedTournament}>
                <SelectTrigger>
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder">No rounds available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pairings Management
          </CardTitle>
          <CardDescription>
            Advanced pairing management features are being developed and will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Feature Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            We're building comprehensive pairing management tools including:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-2 h-2 p-0"></Badge>
              Manual pairing creation
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-2 h-2 p-0"></Badge>
              Automated pairing algorithms
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-2 h-2 p-0"></Badge>
              Room assignments
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-2 h-2 p-0"></Badge>
              Real-time chat integration
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

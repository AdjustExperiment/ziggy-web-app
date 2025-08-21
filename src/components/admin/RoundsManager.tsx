
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Plus, Clock } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
}

export function RoundsManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tournament Selection</CardTitle>
          <CardDescription>Select a tournament to manage its rounds</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tournament" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map(tournament => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTournament && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Rounds Management
            </CardTitle>
            <CardDescription>
              Round management functionality is being prepared and will be available soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Clock className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Feature Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              We're working on bringing you comprehensive round management capabilities including:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground max-w-md mx-auto">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0"></Badge>
                Round creation and scheduling
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0"></Badge>
                Round type configuration
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0"></Badge>
                Release management
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0"></Badge>
                Time scheduling
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

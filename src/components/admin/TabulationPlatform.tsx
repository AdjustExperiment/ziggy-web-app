
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { TabulationDashboard } from './tabulation/TabulationDashboard';

interface Tournament {
  id: string;
  name: string;
}

export function TabulationPlatform() {
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
      
      // Auto-select first tournament for better UX
      if (data && data.length > 0 && !selectedTournament) {
        setSelectedTournament(data[0].id);
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TabulationDashboard
      tournaments={tournaments}
      selectedTournament={selectedTournament}
      onTournamentChange={setSelectedTournament}
    />
  );
}

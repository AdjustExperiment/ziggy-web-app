
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Clock, Users, Calendar, Gavel } from 'lucide-react';
import { Pairing } from '@/types/database';

export function MyPairings() {
  const { user } = useAuth();
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyPairings();
    }
  }, [user]);

  const fetchMyPairings = async () => {
    if (!user) return;

    try {
      // Get user's registrations first
      const { data: userRegistrations, error: regError } = await supabase
        .from('tournament_registrations')
        .select('id, participant_name, participant_email, tournaments(name)')
        .eq('user_id', user.id);

      if (regError) throw regError;

      // For now, show empty state since pairings table doesn't exist yet
      console.log('User registrations:', userRegistrations);
      setPairings([]);
    } catch (error: any) {
      console.error('Error fetching pairings:', error);
      toast({
        title: "Error",
        description: "Failed to load your pairings",
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
      <div>
        <h2 className="text-2xl font-bold">My Pairings</h2>
        <p className="text-muted-foreground">
          View your debate pairings and round information
        </p>
      </div>

      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pairings Yet</h3>
          <p className="text-muted-foreground">
            Your debate pairings will appear here once they are released by tournament directors.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


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
        .select('id')
        .eq('user_id', user.id);

      if (regError) throw regError;

      const registrationIds = userRegistrations?.map(r => r.id) || [];

      if (registrationIds.length === 0) {
        setPairings([]);
        return;
      }

      // Use raw query to get pairings with joins
      const { data, error } = await supabase.rpc('get_user_pairings', {
        user_registration_ids: registrationIds
      });

      if (error) {
        // Fallback to direct table access if RPC doesn't exist yet
        console.log('RPC not available, using direct query');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('tournament_registrations')
          .select(`
            id,
            participant_name,
            participant_email,
            tournaments!inner(name)
          `)
          .eq('user_id', user.id);
        
        if (fallbackError) throw fallbackError;
        
        // For now, show empty state until pairings are properly released
        setPairings([]);
        return;
      }

      setPairings(data || []);
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

      {pairings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pairings Yet</h3>
            <p className="text-muted-foreground">
              Your debate pairings will appear here once they are released by tournament directors.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pairings.map((pairing) => (
            <Card key={pairing.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {pairing.tournaments.name} - {pairing.round.name}
                    </CardTitle>
                    <CardDescription>
                      Room: {pairing.room || 'TBD'}
                    </CardDescription>
                  </div>
                  <Badge variant="default">Released</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {/* Participants */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Affirmative</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">AFF</Badge>
                        <span>{pairing.aff_registration.participant_name}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Negative</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">NEG</Badge>
                        <span>{pairing.neg_registration.participant_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Time */}
                  {pairing.scheduled_time && (
                    <div>
                      <div className="text-sm font-medium flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4" />
                        Scheduled Time
                      </div>
                      <div className="text-sm">
                        {new Date(pairing.scheduled_time).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Pairing Details</DialogTitle>
                          <DialogDescription>
                            {pairing.tournaments.name} - {pairing.round.name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-green-600">Affirmative</h4>
                              <p>{pairing.aff_registration.participant_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {pairing.aff_registration.participant_email}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-red-600">Negative</h4>
                              <p>{pairing.neg_registration.participant_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {pairing.neg_registration.participant_email}
                              </p>
                            </div>
                          </div>
                          
                          {pairing.room && (
                            <div>
                              <h4 className="font-semibold">Room</h4>
                              <p>{pairing.room}</p>
                            </div>
                          )}
                          
                          {pairing.scheduled_time && (
                            <div>
                              <h4 className="font-semibold">Scheduled Time</h4>
                              <p>{new Date(pairing.scheduled_time).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

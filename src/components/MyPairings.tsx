
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [userRegistrationIds, setUserRegistrationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResults, setSelectedResults] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    fetchMyPairings();

    // Set up real-time subscription for pairing updates
    const channel = supabase
      .channel('my-pairings-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pairings'
      }, () => {
        fetchMyPairings();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ballots'
      }, () => {
        fetchMyPairings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      if (!userRegistrations || userRegistrations.length === 0) {
        setPairings([]);
        return;
      }

      const registrationIds = userRegistrations.map(reg => reg.id);
      setUserRegistrationIds(registrationIds);

      // Fetch pairings where user is either AFF or NEG and pairing is released
      const { data: pairingsData, error: pairingsError } = await supabase
        .from('pairings')
        .select(`
          id,
          tournament_id,
          round_id,
          aff_registration_id,
          neg_registration_id,
          judge_id,
          room,
          scheduled_time,
          released,
          status,
          result,
          created_at,
          updated_at,
          aff_registration:tournament_registrations!aff_registration_id(participant_name, participant_email),
          neg_registration:tournament_registrations!neg_registration_id(participant_name, participant_email),
          round:rounds(name),
          tournaments(name),
          judge_profiles(name, email)
        `)
        .or(`aff_registration_id.in.(${registrationIds.join(',')}),neg_registration_id.in.(${registrationIds.join(',')})`)
        .eq('released', true)
        .order('created_at', { ascending: false });

      if (pairingsError) throw pairingsError;

      // Type cast to handle missing optional properties from the Pairing interface
      const typedPairings = (pairingsData || []).map(pairing => ({
        ...pairing,
        method: (pairing as any).method || null,
        seed: (pairing as any).seed || null
      })) as Pairing[];
      setPairings(typedPairings);
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

  const fetchPairingResults = async (pairingId: string) => {
    try {
      const { data: ballots, error } = await supabase
        .from('ballots')
        .select('*')
        .eq('pairing_id', pairingId)
        .eq('is_published', true);

      if (error) throw error;

      if (ballots && ballots.length > 0) {
        setSelectedResults(ballots[0]);
      } else {
        toast({
          title: "No Results Available",
          description: "Results for this debate have not been published yet.",
        });
      }
    } catch (error: any) {
      console.error('Error fetching results:', error);
      toast({
        title: "Error",
        description: "Failed to load results",
        variant: "destructive",
      });
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
        <div className="space-y-4">
          {pairings.map((pairing) => {
            const isAff = userRegistrationIds.includes(pairing.aff_registration_id);
            const isNeg = userRegistrationIds.includes(pairing.neg_registration_id);
            
            return (
              <Card key={pairing.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Gavel className="h-5 w-5" />
                        {pairing.tournaments?.name} - {pairing.round?.name}
                      </CardTitle>
                      <CardDescription>
                        Room: {pairing.room || 'TBD'} • 
                        You are competing as: <Badge variant={isAff ? "outline" : "secondary"}>
                          {isAff ? "AFF" : isNeg ? "NEG" : "Unknown"}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge variant={pairing.status === 'completed' ? 'default' : 'secondary'}>
                      {pairing.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {/* Participants */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">AFF</Badge>
                          <span className="font-medium">{pairing.aff_registration?.participant_name}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">NEG</Badge>
                          <span className="font-medium">{pairing.neg_registration?.participant_name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Judge */}
                    <div>
                      <div className="text-sm text-muted-foreground">Judge:</div>
                      <div className="font-medium">
                        {pairing.judge_profiles?.name || 'TBD'}
                      </div>
                    </div>

                    {/* Scheduled Time */}
                    {pairing.scheduled_time && (
                      <div>
                        <div className="text-sm text-muted-foreground">Scheduled for:</div>
                        <div className="font-medium">
                          {new Date(pairing.scheduled_time).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/pairings/${pairing.id}`}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Details & Chat
                        </Link>
                      </Button>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => fetchPairingResults(pairing.id)}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        View Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Results Dialog */}
      <Dialog open={!!selectedResults} onOpenChange={() => setSelectedResults(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Debate Results</DialogTitle>
            <DialogDescription>Official ballot results</DialogDescription>
          </DialogHeader>
          {selectedResults && (
            <div className="space-y-4">
              <div className="text-center">
                <Badge variant="default" className="text-lg px-4 py-2">
                  Winner: {(selectedResults.payload as any)?.winner === 'aff' ? 'Affirmative' : 'Negative'}
                </Badge>
              </div>
              
              {((selectedResults.payload as any)?.aff_points || (selectedResults.payload as any)?.neg_points) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="font-semibold">Affirmative Points</div>
                    <div className="text-2xl">{(selectedResults.payload as any)?.aff_points || 'N/A'}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">Negative Points</div>
                    <div className="text-2xl">{(selectedResults.payload as any)?.neg_points || 'N/A'}</div>
                  </div>
                </div>
              )}
              
              {(selectedResults.payload as any)?.comments && (
                <div>
                  <div className="font-semibold mb-2">Judge Comments</div>
                  <div className="bg-muted p-3 rounded-md">
                    {(selectedResults.payload as any).comments}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

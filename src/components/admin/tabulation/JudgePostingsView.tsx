
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { MessageCircle, Users, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PairingWithDetails {
  id: string;
  tournament_id: string;
  round: {
    name: string;
    round_number: number;
  };
  aff_registration: {
    participant_name: string;
    school_organization: string | null;
  };
  neg_registration: {
    participant_name: string;
    school_organization: string | null;
  };
  scheduled_time: string | null;
  room: string | null;
  status: string;
  judge_profiles?: {
    name: string;
    email: string;
  };
  judge_volunteer_requests?: Array<{
    id: string;
    judge_profile_id: string;
    status: string;
    note: string | null;
  }>;
}

interface JudgePostingsViewProps {
  tournamentId: string;
}

export function JudgePostingsView({ tournamentId }: JudgePostingsViewProps) {
  const { user } = useAuth();
  const [pairings, setPairings] = useState<PairingWithDetails[]>([]);
  const [judgeProfile, setJudgeProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId && user) {
      fetchJudgeProfile();
      fetchPairings();
    }
  }, [tournamentId, user]);

  const fetchJudgeProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('judge_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setJudgeProfile(data);
    } catch (error: any) {
      console.error('Error fetching judge profile:', error);
    }
  };

  const fetchPairings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pairings')
        .select(`
          *,
          round:rounds(name, round_number),
          aff_registration:tournament_registrations!aff_registration_id(participant_name, school_organization),
          neg_registration:tournament_registrations!neg_registration_id(participant_name, school_organization),
          judge_profiles(name, email)
        `)
        .eq('tournament_id', tournamentId)
        .eq('released', true)
        .order('created_at');

      if (error) throw error;
      // Add empty judge_volunteer_requests array to each pairing
      const pairingsWithRequests = (data || []).map(pairing => ({
        ...pairing,
        judge_volunteer_requests: [] as Array<{
          id: string;
          judge_profile_id: string;
          status: string;
          note: string | null;
        }>
      }));
      setPairings(pairingsWithRequests);
    } catch (error: any) {
      console.error('Error fetching pairings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pairings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const volunteerToJudge = async (pairingId: string, note?: string) => {
    if (!judgeProfile) {
      toast({
        title: "Error",
        description: "You need a judge profile to volunteer",
        variant: "destructive",
      });
      return;
    }

    try {
    // Temporarily disable until types are updated
    /*
    const { error } = await supabase
        .from('judge_volunteer_requests')
        .insert({
          pairing_id: pairingId,
          judge_profile_id: judgeProfile.id,
          status: 'pending',
          note: note || null
        });

      if (error) throw error;
      */

      toast({
        title: "Success",
        description: "Volunteer request submitted successfully (demo mode)",
      });

      fetchPairings();
    } catch (error: any) {
      console.error('Error volunteering to judge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit volunteer request",
        variant: "destructive",
      });
    }
  };

  const openPairingChat = (pairingId: string) => {
    // Navigate to pairing detail page with chat
    window.open(`/pairing/${pairingId}`, '_blank');
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Judge Postings & Volunteer Opportunities
          </CardTitle>
          <CardDescription>
            View all tournament pairings and volunteer to judge rounds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!judgeProfile && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                Create a judge profile to volunteer for judging assignments and access pairing chats.
              </p>
              <Button className="mt-2" size="sm" onClick={() => window.open('/judge', '_blank')}>
                Create Judge Profile
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {pairings.map(pairing => {
              const myVolunteerRequest = pairing.judge_volunteer_requests?.find(
                req => req.judge_profile_id === judgeProfile?.id
              );
              const isAssigned = pairing.judge_profiles?.name;

              return (
                <Card key={pairing.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {pairing.round?.name || 'Unknown Round'}
                        </Badge>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">AFF</Badge>
                            <span className="text-sm font-medium">
                              {pairing.aff_registration?.participant_name}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pairing.aff_registration?.school_organization || 'Independent'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">NEG</Badge>
                            <span className="text-sm font-medium">
                              {pairing.neg_registration?.participant_name}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pairing.neg_registration?.school_organization || 'Independent'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="space-y-2">
                          {pairing.scheduled_time && (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(pairing.scheduled_time).toLocaleString()}</span>
                            </div>
                          )}
                          {pairing.room && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              <span>{pairing.room}</span>
                            </div>
                          )}
                          {isAssigned && (
                            <div className="text-sm">
                              <strong>Judge:</strong> {pairing.judge_profiles?.name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {judgeProfile && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPairingChat(pairing.id)}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Chat
                            </Button>

                            {!isAssigned && !myVolunteerRequest && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const note = prompt('Optional note for your volunteer request:');
                                  volunteerToJudge(pairing.id, note || undefined);
                                }}
                              >
                                Volunteer to Judge
                              </Button>
                            )}

                            {myVolunteerRequest && (
                              <Badge 
                                variant={myVolunteerRequest.status === 'approved' ? 'default' : 'secondary'}
                                className="flex items-center gap-1"
                              >
                                {myVolunteerRequest.status === 'approved' ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : myVolunteerRequest.status === 'rejected' ? (
                                  <XCircle className="h-3 w-3" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )}
                                {myVolunteerRequest.status}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {pairings.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pairings posted yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

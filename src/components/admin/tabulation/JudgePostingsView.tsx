
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Users, Clock, MapPin, CheckCircle, XCircle, UserPlus, Loader2, Trash2, Search, Gavel } from 'lucide-react';
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
    alumni?: boolean;
  };
  judge_volunteer_requests?: Array<{
    id: string;
    judge_profile_id: string;
    status: string;
    note: string | null;
  }>;
}

interface JudgeProfile {
  id: string;
  name: string;
  email: string;
  experience_level: string;
  specializations: string[];
  alumni: boolean;
  user_id: string | null;
}

interface TournamentJudge {
  id: string;
  judge_profile_id: string;
  status: string;
  registered_at: string;
  judge_profile: JudgeProfile;
}

interface JudgePostingsViewProps {
  tournamentId: string;
}

export function JudgePostingsView({ tournamentId }: JudgePostingsViewProps) {
  const { user } = useAuth();
  const [pairings, setPairings] = useState<PairingWithDetails[]>([]);
  const [judgeProfile, setJudgeProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Tournament judges roster state
  const [tournamentJudges, setTournamentJudges] = useState<TournamentJudge[]>([]);
  const [allJudgeProfiles, setAllJudgeProfiles] = useState<JudgeProfile[]>([]);
  
  // Add judge dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [judgeSearch, setJudgeSearch] = useState('');
  const [addingJudge, setAddingJudge] = useState(false);
  const [removingJudgeId, setRemovingJudgeId] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId && user) {
      fetchJudgeProfile();
      fetchPairings();
      fetchTournamentJudges();
      fetchAllJudgeProfiles();
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
          judge_profiles(name, email, alumni)
        `)
        .eq('tournament_id', tournamentId)
        .eq('released', true)
        .order('created_at');

      if (error) throw error;
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

  const fetchTournamentJudges = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_judge_registrations')
        .select(`
          id,
          judge_profile_id,
          status,
          registered_at,
          judge_profile:judge_profiles(id, name, email, experience_level, specializations, alumni, user_id)
        `)
        .eq('tournament_id', tournamentId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to handle the nested structure
      const typedData = (data || []).map(item => ({
        ...item,
        judge_profile: item.judge_profile as unknown as JudgeProfile
      }));
      
      setTournamentJudges(typedData);
    } catch (error: any) {
      console.error('Error fetching tournament judges:', error);
    }
  };

  const fetchAllJudgeProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('judge_profiles')
        .select('id, name, email, experience_level, specializations, alumni, user_id')
        .eq('status', 'approved')
        .order('name');

      if (error) throw error;
      setAllJudgeProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching judge profiles:', error);
    }
  };

  // Filter out judges already registered for this tournament
  const availableJudges = allJudgeProfiles.filter(
    jp => !tournamentJudges.some(tj => tj.judge_profile_id === jp.id)
  );

  const filteredAvailableJudges = availableJudges.filter(jp => {
    const searchLower = judgeSearch.toLowerCase();
    return (
      jp.name.toLowerCase().includes(searchLower) ||
      jp.email.toLowerCase().includes(searchLower)
    );
  });

  const handleAddJudge = async () => {
    if (!selectedJudgeId) {
      toast({
        title: "Validation Error",
        description: "Please select a judge",
        variant: "destructive",
      });
      return;
    }

    const selectedJudge = allJudgeProfiles.find(jp => jp.id === selectedJudgeId);
    if (!selectedJudge) return;

    setAddingJudge(true);
    try {
      const { error } = await supabase
        .from('tournament_judge_registrations')
        .insert({
          tournament_id: tournamentId,
          judge_profile_id: selectedJudgeId,
          user_id: selectedJudge.user_id || user?.id,
          status: 'confirmed'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedJudge.name} added to tournament judge roster`,
      });

      setSelectedJudgeId('');
      setAddDialogOpen(false);
      fetchTournamentJudges();
    } catch (error: any) {
      console.error('Error adding judge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add judge",
        variant: "destructive",
      });
    } finally {
      setAddingJudge(false);
    }
  };

  const handleRemoveJudge = async (registrationId: string, judgeName: string) => {
    if (!confirm(`Remove ${judgeName} from this tournament's judge roster?`)) return;

    setRemovingJudgeId(registrationId);
    try {
      const { error } = await supabase
        .from('tournament_judge_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${judgeName} removed from judge roster`,
      });

      fetchTournamentJudges();
    } catch (error: any) {
      console.error('Error removing judge:', error);
      toast({
        title: "Error",
        description: "Failed to remove judge",
        variant: "destructive",
      });
    } finally {
      setRemovingJudgeId(null);
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
      {/* Tournament Judge Roster */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Tournament Judge Roster
              </CardTitle>
              <CardDescription>
                Judges registered for this tournament who are eligible for assignments
              </CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Judge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Judge to Tournament</DialogTitle>
                  <DialogDescription>
                    Select an approved judge profile to add to this tournament's roster
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Search Judges</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        value={judgeSearch}
                        onChange={(e) => setJudgeSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Judge</Label>
                    <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a judge..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {filteredAvailableJudges.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No available judges found
                          </div>
                        ) : (
                          filteredAvailableJudges.slice(0, 50).map(jp => (
                            <SelectItem key={jp.id} value={jp.id}>
                              <div className="flex items-center gap-2">
                                {jp.alumni && <span className="text-amber-600 font-medium">[A]</span>}
                                {jp.name} - {jp.experience_level}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {selectedJudgeId && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {allJudgeProfiles.find(jp => jp.id === selectedJudgeId)?.email}
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleAddJudge} 
                    className="w-full" 
                    disabled={addingJudge || !selectedJudgeId}
                  >
                    {addingJudge && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add to Tournament
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {tournamentJudges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No judges registered for this tournament yet
            </div>
          ) : (
            <div className="grid gap-2">
              {tournamentJudges.map(tj => (
                <div 
                  key={tj.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {tj.judge_profile.alumni && (
                          <span className="text-amber-600 font-medium">[A]</span>
                        )}
                        {tj.judge_profile.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tj.judge_profile.email} • {tj.judge_profile.experience_level}
                      </div>
                      {tj.judge_profile.specializations?.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {tj.judge_profile.specializations.map(s => (
                            <Badge key={s} variant="outline" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={tj.status === 'confirmed' ? 'default' : 'secondary'}>
                      {tj.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveJudge(tj.id, tj.judge_profile.name)}
                      disabled={removingJudgeId === tj.id}
                    >
                      {removingJudgeId === tj.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pairings View */}
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
                              <strong>Judge:</strong> {pairing.judge_profiles?.alumni && <span className="text-amber-600 font-medium">[A] </span>}{pairing.judge_profiles?.name}
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

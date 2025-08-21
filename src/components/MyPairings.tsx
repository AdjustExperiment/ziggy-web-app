
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Clock, Users, Calendar, Gavel, Send } from 'lucide-react';

interface Pairing {
  id: string;
  tournament_id: string;
  round_id: string;
  room: string;
  scheduled_time: string;
  scheduling_status: string;
  released: boolean;
  aff_participant: { participant_name: string };
  neg_participant: { participant_name: string };
  round: { name: string };
  tournament: { name: string };
  judge_assignments: Array<{
    judge_profiles: { name: string; email: string };
  }>;
}

interface PairingMessage {
  id: string;
  message: string;
  sender_user_id: string;
  created_at: string;
  sender_profile: { first_name: string; last_name: string };
}

export function MyPairings() {
  const { user } = useAuth();
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPairing, setSelectedPairing] = useState<string>('');
  const [messages, setMessages] = useState<PairingMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [confirmingTime, setConfirmingTime] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyPairings();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPairing) {
      fetchMessages();
      
      // Subscribe to real-time messages
      const channel = supabase
        .channel(`pairing_messages_${selectedPairing}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pairing_messages',
            filter: `pairing_id=eq.${selectedPairing}`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedPairing]);

  const fetchMyPairings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pairings')
        .select(`
          *,
          aff_participant:tournament_registrations!aff_registration_id(participant_name),
          neg_participant:tournament_registrations!neg_registration_id(participant_name),
          round:rounds(name),
          tournament:tournaments(name),
          judge_assignments(
            judge_profiles(name, email)
          )
        `)
        .or(`aff_registration_id.in.(${await getUserRegistrationIds()}),neg_registration_id.in.(${await getUserRegistrationIds()})`)
        .eq('released', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
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

  const getUserRegistrationIds = async () => {
    if (!user) return '';
    
    const { data } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('user_id', user.id);
    
    return data?.map(r => r.id).join(',') || '';
  };

  const fetchMessages = async () => {
    if (!selectedPairing) return;

    try {
      const { data, error } = await supabase
        .from('pairing_messages')
        .select(`
          *,
          sender_profile:profiles!sender_user_id(first_name, last_name)
        `)
        .eq('pairing_id', selectedPairing)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPairing || !user) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('pairing_messages')
        .insert([{
          pairing_id: selectedPairing,
          sender_user_id: user.id,
          message: newMessage.trim()
        }]);

      if (error) throw error;

      setNewMessage('');
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const confirmTime = async () => {
    if (!proposedTime || !selectedPairing) return;

    setConfirmingTime(true);
    try {
      const { error } = await supabase.rpc('confirm_pairing_time', {
        _pairing_id: selectedPairing,
        _scheduled_time: new Date(proposedTime).toISOString()
      });

      if (error) throw error;

      toast({
        title: "Time confirmed",
        description: "The debate time has been confirmed",
      });

      setProposedTime('');
      fetchMyPairings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to confirm time",
        variant: "destructive",
      });
    } finally {
      setConfirmingTime(false);
    }
  };

  const requestJudges = async (pairingId: string, count: number = 1, auto: boolean = false) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('judge_requests')
        .insert([{
          pairing_id: pairingId,
          requested_by_user_id: user.id,
          requested_count: count,
          auto
        }]);

      if (error) throw error;

      toast({
        title: "Judge request submitted",
        description: `Request for ${count} judge${count > 1 ? 's' : ''} has been submitted`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to request judges",
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
          View your debate pairings, chat with judges, and schedule round times
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
                      {pairing.tournament.name} - {pairing.round.name}
                    </CardTitle>
                    <CardDescription>
                      Room: {pairing.room || 'TBD'}
                    </CardDescription>
                  </div>
                  <Badge variant={pairing.scheduling_status === 'confirmed' ? 'default' : 'secondary'}>
                    {pairing.scheduling_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {/* Participants */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Affirmative</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">AFF</Badge>
                        <span>{pairing.aff_participant?.participant_name}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Negative</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">NEG</Badge>
                        <span>{pairing.neg_participant?.participant_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Time */}
                  {pairing.scheduled_time && (
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Scheduled Time
                      </Label>
                      <div className="text-sm">
                        {new Date(pairing.scheduled_time).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Assigned Judges */}
                  {pairing.judge_assignments?.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Gavel className="h-4 w-4" />
                        Assigned Judges
                      </Label>
                      <div className="space-y-1">
                        {pairing.judge_assignments.map((assignment, index) => (
                          <div key={index} className="text-sm">
                            {assignment.judge_profiles.name}
                            {assignment.judge_profiles.email && (
                              <span className="text-muted-foreground ml-2">
                                ({assignment.judge_profiles.email})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedPairing(pairing.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Pairing Chat</DialogTitle>
                          <DialogDescription>
                            Communicate with judges and coordinate scheduling
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          {/* Messages */}
                          <div className="max-h-64 overflow-y-auto space-y-2 border rounded p-4">
                            {messages.length === 0 ? (
                              <p className="text-muted-foreground text-center">No messages yet</p>
                            ) : (
                              messages.map((message) => (
                                <div key={message.id} className="space-y-1">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>
                                      {message.sender_profile?.first_name} {message.sender_profile?.last_name}
                                    </span>
                                    <span>•</span>
                                    <span>{new Date(message.created_at).toLocaleString()}</span>
                                  </div>
                                  <div className="text-sm bg-muted p-2 rounded">
                                    {message.message}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Send Message */}
                          <div className="flex gap-2">
                            <Textarea
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your message..."
                              rows={2}
                              className="flex-1"
                            />
                            <Button
                              onClick={sendMessage}
                              disabled={sendingMessage || !newMessage.trim()}
                              size="sm"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>

                          <Separator />

                          {/* Time Confirmation */}
                          <div className="space-y-2">
                            <Label>Propose/Confirm Debate Time</Label>
                            <div className="flex gap-2">
                              <Input
                                type="datetime-local"
                                value={proposedTime}
                                onChange={(e) => setProposedTime(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                onClick={confirmTime}
                                disabled={confirmingTime || !proposedTime}
                                size="sm"
                              >
                                {confirmingTime ? 'Confirming...' : 'Confirm Time'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => requestJudges(pairing.id, 1, true)}
                    >
                      <Gavel className="h-4 w-4 mr-2" />
                      Request Judge (Auto)
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => requestJudges(pairing.id, 1, false)}
                    >
                      <Gavel className="h-4 w-4 mr-2" />
                      Request Judge (Manual)
                    </Button>
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

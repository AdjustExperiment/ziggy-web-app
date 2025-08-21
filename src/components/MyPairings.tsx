
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
  tournament_name: string;
  round_name: string;
  room: string;
  scheduled_time?: string;
  scheduling_status: string;
  aff_participant: string;
  neg_participant: string;
  judges: string[];
}

interface PairingMessage {
  id: string;
  message: string;
  sender_name: string;
  created_at: string;
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

  const fetchMyPairings = async () => {
    if (!user) return;

    try {
      // For now, we'll show placeholder data until the new tables are properly set up
      // This prevents TypeScript errors while maintaining the UI structure
      const placeholderPairings: Pairing[] = [
        {
          id: '1',
          tournament_name: 'Sample Tournament',
          round_name: 'Round 1',
          room: 'Room A',
          scheduled_time: new Date().toISOString(),
          scheduling_status: 'pending',
          aff_participant: 'Team A',
          neg_participant: 'Team B',
          judges: ['Judge Smith']
        }
      ];

      // Remove placeholder when real data is available
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

  const fetchMessages = async () => {
    // Placeholder for now
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPairing || !user) return;

    setSendingMessage(true);
    try {
      // Placeholder implementation
      toast({
        title: "Feature Coming Soon",
        description: "Messaging functionality will be available once the database setup is complete",
      });
      setNewMessage('');
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
      toast({
        title: "Feature Coming Soon",
        description: "Time confirmation will be available once the database setup is complete",
      });
      setProposedTime('');
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
      toast({
        title: "Feature Coming Soon",
        description: "Judge requests will be available once the database setup is complete",
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
            <p className="text-sm text-muted-foreground mt-2">
              This feature is being set up and will be fully functional soon.
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
                      {pairing.tournament_name} - {pairing.round_name}
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
                        <span>{pairing.aff_participant}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Negative</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">NEG</Badge>
                        <span>{pairing.neg_participant}</span>
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
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p>Chat functionality is being set up and will be available soon.</p>
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

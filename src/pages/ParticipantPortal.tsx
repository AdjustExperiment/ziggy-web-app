import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MyTournaments from './MyTournaments';
import { MyPairings } from '@/components/MyPairings';
import { MyJudgings } from '@/components/MyJudgings';
import { ChatPanel } from '@/components/ChatPanel';

export default function ParticipantPortal() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [chatTournament, setChatTournament] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchRegistrations();
    }
  }, [user]);

  const fetchRegistrations = async () => {
    const { data } = await supabase
      .from('tournament_registrations')
      .select('tournament_id, tournaments(name)')
      .eq('user_id', user?.id);
    setRegistrations(data || []);
    if (data && data.length > 0) {
      setChatTournament(data[0].tournament_id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="tournaments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="pairings">Pairings</TabsTrigger>
          <TabsTrigger value="judgings">Judgings</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>
        <TabsContent value="tournaments">
          <MyTournaments />
        </TabsContent>
        <TabsContent value="pairings">
          <MyPairings />
        </TabsContent>
        <TabsContent value="judgings">
          <MyJudgings />
        </TabsContent>
        <TabsContent value="chat" className="space-y-4">
          {registrations.length > 0 ? (
            <>
              <Select value={chatTournament} onValueChange={setChatTournament}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Tournament" />
                </SelectTrigger>
                <SelectContent>
                  {registrations.map((r: any) => (
                    <SelectItem key={r.tournament_id} value={r.tournament_id}>
                      {r.tournaments.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {chatTournament && <ChatPanel tournamentId={chatTournament} />}
            </>
          ) : (
            <p className="text-muted-foreground">You are not registered for any tournaments.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


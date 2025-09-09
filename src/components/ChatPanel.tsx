import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatPanelProps {
  tournamentId: string;
}

export function ChatPanel({ tournamentId }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`tournament-chat-${tournamentId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tournament_chats', filter: `tournament_id=eq.${tournamentId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tournamentId]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('tournament_chats')
      .select('id, message, created_at, profiles(first_name, last_name)')
      .eq('tournament_id', tournamentId)
      .order('created_at');
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await supabase.from('tournament_chats').insert({
      tournament_id: tournamentId,
      user_id: user?.id,
      message: newMessage,
    });
    setNewMessage('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 overflow-y-auto space-y-2 mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className="text-sm">
              <span className="font-medium mr-1">
                {msg.profiles?.first_name || 'User'}:
              </span>
              {msg.message}
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}


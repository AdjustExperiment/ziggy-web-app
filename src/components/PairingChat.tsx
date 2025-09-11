import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { Send, MessageSquare, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  message_type: string;
  created_at: string;
  metadata: any;
  sender_name?: string;
  is_own_message?: boolean;
}

interface PairingChatProps {
  pairingId: string;
  tournamentName?: string;
  roundName?: string;
  affParticipant?: string;
  negParticipant?: string;
}

export function PairingChat({ 
  pairingId, 
  tournamentName, 
  roundName, 
  affParticipant, 
  negParticipant 
}: PairingChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pairingId || !user) return;

    fetchMessages();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`pairing-chat-${pairingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pairing_chat_messages',
        filter: `pairing_id=eq.${pairingId}`,
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        setMessages(prev => [...prev, {
          ...newMessage,
          is_own_message: newMessage.sender_id === user.id,
          sender_name: newMessage.sender_id === user.id ? 'You' : 'Unknown'
        }]);
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pairingId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('pairing_chat_messages')
        .select(`
          *,
          profiles:sender_id(first_name, last_name)
        `)
        .eq('pairing_id', pairingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithNames = (data || []).map((msg: any) => ({
        ...msg,
        is_own_message: msg.sender_id === user?.id,
        sender_name: msg.sender_id === user?.id 
          ? 'You' 
          : msg.profiles 
            ? `${msg.profiles.first_name || ''} ${msg.profiles.last_name || ''}`.trim()
            : 'Unknown User'
      }));

      setMessages(messagesWithNames);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    try {
      setSending(true);
      
      const { error } = await supabase
        .from('pairing_chat_messages')
        .insert({
          pairing_id: pairingId,
          sender_id: user.id,
          message: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please log in to access the chat</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Pairing Chat
        </CardTitle>
        {(tournamentName || roundName) && (
          <div className="flex gap-2 flex-wrap">
            {tournamentName && <Badge variant="outline">{tournamentName}</Badge>}
            {roundName && <Badge variant="outline">{roundName}</Badge>}
          </div>
        )}
        {(affParticipant || negParticipant) && (
          <div className="text-sm text-muted-foreground">
            {affParticipant && <span>AFF: {affParticipant}</span>}
            {affParticipant && negParticipant && <span> • </span>}
            {negParticipant && <span>NEG: {negParticipant}</span>}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_own_message ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      message.is_own_message
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {!message.is_own_message && (
                      <div className="flex items-center gap-1 mb-1">
                        <User className="h-3 w-3" />
                        <span className="text-xs font-medium">{message.sender_name}</span>
                      </div>
                    )}
                    <div className="text-sm">{message.message}</div>
                    <div className={`text-xs mt-1 ${
                      message.is_own_message 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
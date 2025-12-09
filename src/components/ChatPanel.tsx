import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { MessageSquare, Send, Clock } from 'lucide-react';

interface ChatPanelProps {
  pairingId: string;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name: string;
  is_own_message: boolean;
}

export function ChatPanel({ pairingId }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

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
        filter: `pairing_id=eq.${pairingId}`
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pairingId, user]);

  const fetchMessages = async () => {
    if (!pairingId) return;

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
        id: msg.id,
        sender_id: msg.sender_id,
        message: msg.message,
        created_at: msg.created_at,
        sender_name: msg.profiles 
          ? `${msg.profiles.first_name || 'Anonymous'} ${msg.profiles.last_name || ''}`.trim()
          : 'Anonymous User',
        is_own_message: msg.sender_id === user?.id
      }));

      setMessages(messagesWithNames);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
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
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully',
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Pairing Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 mb-4 p-4 bg-muted/50 rounded-md">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
              <div>
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_own_message ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.is_own_message
                        ? 'bg-primary text-primary-foreground ml-2'
                        : 'bg-background border mr-2'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.is_own_message ? 'You' : message.sender_name}
                      </span>
                      <span className="text-xs opacity-70 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


import { useState, useEffect, useRef } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  sender_name?: string;
}

interface TournamentChatProps {
  tournamentId: string;
}

export default function TournamentChat({ tournamentId }: TournamentChatProps) {
  const { user, profile } = useOptimizedAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages with polling (every 10 seconds)
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('pairing_chat_messages')
        .select('id, message, created_at, sender_id')
        .eq('message_type', 'tournament_chat')
        .eq('metadata->>tournament_id', tournamentId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching tournament chat:', error);
        return;
      }

      // Fetch sender names
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(m => m.sender_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]) || []);
        
        setMessages(data.map(m => ({
          ...m,
          sender_name: profileMap.get(m.sender_id) || 'Unknown'
        })));
      } else {
        setMessages([]);
      }
      setLoading(false);
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    const { error } = await supabase
      .from('pairing_chat_messages')
      .insert({
        message: newMessage.trim(),
        sender_id: user.id,
        message_type: 'tournament_chat',
        metadata: { tournament_id: tournamentId }
      });

    if (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
      // Optimistic update
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        sender_id: user.id,
        sender_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'You'
      }]);
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-64">
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {msg.sender_name} • {format(new Date(msg.created_at), 'h:mm a')}
                </span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {user ? (
        <div className="flex gap-2 p-4 border-t border-border">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="icon">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      ) : (
        <div className="p-4 border-t border-border text-center text-sm text-muted-foreground">
          Sign in to participate in the chat
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Megaphone, Info, Calendar, MessageCircle, 
  ChevronDown, Send, Clock, MapPin, Users, FileText,
  Bell, Pin, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  is_pinned?: boolean;
}

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  sender_name?: string;
  created_at: string;
}

interface TournamentInfo {
  format?: string;
  rules?: string;
  contact_info?: string;
  schedule_notes?: string;
  description?: string;
}

interface Round {
  id: string;
  name: string;
  round_number: number;
  scheduled_date: string | null;
  status: string;
}

interface TournamentSidebarProps {
  tournamentId: string;
  tournamentName: string;
  formatName?: string;
  rounds?: Round[];
  className?: string;
}

export default function TournamentSidebar({
  tournamentId,
  tournamentName,
  formatName,
  rounds = [],
  className = ''
}: TournamentSidebarProps) {
  const { user, profile } = useOptimizedAuth();
  const [activeTab, setActiveTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch tournament content (announcements, info)
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tournament_content')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (!error && data) {
        const content = data as any;
        setAnnouncements(content.announcements || []);
        setTournamentInfo({
          format: formatName,
          rules: content.rules,
          contact_info: content.contact_info,
          schedule_notes: content.schedule_notes,
          description: content.description
        });
      }
      
      setLoading(false);
    };

    fetchContent();
  }, [tournamentId, formatName]);

  // Fetch and subscribe to chat messages (using tournament_id in metadata)
  useEffect(() => {
    const fetchMessages = async () => {
      // For tournament-wide chat, we use message_type = 'tournament_chat' with tournament_id in metadata
      const { data, error } = await supabase
        .from('pairing_chat_messages')
        .select('id, message, sender_id, created_at, metadata')
        .eq('message_type', 'tournament_chat')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching chat:', error);
        return;
      }

      // Filter by tournament_id from metadata
      const tournamentMessages = (data || []).filter(
        (m: any) => m.metadata?.tournament_id === tournamentId
      );

      if (tournamentMessages.length > 0) {
        const senderIds = [...new Set(tournamentMessages.map(m => m.sender_id).filter(Boolean))];
        if (senderIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', senderIds);

          const profileMap = new Map(
            profiles?.map(p => [p.user_id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]) || []
          );

          setChatMessages(tournamentMessages.map(m => ({
            ...m,
            sender_name: profileMap.get(m.sender_id) || 'Unknown'
          })));
        } else {
          setChatMessages(tournamentMessages.map(m => ({ ...m, sender_name: 'Unknown' })));
        }
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`tournament-chat-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pairing_chat_messages'
        },
        async (payload) => {
          const newMsg = payload.new as any;
          // Check if it's a tournament chat for this tournament
          if (newMsg.message_type === 'tournament_chat' && 
              newMsg.metadata?.tournament_id === tournamentId) {
            // Get sender name
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', newMsg.sender_id)
              .single();
            
            const senderName = senderProfile 
              ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() 
              : 'Unknown';

            setChatMessages(prev => [...prev, {
              id: newMsg.id,
              message: newMsg.message,
              sender_id: newMsg.sender_id,
              sender_name: senderName,
              created_at: newMsg.created_at
            }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSendingMessage(true);
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
    } else {
      setNewMessage('');
      setChatMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        message: newMessage.trim(),
        sender_id: user.id,
        sender_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'You',
        created_at: new Date().toISOString()
      }]);
    }
    setSendingMessage(false);
  };

  const pinnedAnnouncements = announcements.filter(a => a.is_pinned || a.priority === 'high');
  const recentAnnouncements = announcements
    .filter(a => !a.is_pinned && a.priority !== 'high')
    .slice(0, 5);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="announcements" className="text-xs">
            <Megaphone className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">News</span>
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs">
            <Info className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-xs">
            <MessageCircle className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
        </TabsList>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  {pinnedAnnouncements.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </h4>
                      {pinnedAnnouncements.map(ann => (
                        <Card key={ann.id} className="border-primary/30 bg-primary/5">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h5 className="font-medium text-sm">{ann.title}</h5>
                              <Badge variant="destructive" className="text-xs">
                                {ann.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{ann.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(ann.created_at), 'MMM d, h:mm a')}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {recentAnnouncements.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground">Recent</h4>
                      {recentAnnouncements.map(ann => (
                        <Card key={ann.id}>
                          <CardContent className="p-3">
                            <h5 className="font-medium text-sm mb-1">{ann.title}</h5>
                            <p className="text-xs text-muted-foreground">{ann.message}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {announcements.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No announcements yet</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-2">
              <Card>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Format</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tournamentInfo?.format || 'Not specified'}
                  </p>
                </CardContent>
              </Card>

              {tournamentInfo?.description && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      <span className="text-sm">Description</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <p className="text-sm text-muted-foreground p-2">
                      {tournamentInfo.description}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {tournamentInfo?.rules && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      <span className="text-sm">Rules</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <p className="text-sm text-muted-foreground p-2 whitespace-pre-wrap">
                      {tournamentInfo.rules}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {tournamentInfo?.contact_info && (
                <Card>
                  <CardContent className="p-3">
                    <h4 className="text-sm font-medium mb-1">Contact</h4>
                    <p className="text-xs text-muted-foreground">
                      {tournamentInfo.contact_info}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-2">
              {rounds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No schedule available</p>
                </div>
              ) : (
                rounds.map(round => (
                  <Card key={round.id} className={
                    round.status === 'in_progress' ? 'border-primary bg-primary/5' : ''
                  }>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-sm">{round.name}</h5>
                          {round.scheduled_date && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(round.scheduled_date), 'MMM d')}
                            </p>
                          )}
                        </div>
                        <Badge variant={
                          round.status === 'completed' ? 'secondary' :
                          round.status === 'in_progress' ? 'default' : 'outline'
                        } className="text-xs">
                          {round.status === 'completed' ? 'Done' :
                           round.status === 'in_progress' ? 'Live' : 'Upcoming'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              
              {tournamentInfo?.schedule_notes && (
                <Card className="mt-4">
                  <CardContent className="p-3">
                    <h4 className="text-sm font-medium mb-1">Notes</h4>
                    <p className="text-xs text-muted-foreground">
                      {tournamentInfo.schedule_notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="space-y-2 p-2">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">Be the first to say hello!</p>
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 ${
                        msg.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {msg.sender_name} • {format(new Date(msg.created_at), 'h:mm a')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          {user ? (
            <div className="flex gap-2 p-2 border-t">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                disabled={sendingMessage}
                className="text-sm"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={sendingMessage || !newMessage.trim()} 
                size="icon"
              >
                {sendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="p-2 border-t text-center text-sm text-muted-foreground">
              Sign in to participate in chat
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

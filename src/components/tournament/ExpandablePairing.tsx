import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, FileText, Calendar, Users, Gavel, Eye, 
  Send, Upload, Download, Loader2, AlertCircle, CheckCircle2,
  Clock, MapPin, Link as LinkIcon, User
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import JudgeVolunteerModal from './JudgeVolunteerModal';
import SpectateRequestButton from './SpectateRequestButton';

interface Pairing {
  id: string;
  aff_registration_id: string;
  neg_registration_id: string;
  judge_id: string | null;
  room: string | null;
  scheduled_time: string | null;
  status: string;
  result: any;
  aff_team?: {
    id: string;
    participant_name: string;
    partner_name: string | null;
    school_organization: string | null;
    participant_email?: string;
  };
  neg_team?: {
    id: string;
    participant_name: string;
    partner_name: string | null;
    school_organization: string | null;
    participant_email?: string;
  };
  judge?: {
    id: string;
    name: string;
    email?: string;
    alumni: boolean;
  } | null;
}

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  sender_name?: string;
}

interface Evidence {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  uploader_id: string;
}

interface ExpandablePairingProps {
  pairing: Pairing;
  roundId: string;
  tournamentId: string;
  userRole: 'admin' | 'judge' | 'competitor' | 'observer' | 'spectator' | null;
  userRegistrationId?: string | null;
  userJudgeProfileId?: string | null;
  allowJudgeVolunteering?: boolean;
  onClose?: () => void;
  onRefresh?: () => void;
}

export default function ExpandablePairing({
  pairing,
  roundId,
  tournamentId,
  userRole,
  userRegistrationId,
  userJudgeProfileId,
  allowJudgeVolunteering = false,
  onClose,
  onRefresh
}: ExpandablePairingProps) {
  const { user, profile } = useOptimizedAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(true);
  const [loadingEvidence, setLoadingEvidence] = useState(true);
  const [sending, setSending] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);

  const isParticipant = userRegistrationId && 
    (pairing.aff_registration_id === userRegistrationId || pairing.neg_registration_id === userRegistrationId);
  const isAssignedJudge = userJudgeProfileId && pairing.judge_id === userJudgeProfileId;
  const isObserver = userRole === 'observer';
  const isSpectator = userRole === 'spectator';
  const isAdmin = userRole === 'admin';
  const needsJudge = !pairing.judge_id;

  const canChat = isParticipant || isAssignedJudge || isAdmin;
  const canUploadEvidence = isParticipant || isAssignedJudge || isAdmin;
  const canViewEvidence = isParticipant || isAssignedJudge || isAdmin;
  const canVolunteer = userRole === 'judge' && !isAssignedJudge && needsJudge && allowJudgeVolunteering;

  // Fetch chat messages with polling
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('pairing_chat_messages')
        .select('id, message, created_at, sender_id')
        .eq('pairing_id', pairing.id)
        .is('message_type', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chat:', error);
        setLoadingChat(false);
        return;
      }

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
      }
      setLoadingChat(false);
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [pairing.id]);

  // Fetch evidence
  useEffect(() => {
    const fetchEvidence = async () => {
      const { data, error } = await supabase
        .from('pairing_evidence')
        .select('*')
        .eq('pairing_id', pairing.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching evidence:', error);
      } else {
        setEvidence(data || []);
      }
      setLoadingEvidence(false);
    };

    if (canViewEvidence) {
      fetchEvidence();
    } else {
      setLoadingEvidence(false);
    }
  }, [pairing.id, canViewEvidence]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !canChat) return;

    setSending(true);
    const { error } = await supabase
      .from('pairing_chat_messages')
      .insert({
        pairing_id: pairing.id,
        message: newMessage.trim(),
        sender_id: user.id
      });

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !canUploadEvidence) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `${pairing.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('pairing-evidence')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Failed to upload file');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('pairing-evidence')
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase
      .from('pairing_evidence')
      .insert({
        pairing_id: pairing.id,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        uploader_id: user.id
      });

    if (insertError) {
      toast.error('Failed to save evidence record');
    } else {
      toast.success('File uploaded successfully');
      setEvidence(prev => [{
        id: crypto.randomUUID(),
        file_name: file.name,
        file_url: publicUrl,
        created_at: new Date().toISOString(),
        uploader_id: user.id
      }, ...prev]);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">AFF</Badge>
              {pairing.aff_team?.participant_name}
              {pairing.aff_team?.partner_name && ` / ${pairing.aff_team.partner_name}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {pairing.aff_team?.school_organization && (
              <p>{pairing.aff_team.school_organization}</p>
            )}
            {(isAdmin || isAssignedJudge) && pairing.aff_team?.participant_email && (
              <p className="text-xs mt-1">{pairing.aff_team.participant_email}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="outline">NEG</Badge>
              {pairing.neg_team?.participant_name}
              {pairing.neg_team?.partner_name && ` / ${pairing.neg_team.partner_name}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {pairing.neg_team?.school_organization && (
              <p>{pairing.neg_team.school_organization}</p>
            )}
            {(isAdmin || isAssignedJudge) && pairing.neg_team?.participant_email && (
              <p className="text-xs mt-1">{pairing.neg_team.participant_email}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Info */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Gavel className="h-4 w-4 text-muted-foreground" />
          <span>
            {pairing.judge ? (
              <>
                {pairing.judge.name}
                {pairing.judge.alumni && <span className="text-primary ml-1">[A]</span>}
              </>
            ) : (
              <span className="text-red-400">No judge assigned</span>
            )}
          </span>
        </div>
        
        {pairing.scheduled_time && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(pairing.scheduled_time), 'MMM d, yyyy h:mm a')}</span>
          </div>
        )}
        
        {pairing.room && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{pairing.room}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canVolunteer && (
          <Button onClick={() => setShowVolunteerModal(true)} className="gap-2">
            <Gavel className="h-4 w-4" />
            Volunteer to Judge
          </Button>
        )}
        
        {isSpectator && (
          <SpectateRequestButton
            pairingId={pairing.id}
            tournamentId={tournamentId}
          />
        )}
        
        {isAssignedJudge && !pairing.result && (
          <Button variant="outline" className="gap-2" asChild>
            <a href={`/pairings/${pairing.id}`}>
              <FileText className="h-4 w-4" />
              Submit Ballot
            </a>
          </Button>
        )}
      </div>

      {/* Tabs for Chat/Evidence */}
      {(canChat || canViewEvidence || isObserver) && (
        <Tabs defaultValue="discussion" className="mt-4">
          <TabsList>
            <TabsTrigger value="discussion" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Discussion
            </TabsTrigger>
            {canViewEvidence && (
              <TabsTrigger value="evidence" className="gap-2">
                <FileText className="h-4 w-4" />
                Evidence
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="discussion" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <ScrollArea className="h-48">
                  {loadingChat ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No messages yet
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

                {canChat && (
                  <div className="flex gap-2 mt-4">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      disabled={sending}
                    />
                    <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} size="icon">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
                
                {isObserver && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Observers can view but not send messages
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {canViewEvidence && (
            <TabsContent value="evidence" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  {canUploadEvidence && (
                    <div className="mb-4">
                      <label className="block">
                        <Button variant="outline" className="gap-2 cursor-pointer" asChild>
                          <span>
                            <Upload className="h-4 w-4" />
                            Upload Evidence
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleFileUpload}
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            />
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}

                  {loadingEvidence ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : evidence.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No evidence uploaded
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {evidence.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{file.file_name}</span>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Judge Volunteer Modal */}
      <JudgeVolunteerModal
        open={showVolunteerModal}
        onOpenChange={setShowVolunteerModal}
        pairing={pairing}
        tournamentId={tournamentId}
        onSuccess={() => {
          setShowVolunteerModal(false);
          onRefresh?.();
        }}
      />
    </div>
  );
}

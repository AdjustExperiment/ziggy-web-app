import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, FileText, Calendar, Gavel, 
  Send, Upload, Download, Loader2, Clock, MapPin, Link as LinkIcon, User
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

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('pairing_chat_messages')
        .select('id, message, created_at, sender_id')
        .eq('pairing_id', pairing.id)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const senderIds = [...new Set(data.map(m => m.sender_id).filter(Boolean))];
        if (senderIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', senderIds);

          const profileMap = new Map(profiles?.map(p => [p.user_id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]) || []);
          setMessages(data.map(m => ({ ...m, sender_name: profileMap.get(m.sender_id) || 'Unknown' })));
        } else {
          setMessages(data.map(m => ({ ...m, sender_name: 'Unknown' })));
        }
      }
      setLoadingChat(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`pairing-chat-${pairing.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pairing_chat_messages', filter: `pairing_id=eq.${pairing.id}` },
        async (payload) => {
          const newMsg = payload.new as any;
          const { data: senderProfile } = await supabase.from('profiles').select('first_name, last_name').eq('user_id', newMsg.sender_id).single();
          const senderName = senderProfile ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() : 'Unknown';
          setMessages(prev => [...prev, { id: newMsg.id, message: newMsg.message, created_at: newMsg.created_at, sender_id: newMsg.sender_id, sender_name: senderName }]);
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pairing.id]);

  useEffect(() => {
    const fetchEvidence = async () => {
      const { data } = await supabase.from('pairing_evidence').select('*').eq('pairing_id', pairing.id).order('created_at', { ascending: false });
      setEvidence(data || []);
      setLoadingEvidence(false);
    };
    if (canViewEvidence) fetchEvidence();
    else setLoadingEvidence(false);
  }, [pairing.id, canViewEvidence]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !canChat) return;
    setSending(true);
    const { error } = await supabase.from('pairing_chat_messages').insert({ pairing_id: pairing.id, message: newMessage.trim(), sender_id: user.id });
    if (error) toast.error('Failed to send message');
    else setNewMessage('');
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !canUploadEvidence) return;
    const filePath = `${pairing.id}/${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('pairing-evidence').upload(filePath, file);
    if (uploadError) { toast.error('Failed to upload file'); return; }
    const { data: { publicUrl } } = supabase.storage.from('pairing-evidence').getPublicUrl(filePath);
    const { error: insertError } = await supabase.from('pairing_evidence').insert({ pairing_id: pairing.id, file_name: file.name, file_url: publicUrl, file_size: file.size, file_type: file.type, uploader_id: user.id });
    if (insertError) toast.error('Failed to save evidence record');
    else { toast.success('File uploaded'); setEvidence(prev => [{ id: crypto.randomUUID(), file_name: file.name, file_url: publicUrl, created_at: new Date().toISOString(), uploader_id: user.id }, ...prev]); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Badge className="bg-primary text-primary-foreground">Affirmative</Badge>{pairing.result?.winner === 'aff' && <Badge className="bg-green-500/20 text-green-600">win</Badge>}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-3"><User className="h-5 w-5 text-muted-foreground mt-0.5" /><div><p className="font-medium">{pairing.aff_team?.participant_name}</p>{(isAdmin || isAssignedJudge || isParticipant) && pairing.aff_team?.participant_email && <p className="text-xs text-muted-foreground">{pairing.aff_team.participant_email}</p>}</div></div>
            {pairing.aff_team?.partner_name && <div className="flex items-start gap-3"><User className="h-5 w-5 text-muted-foreground mt-0.5" /><p className="font-medium">{pairing.aff_team.partner_name}</p></div>}
          </CardContent>
        </Card>
        <Card className="border-border bg-muted/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Badge variant="outline">Negative</Badge>{pairing.result?.winner === 'neg' && <Badge className="bg-green-500/20 text-green-600">win</Badge>}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-3"><User className="h-5 w-5 text-muted-foreground mt-0.5" /><div><p className="font-medium">{pairing.neg_team?.participant_name}</p>{(isAdmin || isAssignedJudge || isParticipant) && pairing.neg_team?.participant_email && <p className="text-xs text-muted-foreground">{pairing.neg_team.participant_email}</p>}</div></div>
            {pairing.neg_team?.partner_name && <div className="flex items-start gap-3"><User className="h-5 w-5 text-muted-foreground mt-0.5" /><p className="font-medium">{pairing.neg_team.partner_name}</p></div>}
          </CardContent>
        </Card>
      </div>

      {/* Room */}
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" />Room</CardTitle></CardHeader><CardContent>{pairing.room ? (pairing.room.startsWith('http') ? <a href={pairing.room} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2"><LinkIcon className="h-4 w-4" />{pairing.room}</a> : <span>{pairing.room}</span>) : <span className="text-muted-foreground">No room assigned</span>}</CardContent></Card>

      {/* Judge */}
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gavel className="h-4 w-4" />Judge</CardTitle></CardHeader><CardContent>{pairing.judge ? <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">{pairing.judge.name.charAt(0)}</div><div><p className="font-medium">{pairing.judge.name}{pairing.judge.alumni && <Badge variant="outline" className="ml-2 text-xs">[A]</Badge>}</p>{(isAdmin || isParticipant) && pairing.judge.email && <p className="text-xs text-muted-foreground">{pairing.judge.email}</p>}</div></div>{isAssignedJudge && !pairing.result && <Button size="sm" asChild><a href={`/pairings/${pairing.id}`}><FileText className="h-4 w-4 mr-2" />Ballot</a></Button>}</div> : <div className="flex items-center justify-between"><span className="text-red-400">No judge assigned</span>{canVolunteer && <Button onClick={() => setShowVolunteerModal(true)} size="sm"><Gavel className="h-4 w-4 mr-2" />Volunteer</Button>}</div>}</CardContent></Card>

      {/* Schedule */}
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Schedule</CardTitle></CardHeader><CardContent>{pairing.scheduled_time ? <div className="flex items-center gap-4"><Clock className="h-4 w-4 text-muted-foreground" /><span>{format(new Date(pairing.scheduled_time), 'MMMM d, yyyy h:mm a')}</span></div> : <span className="text-muted-foreground">Awaiting Schedule</span>}</CardContent></Card>

      {/* Discussion */}
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageCircle className="h-4 w-4" />Discussion</CardTitle></CardHeader><CardContent><ScrollArea className="h-48 mb-4">{loadingChat ? <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div> : messages.length === 0 ? <p className="text-center text-muted-foreground py-8">No messages yet</p> : <div className="space-y-4">{messages.map((msg) => <div key={msg.id} className="flex gap-3"><div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">{msg.sender_name?.charAt(0) || '?'}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="font-medium text-sm">{msg.sender_name}</span><span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), 'MMM d, h:mm a')}</span></div><p className="text-sm mt-1 break-words">{msg.message}</p></div></div>)}</div>}</ScrollArea>{canChat && <div className="flex gap-2"><Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." disabled={sending} /><Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} size="icon">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></div>}{isObserver && <p className="text-xs text-muted-foreground mt-2 text-center">Observers can view but not send messages</p>}</CardContent></Card>

      {/* Evidence */}
      {canViewEvidence && <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Evidence</CardTitle></CardHeader><CardContent>{canUploadEvidence && <div className="mb-4"><label><Button variant="outline" className="gap-2 cursor-pointer" asChild><span><Upload className="h-4 w-4" />Upload Evidence<input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" /></span></Button></label></div>}{loadingEvidence ? <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : evidence.length === 0 ? <p className="text-center text-muted-foreground py-4">No evidence uploaded</p> : <div className="space-y-2">{evidence.map((file) => <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50"><span className="text-sm truncate flex-1">{file.file_name}</span><Button variant="ghost" size="sm" asChild><a href={file.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a></Button></div>)}</div>}</CardContent></Card>}

      {isSpectator && <div className="flex justify-center"><SpectateRequestButton pairingId={pairing.id} tournamentId={tournamentId} /></div>}
      {showVolunteerModal && <JudgeVolunteerModal pairingId={pairing.id} tournamentId={tournamentId} onClose={() => setShowVolunteerModal(false)} onSuccess={() => { setShowVolunteerModal(false); onRefresh?.(); }} />}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquare, Upload, Download, Users, Clock, MapPin, Calendar, Mail, Phone, Gavel, FileText, Send, X, Eye, UserCheck, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import JudgeRequestModal from '@/components/JudgeRequestModal';
import EnhancedJudgeRequestModal from '@/components/EnhancedJudgeRequestModal';

interface PairingDetailData {
  id: string;
  room: string | null;
  scheduled_time: string | null;
  status: string;
  tournament_id: string;
  round: {
    id: string;
    name: string;
    round_number: number;
    scheduled_date: string | null;
  };
  tournament: {
    id: string;
    name: string;
    location: string;
    format: string;
  };
  aff_registration: {
    id: string;
    participant_name: string;
    participant_email: string;
    partner_name: string | null;
    school_organization: string | null;
    user_id: string;
  };
  neg_registration: {
    id: string;
    participant_name: string;
    participant_email: string;
    partner_name: string | null;
    school_organization: string | null;
    user_id: string;
  };
  judge_profile: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    experience_level: string;
    qualifications: string | null;
    bio: string | null;
    availability: any;
  } | null;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name: string;
}

interface Evidence {
  id: string;
  uploader_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  created_at: string;
  uploader_name: string;
}

export default function PairingDetail() {
  const { pairingId } = useParams<{ pairingId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pairing, setPairing] = useState<PairingDetailData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [userSide, setUserSide] = useState<'aff' | 'neg' | null>(null);
  const [showJudgeRequest, setShowJudgeRequest] = useState(false);

  useEffect(() => {
    if (pairingId && user) {
      fetchPairingDetail();
      fetchMessages();
      fetchEvidence();
      
      // Set up realtime subscription for messages
      const channel = supabase
        .channel('pairing_chat_messages')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'pairing_chat_messages', filter: `pairing_id=eq.${pairingId}` },
          () => { fetchMessages(); }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [pairingId, user]);

  const fetchPairingDetail = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('pairings')
        .select(`
          *,
          round:rounds (
            id,
            name,
            round_number,
            scheduled_date
          ),
          tournament:tournaments (
            id,
            name,
            location,
            format
          ),
          aff_registration:tournament_registrations!aff_registration_id (
            id,
            participant_name,
            participant_email,
            partner_name,
            school_organization,
            user_id
          ),
          neg_registration:tournament_registrations!neg_registration_id (
            id,
            participant_name,
            participant_email,
            partner_name,
            school_organization,
            user_id
          ),
          judge_profile:judge_profiles (
            id,
            name,
            email,
            phone,
            experience_level,
            qualifications,
            bio,
            availability
          )
        `)
        .eq('id', pairingId)
        .single();

      if (error) throw error;
      
      setPairing(data);
      
      // Determine user's side
      if (data.aff_registration.user_id === user?.id) {
        setUserSide('aff');
      } else if (data.neg_registration.user_id === user?.id) {
        setUserSide('neg');
      }
      
    } catch (error) {
      console.error('Error fetching pairing:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pairing details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('pairing_chat_messages')
        .select('*')
        .eq('pairing_id', pairingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Get sender names from profiles
      const messagesWithNames: Message[] = [];
      if (data) {
        for (const msg of data) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', msg.sender_id)
            .maybeSingle();
          
          messagesWithNames.push({
            ...msg,
            sender_name: profile 
              ? `${profile.first_name || 'Anonymous'} ${profile.last_name || ''}`.trim()
              : 'Anonymous User'
          });
        }
      }
      
      setMessages(messagesWithNames);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchEvidence = async () => {
    try {
      const { data, error } = await supabase
        .from('pairing_evidence')
        .select('*')
        .eq('pairing_id', pairingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get uploader names from profiles
      const evidenceWithNames: Evidence[] = [];
      if (data) {
        for (const ev of data) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', ev.uploader_id)
            .single();
          
          evidenceWithNames.push({
            ...ev,
            uploader_name: profile 
              ? `${profile.first_name || 'Anonymous'} ${profile.last_name || ''}`.trim()
              : 'Anonymous User'
          });
        }
      }
      
      setEvidence(evidenceWithNames);
    } catch (error) {
      console.error('Error fetching evidence:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    try {
      setSendingMessage(true);
      
      const { error } = await supabase
        .from('pairing_chat_messages')
        .insert({
          pairing_id: pairingId,
          sender_id: user.id,
          message: newMessage.trim()
        });

      if (error) throw error;
      
      setNewMessage('');
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully',
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const uploadEvidence = async (file: File, description: string) => {
    if (!user) return;
    
    try {
      setUploadingFile(true);
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pairing-evidence')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pairing-evidence')
        .getPublicUrl(fileName);

      // Save evidence record
      const { error: insertError } = await supabase
        .from('pairing_evidence')
        .insert({
          pairing_id: pairingId,
          uploader_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
          description: description
        });

      if (insertError) throw insertError;
      
      toast({
        title: 'File uploaded',
        description: 'Evidence file has been uploaded successfully',
      });
      
      fetchEvidence(); // Refresh evidence list
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const getJudgeExperienceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'expert': return 'default';
      case 'experienced': return 'secondary';
      case 'novice': return 'outline';
      default: return 'secondary';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'aff' ? 'default' : 'secondary';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!pairing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Pairing Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The pairing you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link to="/my-tournaments">Back to My Tournaments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to={`/tournaments/${pairing.tournament.id}/postings`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Postings
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Pairing Details</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-muted-foreground">
              <span className="text-xl font-medium">{pairing.tournament.name}</span>
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {pairing.tournament.location}
              </span>
              <Badge variant="outline">{pairing.tournament.format}</Badge>
            </div>
          </div>
          
          {userSide && (
            <Badge variant={getSideColor(userSide)} className="text-lg px-4 py-2">
              You are {userSide.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Round & Match Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            {pairing.round.name} - Round {pairing.round.round_number}
          </CardTitle>
          <CardDescription className="flex items-center gap-4">
            {pairing.round.scheduled_date && (
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(pairing.round.scheduled_date).toLocaleDateString()}
              </span>
            )}
            {pairing.scheduled_time && (
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {new Date(pairing.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {pairing.room && (
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Room {pairing.room}
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Affirmative */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="default">Affirmative</Badge>
                {userSide === 'aff' && <Badge variant="outline">You</Badge>}
              </div>
              <div>
                <h4 className="font-medium text-lg">{pairing.aff_registration.participant_name}</h4>
                {pairing.aff_registration.partner_name && (
                  <p className="text-muted-foreground">{pairing.aff_registration.partner_name}</p>
                )}
                {pairing.aff_registration.school_organization && (
                  <p className="text-sm text-muted-foreground">{pairing.aff_registration.school_organization}</p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{pairing.aff_registration.participant_email}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Negative */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Negative</Badge>
                {userSide === 'neg' && <Badge variant="outline">You</Badge>}
              </div>
              <div>
                <h4 className="font-medium text-lg">{pairing.neg_registration.participant_name}</h4>
                {pairing.neg_registration.partner_name && (
                  <p className="text-muted-foreground">{pairing.neg_registration.partner_name}</p>
                )}
                {pairing.neg_registration.school_organization && (
                  <p className="text-sm text-muted-foreground">{pairing.neg_registration.school_organization}</p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{pairing.neg_registration.participant_email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Judge Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Judge Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pairing.judge_profile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-lg">{pairing.judge_profile.name}</h4>
                  <Badge variant={getJudgeExperienceColor(pairing.judge_profile.experience_level)}>
                    {pairing.judge_profile.experience_level}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{pairing.judge_profile.email}</span>
                  </div>
                  
                  {pairing.judge_profile.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{pairing.judge_profile.phone}</span>
                    </div>
                  )}
                </div>

                {pairing.judge_profile.qualifications && (
                  <div>
                    <h5 className="font-medium text-sm mb-1">Qualifications</h5>
                    <p className="text-sm text-muted-foreground">{pairing.judge_profile.qualifications}</p>
                  </div>
                )}

                {pairing.judge_profile.bio && (
                  <div>
                    <h5 className="font-medium text-sm mb-1">About</h5>
                    <p className="text-sm text-muted-foreground">{pairing.judge_profile.bio}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p>Judge not yet assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Communication & Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Pairing Chat
            </CardTitle>
            <CardDescription>
              Communicate with your opponent about scheduling and logistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Messages */}
              <ScrollArea className="h-64 border rounded-lg p-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs rounded-lg p-3 ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="text-xs opacity-75 mb-1">
                            {message.sender_name} • {new Date(message.created_at).toLocaleTimeString()}
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[40px] max-h-[120px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evidence Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Evidence & Documents
            </CardTitle>
            <CardDescription>
              Upload and share evidence, cases, and other materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Upload Area */}
              <EvidenceUpload onUpload={uploadEvidence} uploading={uploadingFile} />
              
              {/* Evidence List */}
              <div className="space-y-2">
                {evidence.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm">No evidence uploaded yet</p>
                  </div>
                ) : (
                  evidence.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded by {file.uploader_name} • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                        {file.description && (
                          <p className="text-xs text-muted-foreground mt-1">{file.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={file.file_url} download={file.file_name}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Evidence Upload Component
function EvidenceUpload({ onUpload, uploading }: { onUpload: (file: File, description: string) => void; uploading: boolean }) {
  const [dragActive, setDragActive] = useState(false);
  const [description, setDescription] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setShowDialog(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setShowDialog(true);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile, description);
      setSelectedFile(null);
      setDescription('');
      setShowDialog(false);
    }
  };

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {dragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, DOC, TXT files up to 10MB
        </p>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.rtf"
        />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Evidence</DialogTitle>
            <DialogDescription>
              Add a description for this file (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">File: {selectedFile?.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedFile && `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
              </p>
            </div>
            <Textarea
              placeholder="Optional description of this evidence file..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScheduleProposalModal } from './ScheduleProposalModal';
import { PairingChat } from './PairingChat';
import { SpectateRequestManager } from './SpectateRequestManager';
import { 
  Clock, 
  MapPin, 
  Users, 
  MessageCircle, 
  Calendar,
  FileText,
  Eye,
  Gavel,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';

interface MatchDetails {
  id: string;
  tournament_name: string;
  round_name: string;
  aff_team: string;
  neg_team: string;
  scheduled_time?: string;
  room?: string;
  status: string;
  judge_name?: string;
  user_registration_id: string;
  is_aff: boolean;
}

export function EnhancedMyMatch() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { user } = useOptimizedAuth();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!user || !tournamentId) return;
    fetchMatchDetails();
  }, [user, tournamentId]);

  const fetchMatchDetails = async () => {
    if (!user || !tournamentId) return;

    try {
      const { data, error } = await supabase
        .from('pairings')
        .select(`
          id,
          scheduled_time,
          room,
          status,
          tournaments!inner (
            name
          ),
          rounds!inner (
            name
          ),
          judge_profiles (
            name
          ),
          aff_registration:tournament_registrations!aff_registration_id (
            id,
            participant_name,
            school_organization,
            user_id
          ),
          neg_registration:tournament_registrations!neg_registration_id (
            id,
            participant_name,
            school_organization,
            user_id
          )
        `)
        .eq('tournament_id', tournamentId)
        .or(`aff_registration.user_id.eq.${user.id},neg_registration.user_id.eq.${user.id}`)
        .single();

      if (error) throw error;

      if (data) {
        const isAff = data.aff_registration.user_id === user.id;
        const userRegistrationId = isAff ? data.aff_registration.id : data.neg_registration.id;

        setMatch({
          id: data.id,
          tournament_name: data.tournaments.name,
          round_name: data.rounds.name,
          aff_team: `${data.aff_registration.participant_name}${
            data.aff_registration.school_organization 
              ? ` (${data.aff_registration.school_organization})` 
              : ''
          }`,
          neg_team: `${data.neg_registration.participant_name}${
            data.neg_registration.school_organization 
              ? ` (${data.neg_registration.school_organization})` 
              : ''
          }`,
          scheduled_time: data.scheduled_time,
          room: data.room,
          status: data.status,
          judge_name: data.judge_profiles?.name,
          user_registration_id: userRegistrationId,
          is_aff: isAff
        });
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading match details...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No match found</h3>
          <p className="text-muted-foreground">
            You don't have any matches scheduled for this tournament yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{match.tournament_name}</CardTitle>
              <CardDescription>{match.round_name}</CardDescription>
            </div>
            <Badge 
              variant={
                match.status === 'completed' ? 'default' : 
                match.status === 'in_progress' ? 'secondary' : 
                'outline'
              }
            >
              {match.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Affirmative Team</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{match.aff_team}</p>
                  {match.is_aff && <Badge variant="secondary">You</Badge>}
                </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Negative Team</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{match.neg_team}</p>
                  {!match.is_aff && <Badge variant="secondary">You</Badge>}
                </div>
            </div>
          </div>

          <Separator />

          {/* Schedule & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {match.scheduled_time && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(match.scheduled_time), 'PPp')}</span>
              </div>
            )}
            {match.room && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{match.room}</span>
              </div>
            )}
            {match.judge_name && (
              <div className="flex items-center gap-2 text-sm">
                <Gavel className="h-4 w-4 text-muted-foreground" />
                <span>Judge: {match.judge_name}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Propose Schedule Change
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {showChat ? 'Hide Chat' : 'Open Chat'}
            </Button>

            <Button 
              variant="outline" 
              asChild
              className="flex items-center gap-2"
            >
              <a href={`/pairings/${match.id}`}>
                <FileText className="h-4 w-4" />
                View Full Details
              </a>
            </Button>

            <Button 
              variant="outline" 
              asChild
              className="flex items-center gap-2"
            >
              <a href={`/pairings/${match.id}?tab=evidence`}>
                <Upload className="h-4 w-4" />
                Upload Evidence
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat Panel */}
      {showChat && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Match Chat
            </CardTitle>
            <CardDescription>
              Chat with your opponent and judge about this match
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PairingChat pairingId={match.id} />
          </CardContent>
        </Card>
      )}

      {/* Remove Spectate Requests section since we don't have the full pairing data needed */}

      {/* Schedule Proposal Modal */}
      <ScheduleProposalModal
        pairingId={match.id}
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSubmit={fetchMatchDetails}
      />
    </div>
  );
}
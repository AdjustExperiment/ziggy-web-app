import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TournamentDetailSkeleton } from '@/components/loading';
import { GradientButton } from '@/components/ui/gradient-button';
import { 
  Trophy, Calendar, MapPin, Users, Clock, ChevronRight,
  Award, Edit, Shield, Mail, Phone, ArrowRight
} from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { TournamentCalendarView } from '@/components/TournamentCalendarView';
import { format } from 'date-fns';

interface Tournament {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  current_participants: number;
  max_participants: number;
  description?: string;
  format: string;
  registration_fee?: number;
}

interface TournamentContent {
  id: string;
  tournament_id: string;
  description?: string;
  schedule_notes?: string;
  contact_info?: string;
}

interface UserRegistration {
  id: string;
  participant_name: string;
  payment_status: string;
}

interface RelatedTournament {
  id: string;
  name: string;
  format: string;
  start_date: string;
  end_date: string;
  location: string;
  status: string;
  registration_open: boolean;
}

export default function TournamentLanding() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { user, profile, canAccessTournament, isAdmin } = useOptimizedAuth();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [content, setContent] = useState<TournamentContent | null>(null);
  const [userRegistration, setUserRegistration] = useState<UserRegistration | null>(null);
  const [relatedTournaments, setRelatedTournaments] = useState<RelatedTournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);

      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      const { data: contentData } = await supabase
        .from('tournament_content')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (contentData) {
        setContent(contentData as any);
      }

      if (user) {
        const { data: registrationData } = await supabase
          .from('tournament_registrations')
          .select('id, participant_name, payment_status')
          .eq('tournament_id', tournamentId)
          .eq('user_id', user.id)
          .single();

        if (registrationData) {
          setUserRegistration(registrationData);
        }
      }

      if (tournamentData) {
        const { data: relatedData } = await supabase
          .from('tournaments')
          .select('id, name, format, start_date, end_date, location, status, registration_open')
          .eq('format', tournamentData.format)
          .neq('id', tournamentId)
          .limit(3);

        if (relatedData) {
          setRelatedTournaments(relatedData);
        }
      }
    } catch (error: any) {
      console.error('Error fetching tournament data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tournament information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'secondary';
      case 'active':
      case 'in progress': return 'default';
      case 'registration open': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <TournamentDetailSkeleton />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tournament Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The tournament you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/tournaments">Browse Tournaments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <BackButton fallbackRoute="/tournaments">
          Back to Tournaments
        </BackButton>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {tournament.location}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {tournament.current_participants}/{tournament.max_participants} participants
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge variant={getStatusColor(tournament.status) as any} className="text-sm px-3 py-1">
              {tournament.status}
            </Badge>
            {canAccessTournament(tournament.id) && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/admin?tab=tournaments&selected=${tournament.id}`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Manage
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Primary CTA: Enter Tournament */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <GradientButton asChild>
            <Link to={`/tournaments/${tournament.id}/live`}>
              Enter Tournament
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </GradientButton>

          {!userRegistration && tournament.status === 'Registration Open' && (
            <Button variant="outline" asChild>
              <Link to={`/tournaments/${tournament.id}/register`}>
                Register Now
              </Link>
            </Button>
          )}

          {userRegistration && (
            <Badge variant="default" className="text-sm">
              ✓ Registered as {userRegistration.participant_name}
            </Badge>
          )}

          {canAccessTournament(tournament.id) && !userRegistration && (
            <Badge variant="secondary">
              <Shield className="w-3 h-3 mr-1" />
              Admin View
            </Badge>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tournament Info */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Format</h4>
                <p className="text-muted-foreground">{tournament.format}</p>
              </div>
              {content?.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{content.description}</p>
                </div>
              )}
              {tournament.description && (
                <div>
                  <h4 className="font-medium mb-2">About</h4>
                  <p className="text-muted-foreground">{tournament.description}</p>
                </div>
              )}
              {content?.schedule_notes && (
                <div>
                  <h4 className="font-medium mb-2">Schedule Notes</h4>
                  <p className="text-muted-foreground">{content.schedule_notes}</p>
                </div>
              )}
              {content?.contact_info && (
                <div>
                  <h4 className="font-medium mb-2">Contact</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{content.contact_info}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <TournamentCalendarView tournament={{
                id: tournament.id,
                name: tournament.name,
                start_date: tournament.start_date,
                end_date: tournament.end_date,
                location: tournament.location,
                format: tournament.format,
                status: tournament.status
              }} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Status</CardTitle>
            </CardHeader>
            <CardContent>
              {userRegistration ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status</span>
                    <Badge variant="default">Registered</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Payment</span>
                    <Badge variant={userRegistration.payment_status === 'paid' ? 'default' : 'outline'}>
                      {userRegistration.payment_status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Registered as: {userRegistration.participant_name}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">You are not registered for this tournament.</p>
                  {tournament.status === 'Registration Open' && (
                    <Button asChild className="w-full">
                      <Link to={`/tournaments/${tournament.id}/register`}>
                        Register Now
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {tournament.registration_fee != null && tournament.registration_fee > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Registration Fee</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${tournament.registration_fee}</div>
                <p className="text-sm text-muted-foreground">Per participant</p>
              </CardContent>
            </Card>
          )}

          {/* Enter Tournament CTA (sidebar) */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 text-center space-y-3">
              <Trophy className="h-8 w-8 mx-auto text-primary" />
              <p className="text-sm font-medium">
                View rounds, pairings, standings, and chat inside the tournament.
              </p>
              <Button asChild className="w-full">
                <Link to={`/tournaments/${tournament.id}/live`}>
                  Enter Tournament <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Tournaments */}
      {relatedTournaments.length > 0 && (
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Related Tournaments
              </CardTitle>
              <CardDescription>
                Other {tournament.format} tournaments you might be interested in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedTournaments.map((rt) => (
                  <Card key={rt.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <Badge variant={rt.status === 'Registration Open' ? 'default' : 'secondary'} className="mb-2">
                        {rt.status}
                      </Badge>
                      <h5 className="font-medium mb-2">{rt.name}</h5>
                      <div className="text-sm text-muted-foreground mb-2">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(rt.start_date), "MMM d")} - {format(new Date(rt.end_date), "MMM d, yyyy")}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {rt.location}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={`/tournaments/${rt.id}`}>
                          View Details <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

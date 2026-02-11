import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TournamentDetailSkeleton } from '@/components/loading';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  FileText, 
  Megaphone,
  Building,
  Phone,
  Mail,
  BookOpen,
  ChevronRight,
  Award,
  Edit,
  Shield
} from 'lucide-react';
import { TournamentContentManager } from '@/components/admin/TournamentContentManager';
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
  announcements: Array<{
    id: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    created_at: string;
  }>;
  description?: string;
  sponsors: Array<{
    name: string;
    logo_url?: string;
    website?: string;
    tier: 'title' | 'presenting' | 'major' | 'supporting';
  }>;
  rules?: string;
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
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);

      // Fetch tournament details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      // Fetch tournament content
      const { data: contentData, error: contentError } = await supabase
        .from('tournament_content')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (!contentError) {
        setContent(contentData as any);
      }

      // Check if user is registered
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

      // Fetch related tournaments (same format, different tournaments)
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
      case 'completed':
        return 'secondary';
      case 'active':
      case 'in progress':
        return 'default';
      case 'registration open':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'outline';
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
        <Card className="glass-card">
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
      {/* Tournament Header */}
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
            <Badge variant={getStatusColor(tournament.status)} className="text-sm px-3 py-1">
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

        {/* Quick Actions */}
        {(userRegistration || canAccessTournament(tournament.id)) && (
          <div className="space-y-3 mb-6">
            {!userRegistration && canAccessTournament(tournament.id) && (
              <Badge variant="secondary" className="mb-2">
                <Shield className="w-3 h-3 mr-1" />
                Admin View
              </Badge>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild className="justify-start">
                <Link to={`/tournaments/${tournament.id}/my-match`}>
                  <Trophy className="h-4 w-4 mr-2" />
                  {userRegistration ? 'View My Match' : 'All Matches'}
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link to={`/tournaments/${tournament.id}/rounds`}>
                  <Clock className="h-4 w-4 mr-2" />
                  View Rounds
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link to={`/tournaments/${tournament.id}/postings`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Postings & Spectate
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link to={`/tournaments/${tournament.id}/live`}>
                  <Users className="h-4 w-4 mr-2" />
                  Enter Tournament
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="announcements">
            <Megaphone className="h-4 w-4 mr-1 lg:mr-2" />
            <span className="hidden lg:inline">Announcements</span>
          </TabsTrigger>
          <TabsTrigger value="rules">
            <BookOpen className="h-4 w-4 mr-1 lg:mr-2" />
            <span className="hidden lg:inline">Rules</span>
          </TabsTrigger>
          <TabsTrigger value="sponsors">
            <Building className="h-4 w-4 mr-1 lg:mr-2" />
            <span className="hidden lg:inline">Sponsors</span>
          </TabsTrigger>
          {canAccessTournament(tournamentId || '') && (
            <TabsTrigger value="manage">
              <Edit className="h-4 w-4 mr-1 lg:mr-2" />
              <span className="hidden lg:inline">Manage</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="contact">
            <Phone className="h-4 w-4 mr-1 lg:mr-2" />
            <span className="hidden lg:inline">Contact</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass-card">
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
                </CardContent>
              </Card>

              {/* Tournament Calendar */}
              <Card className="glass-card">
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

            <div className="space-y-6">
              <Card className="glass-card">
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
                        <Button asChild>
                          <Link to={`/tournaments/${tournament.id}/register`}>
                            Register Now
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {tournament.registration_fee && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Registration Fee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${tournament.registration_fee}</div>
                    <p className="text-sm text-muted-foreground">Per participant</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Megaphone className="h-5 w-5 mr-2" />
                Tournament Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {content?.announcements && content.announcements.length > 0 ? (
                <div className="space-y-4">
                  {content.announcements.map((announcement) => (
                    <div key={announcement.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <Badge variant={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{announcement.message}</p>
                      <div className="text-xs text-muted-foreground">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No announcements yet. Check back later for updates!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Tournament Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              {content?.rules ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap">{content.rules}</pre>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Tournament rules will be posted here before the event begins.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsors" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Tournament Sponsors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {content?.sponsors && content.sponsors.length > 0 ? (
                <div className="space-y-6">
                  {['title', 'presenting', 'major', 'supporting'].map((tier) => {
                    const tierSponsors = content.sponsors.filter(s => s.tier === tier);
                    if (tierSponsors.length === 0) return null;
                    
                    return (
                      <div key={tier}>
                        <h4 className="font-medium mb-4 capitalize">{tier} Sponsors</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {tierSponsors.map((sponsor, idx) => (
                            <Card key={idx} className="hover:shadow-lg transition-shadow">
                              <CardContent className="p-4">
                                {sponsor.logo_url && (
                                  <img 
                                    src={sponsor.logo_url} 
                                    alt={sponsor.name}
                                    className="h-16 mx-auto mb-2 object-contain"
                                  />
                                )}
                                <h5 className="font-medium text-center">{sponsor.name}</h5>
                                {sponsor.website && (
                                  <Button variant="link" size="sm" asChild className="w-full">
                                    <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                                      Visit Website <ChevronRight className="h-4 w-4 ml-1" />
                                    </a>
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Sponsor information will be available soon.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {profile?.role === 'admin' && (
          <TabsContent value="manage" className="space-y-6">
            <TournamentContentManager 
              tournamentId={tournament.id}
              content={content}
              onContentUpdate={(updatedContent) => {
                setContent(updatedContent);
                toast({
                  title: 'Success',
                  description: 'Tournament content updated successfully',
                });
              }}
            />
          </TabsContent>
        )}

        <TabsContent value="contact" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {content?.contact_info ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap">{content.contact_info}</pre>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    For questions about this tournament, please contact the organizers.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Contact information will be provided closer to the event.</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Related Tournaments */}
      {relatedTournaments.length > 0 && (
        <div className="mt-12">
          <Card className="glass-card">
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
                {relatedTournaments.map((relatedTournament) => (
                  <Card key={relatedTournament.id} className="glass-card hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={relatedTournament.status === 'Registration Open' ? 'default' : 'secondary'}>
                          {relatedTournament.status}
                        </Badge>
                      </div>
                      <h5 className="font-medium mb-2">{relatedTournament.name}</h5>
                      <div className="text-sm text-muted-foreground mb-2">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(relatedTournament.start_date), "MMM d")} - {format(new Date(relatedTournament.end_date), "MMM d, yyyy")}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {relatedTournament.location}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={`/tournaments/${relatedTournament.id}`}>
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
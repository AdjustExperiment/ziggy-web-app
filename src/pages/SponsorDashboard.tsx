import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building, FileText, Trophy, Clock, CheckCircle, XCircle, Crown, Star, Zap, Loader2, Sparkles, ArrowRight } from "lucide-react";
import SponsorBlogManager from "@/components/sponsor/SponsorBlogManager";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface SponsorProfile {
  id: string;
  user_id: string;
  name: string;
  logo_url?: string;
  description?: string;
  website?: string;
  resources: any;
  created_at: string;
  updated_at: string;
  is_approved?: boolean;
  approved_tier?: string | null;
  blog_posts_limit?: number;
  blog_posts_used?: number;
  approved_at?: string;
}

interface SponsorApplication {
  id: string;
  sponsor_profile_id: string;
  tournament_id: string;
  tier: string;
  offerings?: string;
  requests?: string;
  status: string;
  created_at: string;
  updated_at: string;
  tournaments?: {
    name: string;
    status: string;
  };
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  registration_open: boolean;
}

const SponsorDashboard = () => {
  const { user } = useOptimizedAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sponsorProfile, setSponsorProfile] = useState<SponsorProfile | null>(null);
  const [applications, setApplications] = useState<SponsorApplication[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [hasClaimedInvitation, setHasClaimedInvitation] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    description: "",
    website: "",
    logo_url: ""
  });

  const [applicationForm, setApplicationForm] = useState({
    tournament_id: "",
    tier: "",
    offerings: "",
    requests: ""
  });

  const getTierIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'gold':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'silver':
        return <Star className="h-4 w-4 text-gray-400" />;
      case 'bronze':
        return <Trophy className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Fetch sponsor profile
      const { data: profile } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setSponsorProfile(profile);
      
      if (profile) {
        setProfileForm({
          name: profile.name || "",
          description: profile.description || "",
          website: profile.website || "",
          logo_url: profile.logo_url || ""
        });

        // Fetch tournament applications
        const { data: apps } = await supabase
          .from('sponsor_applications')
          .select(`
            *,
            tournaments!inner(name, status)
          `)
          .eq('sponsor_profile_id', profile.id)
          .order('created_at', { ascending: false });

        setApplications(apps || []);
      }

      // Check for claimed invitation
      const { data: invitation } = await supabase
        .from('pending_sponsor_invitations')
        .select('id, organization_name, suggested_tier')
        .eq('claimed_by_user_id', user.id)
        .maybeSingle();
      
      setHasClaimedInvitation(!!invitation);

      // Fetch available tournaments for applications
      const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select('id, name, status, start_date, end_date, registration_open')
        .in('status', ['Planning Phase', 'Registration Open', 'Ongoing'])
        .order('start_date', { ascending: true });

      setTournaments(tournamentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sponsor data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!sponsorProfile) return;

    try {
      const { error } = await supabase
        .from('sponsor_profiles')
        .update({
          name: profileForm.name,
          description: profileForm.description,
          website: profileForm.website,
          logo_url: profileForm.logo_url
        })
        .eq('id', sponsorProfile.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      fetchData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitApplication = async () => {
    if (!sponsorProfile || !applicationForm.tournament_id || !applicationForm.tier) {
      toast({
        title: 'Error',
        description: 'Please select a tournament and sponsorship tier',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('sponsor_applications')
        .insert({
          sponsor_profile_id: sponsorProfile.id,
          tournament_id: applicationForm.tournament_id,
          tier: applicationForm.tier,
          offerings: applicationForm.offerings,
          requests: applicationForm.requests
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Sponsorship application submitted successfully',
      });

      setApplicationForm({
        tournament_id: "",
        tier: "",
        offerings: "",
        requests: ""
      });
      fetchData();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // STATE A: No profile exists - show apply CTA
  if (!sponsorProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <Card className="glass-card max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Become a Sponsor</CardTitle>
              <CardDescription className="text-lg">
                {hasClaimedInvitation 
                  ? "You've claimed your invitation! Complete your application to become a sponsor."
                  : "Apply to become a sponsor and support debate education worldwide."}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-muted-foreground">
                As a sponsor, you'll gain visibility, connect with talented debaters, 
                and contribute to educational excellence.
              </p>
              <Button size="lg" onClick={() => navigate('/sponsor/apply')}>
                Apply to Become a Sponsor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // STATE B: Profile exists but NOT approved - show pending status
  if (!sponsorProfile.is_approved) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <Card className="glass-card max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">Application Under Review</CardTitle>
              <CardDescription className="text-lg">
                Your sponsor application for <strong>{sponsorProfile.name}</strong> is being reviewed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium">Application Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Organization:</span>
                    <p className="font-medium">{sponsorProfile.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>
                    <p className="font-medium">{new Date(sponsorProfile.created_at).toLocaleDateString()}</p>
                  </div>
                  {sponsorProfile.website && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Website:</span>
                      <p className="font-medium">{sponsorProfile.website}</p>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-center text-muted-foreground">
                We typically review applications within 2-3 business days. 
                You'll receive an email once your application has been processed.
              </p>
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => navigate('/')}>
                  Return Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // STATE C: Profile exists and IS approved - show full dashboard
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Sponsor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your sponsorship profile and tournament applications
          </p>
        </div>

        {/* Approval Status Banner */}
        {sponsorProfile.approved_tier && (
          <Alert className="mb-6 border-green-500/30 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="flex items-center gap-2">
              <span>Your sponsorship is approved!</span>
              <Badge className="flex items-center gap-1">
                {getTierIcon(sponsorProfile.approved_tier)}
                <span className="capitalize">{sponsorProfile.approved_tier}</span>
              </Badge>
              <span className="text-muted-foreground ml-2">
                Blog posts: {sponsorProfile.blog_posts_used || 0} / {sponsorProfile.blog_posts_limit || 0} used
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="blog">Blog Posts</TabsTrigger>
            <TabsTrigger value="apply">Apply to Tournament</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Sponsor Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="profile-name">Organization Name</Label>
                  <Input
                    id="profile-name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="profile-description">Description</Label>
                  <Textarea
                    id="profile-description"
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="profile-website">Website</Label>
                  <Input
                    id="profile-website"
                    type="url"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="profile-logo">Logo URL</Label>
                  <Input
                    id="profile-logo"
                    type="url"
                    value={profileForm.logo_url}
                    onChange={(e) => setProfileForm({...profileForm, logo_url: e.target.value})}
                  />
                </div>

                {profileForm.logo_url && (
                  <div className="flex justify-center">
                    <img 
                      src={profileForm.logo_url} 
                      alt="Logo Preview" 
                      className="max-h-24 object-contain"
                    />
                  </div>
                )}

                <Button onClick={handleUpdateProfile} className="w-full">
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Applications</CardTitle>
                <CardDescription>Your sponsorship applications for specific tournaments</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tournament applications yet.</p>
                    <Button variant="link" onClick={() => setActiveTab('apply')}>
                      Apply to a tournament
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div key={app.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{app.tournaments?.name}</h3>
                          <Badge className={getStatusColor(app.status)}>
                            {getStatusIcon(app.status)}
                            <span className="ml-1 capitalize">{app.status}</span>
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Tier:</span> {app.tier.toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium">Applied:</span> {new Date(app.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        {app.offerings && (
                          <div className="mt-2">
                            <span className="font-medium">Offerings:</span>
                            <p className="text-sm text-muted-foreground">{app.offerings}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blog">
            <SponsorBlogManager 
              sponsorProfile={{
                id: sponsorProfile.id,
                blog_posts_limit: sponsorProfile.blog_posts_limit || 0,
                blog_posts_used: sponsorProfile.blog_posts_used || 0,
                is_approved: sponsorProfile.is_approved || false,
                approved_tier: sponsorProfile.approved_tier || null
              }} 
            />
          </TabsContent>

          <TabsContent value="apply">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Apply to Sponsor a Tournament</CardTitle>
                <CardDescription>
                  Select a tournament and tier to submit your sponsorship application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tournament">Select Tournament *</Label>
                  <Select 
                    value={applicationForm.tournament_id} 
                    onValueChange={(val) => setApplicationForm({...applicationForm, tournament_id: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a tournament" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tier">Sponsorship Tier *</Label>
                  <Select 
                    value={applicationForm.tier} 
                    onValueChange={(val) => setApplicationForm({...applicationForm, tier: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze (Supporting)</SelectItem>
                      <SelectItem value="silver">Silver (Major)</SelectItem>
                      <SelectItem value="gold">Gold (Presenting)</SelectItem>
                      <SelectItem value="platinum">Platinum (Title)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="offerings">What You're Offering</Label>
                  <Textarea
                    id="offerings"
                    placeholder="Describe what you can offer (e.g., funding, prizes, resources)"
                    value={applicationForm.offerings}
                    onChange={(e) => setApplicationForm({...applicationForm, offerings: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="requests">Special Requests</Label>
                  <Textarea
                    id="requests"
                    placeholder="Any specific requests or requirements"
                    value={applicationForm.requests}
                    onChange={(e) => setApplicationForm({...applicationForm, requests: e.target.value})}
                  />
                </div>

                <Button onClick={handleSubmitApplication} className="w-full">
                  <Trophy className="h-4 w-4 mr-2" />
                  Submit Application
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default SponsorDashboard;
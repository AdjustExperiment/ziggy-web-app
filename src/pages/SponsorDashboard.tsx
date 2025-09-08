import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building, Upload, FileText, Trophy, Plus, Clock, CheckCircle, XCircle } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [sponsorProfile, setSponsorProfile] = useState<SponsorProfile | null>(null);
  const [applications, setApplications] = useState<SponsorApplication[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTab, setActiveTab] = useState("profile");

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

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch sponsor profile
      const { data: profile } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      setSponsorProfile(profile);
      if (profile) {
        setProfileForm({
          name: profile.name || "",
          description: profile.description || "",
          website: profile.website || "",
          logo_url: profile.logo_url || ""
        });

        // Fetch applications
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

      // Fetch available tournaments
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

  const handleCreateProfile = async () => {
    if (!profileForm.name.trim()) {
      toast({
        title: 'Error',
        description: 'Organization name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .insert({
          user_id: user?.id,
          name: profileForm.name,
          description: profileForm.description,
          website: profileForm.website,
          logo_url: profileForm.logo_url,
          resources: []
        })
        .select()
        .single();

      if (error) throw error;

      setSponsorProfile(data);
      toast({
        title: 'Success',
        description: 'Sponsor profile created successfully',
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to create sponsor profile',
        variant: 'destructive',
      });
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
    } catch (error) {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Sponsor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your sponsorship profile and tournament applications
          </p>
        </div>

        {!sponsorProfile ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Create Sponsor Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="org-name">Organization Name *</Label>
                <Input
                  id="org-name"
                  placeholder="Your organization name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your organization"
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  type="url"
                  placeholder="https://yourlogo.com/logo.png"
                  value={profileForm.logo_url}
                  onChange={(e) => setProfileForm({...profileForm, logo_url: e.target.value})}
                />
              </div>

              <Button onClick={handleCreateProfile} className="w-full">
                <Building className="h-4 w-4 mr-2" />
                Create Sponsor Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="apply">Apply for Sponsorship</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
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
                  <CardTitle>Your Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <p className="text-muted-foreground">No applications yet.</p>
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
                          {app.requests && (
                            <div className="mt-2">
                              <span className="font-medium">Requests:</span>
                              <p className="text-sm text-muted-foreground">{app.requests}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="apply">
              <Card>
                <CardHeader>
                  <CardTitle>Apply for Tournament Sponsorship</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="tournament-select">Select Tournament</Label>
                    <Select 
                      value={applicationForm.tournament_id} 
                      onValueChange={(value) => setApplicationForm({...applicationForm, tournament_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a tournament" />
                      </SelectTrigger>
                      <SelectContent>
                        {tournaments.map((tournament) => (
                          <SelectItem key={tournament.id} value={tournament.id}>
                            {tournament.name} ({tournament.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tier-select">Sponsorship Tier</Label>
                    <Select 
                      value={applicationForm.tier} 
                      onValueChange={(value) => setApplicationForm({...applicationForm, tier: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose sponsorship tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="platinum">Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="offerings">What can you offer?</Label>
                    <Textarea
                      id="offerings"
                      placeholder="Describe what you're willing to sponsor (prizes, services, etc.)"
                      value={applicationForm.offerings}
                      onChange={(e) => setApplicationForm({...applicationForm, offerings: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="requests">What are you looking for?</Label>
                    <Textarea
                      id="requests"
                      placeholder="What would you like in return? (blog post, email promotion, webinar, etc.)"
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
        )}
      </div>
    </div>
  );
};

export default SponsorDashboard;
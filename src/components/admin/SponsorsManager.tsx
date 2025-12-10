import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building, CheckCircle, XCircle, Clock, Edit, Eye, ExternalLink } from "lucide-react";
import { approveSponsorApplication, rejectSponsorApplication, updateSponsorApplication } from "@/utils/adminActions";
import { useAuth } from "@/hooks/useAuth";
import SponsorTierManager from "./SponsorTierManager";
import SponsorInvitationManager from "./SponsorInvitationManager";

interface SponsorProfile {
  id: string;
  user_id: string;
  name: string;
  logo_url?: string;
  description?: string;
  website?: string;
  resources: any;
  is_platform_partner?: boolean;
  partnership_notes?: string;
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
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  sponsor_profiles: SponsorProfile;
  tournaments: {
    name: string;
    status: string;
  };
}

const SponsorsManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<SponsorProfile[]>([]);
  const [applications, setApplications] = useState<SponsorApplication[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<SponsorProfile | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<SponsorApplication | null>(null);
  const [activeTab, setActiveTab] = useState("applications");

  // Edit forms
  const [editingProfile, setEditingProfile] = useState<SponsorProfile | null>(null);
  const [editingApplication, setEditingApplication] = useState<SponsorApplication | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    tier: "",
    offerings: "",
    requests: ""
  });
  const [profileForm, setProfileForm] = useState({
    name: "",
    description: "",
    website: "",
    logo_url: "",
    is_platform_partner: false,
    partnership_notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all sponsor profiles
      const { data: profilesData } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      setProfiles(profilesData || []);

      // Fetch all applications with related data
      const { data: applicationsData } = await supabase
        .from('sponsor_applications')
        .select(`
          *,
          sponsor_profiles(*),
          tournaments!inner(name, status)
        `)
        .order('created_at', { ascending: false });

      setApplications(applicationsData || []);
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

  const handleApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    if (!user?.id) return;

    try {
      if (status === 'approved') {
        await approveSponsorApplication(applicationId, user.id);
      } else {
        await rejectSponsorApplication(applicationId, user.id);
      }

      toast({
        title: 'Success',
        description: `Application ${status} successfully`,
      });

      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update application',
        variant: 'destructive',
      });
    }
  };

  const handleEditApplication = async () => {
    if (!editingApplication || !user?.id) return;

    try {
      await updateSponsorApplication(editingApplication.id, {
        tier: applicationForm.tier,
        offerings: applicationForm.offerings,
        requests: applicationForm.requests
      }, user.id);

      toast({
        title: 'Success',
        description: 'Application updated successfully',
      });

      setEditingApplication(null);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update application',
        variant: 'destructive',
      });
    }
  };

  const startEditingApplication = (application: SponsorApplication) => {
    setEditingApplication(application);
    setApplicationForm({
      tier: application.tier,
      offerings: application.offerings || "",
      requests: application.requests || ""
    });
  };

  const handleEditProfile = async () => {
    if (!editingProfile) return;

    try {
      const { error } = await supabase
        .from('sponsor_profiles')
        .update({
          name: profileForm.name,
          description: profileForm.description,
          website: profileForm.website,
          logo_url: profileForm.logo_url,
          is_platform_partner: profileForm.is_platform_partner,
          partnership_notes: profileForm.partnership_notes
        })
        .eq('id', editingProfile.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      setEditingProfile(null);
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

  const startEditingProfile = (profile: SponsorProfile) => {
    setEditingProfile(profile);
    setProfileForm({
      name: profile.name,
      description: profile.description || "",
      website: profile.website || "",
      logo_url: profile.logo_url || "",
      is_platform_partner: profile.is_platform_partner || false,
      partnership_notes: profile.partnership_notes || ""
    });
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sponsors Manager</h2>
        <p className="text-muted-foreground">
          Manage sponsor profiles and applications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="tiers">Tier Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="invitations">
          <SponsorInvitationManager />
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Sponsor Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-muted-foreground">No applications yet.</p>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {app.sponsor_profiles.logo_url && (
                            <img 
                              src={app.sponsor_profiles.logo_url} 
                              alt="Logo" 
                              className="h-8 w-8 object-contain"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold">{app.sponsor_profiles.name}</h3>
                            <p className="text-sm text-muted-foreground">{app.tournaments.name}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(app.status)}>
                          {getStatusIcon(app.status)}
                          <span className="ml-1 capitalize">{app.status}</span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium">Tier:</span> {app.tier.toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium">Applied:</span> {new Date(app.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {app.offerings && (
                        <div className="mb-3">
                          <span className="font-medium">Offerings:</span>
                          <p className="text-sm text-muted-foreground">{app.offerings}</p>
                        </div>
                      )}

                      {app.requests && (
                        <div className="mb-3">
                          <span className="font-medium">Requests:</span>
                          <p className="text-sm text-muted-foreground">{app.requests}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {app.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleApplicationStatus(app.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleApplicationStatus(app.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => startEditingApplication(app)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>

                      {app.approved_at && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Approved:</span> {new Date(app.approved_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles">
          <Card>
            <CardHeader>
              <CardTitle>Sponsor Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              {profiles.length === 0 ? (
                <p className="text-muted-foreground">No sponsor profiles yet.</p>
              ) : (
                <div className="space-y-4">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {profile.logo_url ? (
                            <img 
                              src={profile.logo_url} 
                              alt="Logo" 
                              className="h-12 w-12 object-contain"
                            />
                          ) : (
                            <Building className="h-12 w-12 text-muted-foreground" />
                          )}
                          <div>
                            <h3 className="font-semibold">{profile.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(profile.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {profile.website && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(profile.website, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{profile.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {profile.logo_url && (
                                  <div className="flex justify-center">
                                    <img 
                                      src={profile.logo_url} 
                                      alt="Logo" 
                                      className="max-h-24 object-contain"
                                    />
                                  </div>
                                )}
                                {profile.description && (
                                  <div>
                                    <Label>Description</Label>
                                    <p className="text-sm">{profile.description}</p>
                                  </div>
                                )}
                                {profile.website && (
                                  <div>
                                    <Label>Website</Label>
                                    <p className="text-sm">
                                      <a 
                                        href={profile.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline"
                                      >
                                        {profile.website}
                                      </a>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEditingProfile(profile)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {profile.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {profile.description.length > 100 
                            ? `${profile.description.substring(0, 100)}...`
                            : profile.description
                          }
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers">
          <SponsorTierManager />
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sponsor Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Organization Name</Label>
              <Input
                id="edit-name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={profileForm.description}
                onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                type="url"
                value={profileForm.website}
                onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-logo">Logo URL</Label>
              <Input
                id="edit-logo"
                type="url"
                value={profileForm.logo_url}
                onChange={(e) => setProfileForm({...profileForm, logo_url: e.target.value})}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="edit-platform-partner"
                type="checkbox"
                checked={profileForm.is_platform_partner}
                onChange={(e) => setProfileForm({...profileForm, is_platform_partner: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-platform-partner">Platform Partner</Label>
            </div>

            {profileForm.is_platform_partner && (
              <div>
                <Label htmlFor="edit-partnership-notes">Partnership Notes</Label>
                <Textarea
                  id="edit-partnership-notes"
                  value={profileForm.partnership_notes}
                  onChange={(e) => setProfileForm({...profileForm, partnership_notes: e.target.value})}
                  placeholder="Additional information about the partnership..."
                />
              </div>
            )}

            {profileForm.logo_url && (
              <div className="flex justify-center">
                <img 
                  src={profileForm.logo_url} 
                  alt="Logo Preview" 
                  className="max-h-24 object-contain"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleEditProfile} className="flex-1">
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingProfile(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Application Dialog */}
      <Dialog open={!!editingApplication} onOpenChange={() => setEditingApplication(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sponsor Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-app-tier">Sponsorship Tier</Label>
              <Select value={applicationForm.tier} onValueChange={(value) => setApplicationForm({...applicationForm, tier: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
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
              <Label htmlFor="edit-app-offerings">Offerings</Label>
              <Textarea
                id="edit-app-offerings"
                placeholder="What can you offer to the tournament?"
                value={applicationForm.offerings}
                onChange={(e) => setApplicationForm({...applicationForm, offerings: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-app-requests">Requests</Label>
              <Textarea
                id="edit-app-requests"
                placeholder="What do you need from the tournament?"
                value={applicationForm.requests}
                onChange={(e) => setApplicationForm({...applicationForm, requests: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingApplication(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditApplication}>
                Update Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SponsorsManager;
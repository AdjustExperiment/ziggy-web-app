
import { useState, useEffect } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileSetup } from '@/components/auth/ProfileSetup';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CreditCard, MapPin, Clock, User, Phone, Mail, Shield, Gavel, Settings, Plus, Edit2 } from 'lucide-react';
import { JudgePromptBanner } from '@/components/JudgePromptBanner';
import { JudgeProfileEditor } from '@/components/JudgeProfileEditor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Registration {
  id: string;
  tournament_name: string;
  participant_name: string;
  partner_name?: string;
  payment_status: string;
  amount_paid?: number;
  registration_date: string;
  tournament: {
    name: string;
    start_date: string;
    end_date: string;
    location: string;
    status: string;
  };
}

export default function UserAccount() {
  const { user, profile, loading } = useOptimizedAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasJudgeProfile, setHasJudgeProfile] = useState(false);
  const [judgeProfile, setJudgeProfile] = useState<any>(null);
  const [emailChanging, setEmailChanging] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && !loading) {
      fetchRegistrations();
      checkJudgeProfile();
    }
  }, [user, loading]);

  const fetchRegistrations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          id,
          participant_name,
          partner_name,
          payment_status,
          amount_paid,
          registration_date,
          tournaments!inner (
            name,
            start_date,
            end_date,
            location,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('registration_date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map((reg: any) => ({
        id: reg.id,
        tournament_name: reg.tournaments.name,
        participant_name: reg.participant_name,
        partner_name: reg.partner_name,
        payment_status: reg.payment_status,
        amount_paid: reg.amount_paid,
        registration_date: reg.registration_date,
        tournament: {
          name: reg.tournaments.name,
          start_date: reg.tournaments.start_date,
          end_date: reg.tournaments.end_date,
          location: reg.tournaments.location,
          status: reg.tournaments.status
        }
      })) || [];

      setRegistrations(transformedData);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your registrations.',
        variant: 'destructive',
      });
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const checkJudgeProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('judge_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setHasJudgeProfile(!!data);
      setJudgeProfile(data);
    } catch (error) {
      console.error('Error checking judge profile:', error);
    }
  };

  const refreshJudgeProfile = () => {
    checkJudgeProfile();
  };

  const handleEmailChange = async () => {
    if (!newEmail) return;
    setEmailChanging(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      
      toast({
        title: 'Email Update Requested',
        description: 'Please check both your old and new email addresses for confirmation links.',
      });
      setNewEmail('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update email',
        variant: 'destructive',
      });
    } finally {
      setEmailChanging(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    setPasswordChanging(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully updated.',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleCreateJudgeProfile = () => {
    // Navigate to judge dashboard where profile can be created
    window.location.href = '/judge';
  };

  const isProfileComplete = profile?.first_name && profile?.last_name && profile?.state && profile?.time_zone && profile?.phone;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to view your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Account Settings</h1>
            {!isProfileComplete && (
              <Button onClick={() => setShowProfileSetup(true)}>
                Complete Profile
              </Button>
            )}
          </div>

          {/* Judge Profile Prompt */}
          <JudgePromptBanner onCreateProfile={handleCreateJudgeProfile} />

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="judge">Judge Account</TabsTrigger>
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">

            {/* Profile Information */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isProfileComplete ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Please complete your profile to register for tournaments.
                  </p>
                  <Button onClick={() => setShowProfileSetup(true)}>
                    Complete Profile Setup
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {profile?.first_name} {profile?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {profile?.state}
                      {profile?.region && `, ${profile.region}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.time_zone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.phone}</span>
                  </div>
                </div>
              )}
              
              {isProfileComplete && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowProfileSetup(true)}
                  >
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                {/* Email Change */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Change Email Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-email">Current Email</Label>
                      <Input
                        id="current-email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-email">New Email Address</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email address"
                      />
                    </div>
                    <Button onClick={handleEmailChange} disabled={emailChanging || !newEmail}>
                      {emailChanging ? 'Updating...' : 'Update Email'}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      You'll receive confirmation emails at both addresses.
                    </p>
                  </CardContent>
                </Card>

                {/* Password Change */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                    <Button 
                      onClick={handlePasswordChange} 
                      disabled={passwordChanging || !newPassword || !confirmPassword}
                    >
                      {passwordChanging ? 'Updating...' : 'Update Password'}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Password must be at least 6 characters long.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="judge">
              {hasJudgeProfile && judgeProfile ? (
                <JudgeProfileEditor 
                  judgeProfile={judgeProfile} 
                  onUpdate={refreshJudgeProfile} 
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gavel className="h-5 w-5" />
                      Judge Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        You don't currently have a judge profile. Creating one allows you to:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                        <li>Judge debates and help the community</li>
                        <li>Earn judge fees and recognition</li>
                        <li>Set your availability and preferences</li>
                        <li>Receive judge assignments for tournaments</li>
                      </ul>
                      <Button onClick={handleCreateJudgeProfile}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Judge Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tournaments">
              {/* Tournament Registrations */}
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                My Tournament Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRegistrations ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading registrations...</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    You haven't registered for any tournaments yet.
                  </p>
                  <Button onClick={() => window.location.href = '/tournaments'}>
                    Browse Tournaments
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{registration.tournament.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {registration.participant_name}
                            {registration.partner_name && ` & ${registration.partner_name}`}
                          </p>
                        </div>
                        <Badge
                          variant={
                            registration.payment_status === 'paid'
                              ? 'default'
                              : registration.payment_status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {registration.payment_status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(registration.tournament.start_date).toLocaleDateString()} - {' '}
                            {new Date(registration.tournament.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{registration.tournament.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {registration.amount_paid 
                              ? `$${registration.amount_paid}` 
                              : 'Amount TBD'
                            }
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">
                          Registered: {new Date(registration.registration_date).toLocaleDateString()}
                        </span>
                        <Badge variant="outline">
                          {registration.tournament.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            </Card>
            </TabsContent>
          </Tabs>

          {/* Profile Setup Modal */}
          {showProfileSetup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Profile Setup</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProfileSetup(false)}
                    >
                      ×
                    </Button>
                  </div>
                  <ProfileSetup
                    isModal={true}
                    onComplete={() => {
                      setShowProfileSetup(false);
                      window.location.reload();
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gavel, Calendar, Bell, Users, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { MyJudgings } from '@/components/MyJudgings';
import JudgeAvailability from '@/components/JudgeAvailability';
import WeeklyAvailabilityTab from '@/components/WeeklyAvailabilityTab';
import JudgeNotifications from '@/components/JudgeNotifications';

interface JudgeProfile {
  id: string;
  name: string;
  email: string;
  experience_level: string;
  qualifications: string;
  bio: string;
  availability?: any;
}

interface JudgeStats {
  totalAssignments: number;
  completedBallots: number;
  pendingBallots: number;
  upcomingMatches: number;
}

export default function JudgeDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [judgeProfile, setJudgeProfile] = useState<JudgeProfile | null>(null);
  const [stats, setStats] = useState<JudgeStats>({
    totalAssignments: 0,
    completedBallots: 0,
    pendingBallots: 0,
    upcomingMatches: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchJudgeProfile();
      fetchJudgeStats();
    }
  }, [user]);

  const fetchJudgeProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('judge_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setJudgeProfile(data);
    } catch (error) {
      console.error('Error fetching judge profile:', error);
    }
  };

  const fetchJudgeStats = async () => {
    if (!judgeProfile?.id) return;

    try {
      // Get total assignments
        const { data: pairings, error: pairingsError } = await supabase
          .from('pairings')
          .select(`
            id,
            status,
            scheduled_time,
            ballots!inner (id, status)
          `)
          .eq('judge_id', judgeProfile.id);

      if (pairingsError) throw pairingsError;

        const totalAssignments = pairings?.length || 0;
        const completedBallots = pairings?.filter(p => 
          Array.isArray(p.ballots) && p.ballots.some((b: any) => b.status === 'submitted')
        ).length || 0;
      const pendingBallots = totalAssignments - completedBallots;
      const upcomingMatches = pairings?.filter(p => 
        p.scheduled_time && new Date(p.scheduled_time) > new Date()
      ).length || 0;

      setStats({
        totalAssignments,
        completedBallots,
        pendingBallots,
        upcomingMatches
      });
    } catch (error) {
      console.error('Error fetching judge stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const createJudgeProfile = async () => {
    try {
      const { error } = await supabase
        .from('judge_profiles')
        .insert({
          user_id: user?.id,
          name: 'New Judge',
          email: user?.email || '',
          experience_level: 'novice',
          qualifications: '',
          bio: ''
        });

      if (error) throw error;

      toast({
        title: 'Profile Created',
        description: 'Your judge profile has been created. Please update your information.',
      });

      fetchJudgeProfile();
    } catch (error) {
      console.error('Error creating judge profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to create judge profile',
        variant: 'destructive',
      });
    }
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

  if (!judgeProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-6 w-6" />
              Judge Portal
            </CardTitle>
            <CardDescription>
              You don't have a judge profile yet. Create one to start judging tournaments.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Gavel className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Judge Profile</h3>
            <p className="text-muted-foreground mb-6">
              Create a judge profile to receive judging assignments and manage your availability.
            </p>
            <Button onClick={createJudgeProfile}>
              Create Judge Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Judge Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your judging assignments, availability, and tournament communications.
        </p>
      </div>

      {/* Judge Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assignments</p>
                <p className="text-2xl font-bold">{stats.totalAssignments}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Ballots</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedBallots}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Ballots</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingBallots}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Matches</p>
                <p className="text-2xl font-bold">{stats.upcomingMatches}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Judge Profile Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Judge Profile
            </span>
            <Badge variant="outline">
              {judgeProfile.experience_level.charAt(0).toUpperCase() + judgeProfile.experience_level.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Contact Information</h4>
              <p className="text-sm text-muted-foreground">Name: {judgeProfile.name}</p>
              <p className="text-sm text-muted-foreground">Email: {judgeProfile.email}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Experience Level</h4>
              <p className="text-sm text-muted-foreground">
                {judgeProfile.experience_level.charAt(0).toUpperCase() + judgeProfile.experience_level.slice(1)} Judge
              </p>
            </div>
            {judgeProfile.qualifications && (
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">Qualifications</h4>
                <p className="text-sm text-muted-foreground">{judgeProfile.qualifications}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Weekly Schedule
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <MyJudgings />
        </TabsContent>

        <TabsContent value="availability">
          <JudgeAvailability judgeProfileId={judgeProfile.id} />
        </TabsContent>

        <TabsContent value="weekly">
          <WeeklyAvailabilityTab judgeProfile={judgeProfile} onUpdate={fetchJudgeProfile} />
        </TabsContent>

        <TabsContent value="notifications">
          <JudgeNotifications judgeProfileId={judgeProfile.id} />
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Management</CardTitle>
              <CardDescription>
                View and update your judge profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {judgeProfile.name}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {judgeProfile.email}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Experience Level</h4>
                  <Badge variant="outline" className="capitalize">
                    {judgeProfile.experience_level}
                  </Badge>
                </div>

                {judgeProfile.qualifications && (
                  <div>
                    <h4 className="font-medium mb-2">Qualifications</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {judgeProfile.qualifications}
                    </p>
                  </div>
                )}

                {judgeProfile.bio && (
                  <div>
                    <h4 className="font-medium mb-2">Biography</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {judgeProfile.bio}
                    </p>
                  </div>
                )}

                <div className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    To update your profile information, please contact the tournament administrators.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
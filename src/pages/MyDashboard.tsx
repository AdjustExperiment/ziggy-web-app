import React, { useEffect, useState } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, Trophy, Users, BarChart3, FileText, 
  ExternalLink, Calendar, MessageSquare, Gavel,
  TrendingUp, Award, Target
} from 'lucide-react';
import MyTournaments from './MyTournaments';
import { MyPairings } from '@/components/MyPairings';
import { MyJudgings } from '@/components/MyJudgings';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalTournaments: number;
  activePairings: number;
  completedJudgings: number;
  winRate: number;
  averageSpeakerPoints: number;
}

export default function MyDashboard() {
  const { user } = useOptimizedAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTournaments: 0,
    activePairings: 0,
    completedJudgings: 0,
    winRate: 0,
    averageSpeakerPoints: 0
  });
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [ballots, setBallots] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch registrations
      const { data: regData } = await supabase
        .from('tournament_registrations')
        .select('*, tournaments(name, status, start_date, end_date)')
        .eq('user_id', user?.id);

      // Fetch pairings
      const { data: pairingData } = await supabase
        .from('pairings')
        .select('*, tournaments(name), ballots(*)')
        .or(`aff_registration_id.in.(${regData?.map(r => r.id).join(',')}),neg_registration_id.in.(${regData?.map(r => r.id).join(',')})`)
        .limit(50);

      // Fetch published ballots for user's results
      const { data: ballotData } = await supabase
        .from('ballots')
        .select('*, pairings(*, tournaments(name))')
        .eq('is_published', true)
        .in('pairing_id', pairingData?.map(p => p.id) || []);

      setRegistrations(regData || []);
      setBallots(ballotData || []);

      // Calculate stats
      const totalTournaments = regData?.length || 0;
      const activePairings = pairingData?.filter(p => {
        const ballotsArray = Array.isArray(p.ballots) ? p.ballots : [];
        return ballotsArray.length === 0;
      }).length || 0;
      const completedJudgings = ballotData?.length || 0;
      
      // Calculate win rate from published ballots
      const wins = ballotData?.filter(ballot => {
        const pairing = ballot.pairings;
        const winner = (ballot.payload as any)?.winner;
        if (!winner || !pairing) return false;
        
        const userRegistration = regData?.find(r => 
          r.id === pairing.aff_registration_id || r.id === pairing.neg_registration_id
        );
        
        if (!userRegistration) return false;
        
        return (winner === 'aff' && userRegistration.id === pairing.aff_registration_id) ||
               (winner === 'neg' && userRegistration.id === pairing.neg_registration_id);
      }).length || 0;

      const winRate = completedJudgings > 0 ? Math.round((wins / completedJudgings) * 100) : 0;

      // Calculate average speaker points
      const speakerPoints = ballotData?.map(ballot => {
        const pairing = ballot.pairings;
        const userRegistration = regData?.find(r => 
          r.id === pairing?.aff_registration_id || r.id === pairing?.neg_registration_id
        );
        
        if (!userRegistration || !pairing) return 0;
        
        return userRegistration.id === pairing.aff_registration_id 
          ? (ballot.payload as any)?.aff_points || 0
          : (ballot.payload as any)?.neg_points || 0;
      }).filter(points => points > 0) || [];

      const averageSpeakerPoints = speakerPoints.length > 0 
        ? Math.round(speakerPoints.reduce((a, b) => a + b, 0) / speakerPoints.length * 10) / 10
        : 0;

      setStats({
        totalTournaments,
        activePairings,
        completedJudgings,
        winRate,
        averageSpeakerPoints
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { name: 'Browse Tournaments', href: '/tournaments', icon: Trophy },
    { name: 'Tournament Results', href: '/results', icon: BarChart3 },
    { name: 'About Debate', href: '/learn-about-debate', icon: FileText },
    { name: 'Community Rules', href: '/rules', icon: Users },
    { name: 'FAQ & Help', href: '/faq', icon: MessageSquare },
    { name: 'Contact Support', href: '/contact', icon: ExternalLink },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Home className="h-8 w-8" />
            My Dashboard
          </h1>
          <p className="text-muted-foreground">Your debate activity and performance overview</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTournaments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Pairings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePairings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Rounds</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJudgings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Speaker Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageSpeakerPoints}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Quick Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.name} to={link.href}>
                <Button 
                  variant="outline" 
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-muted"
                >
                  <link.icon className="h-5 w-5" />
                  <span className="text-xs text-center">{link.name}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tournaments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="pairings">Pairings</TabsTrigger>
          <TabsTrigger value="judgings">Judgings</TabsTrigger>
          <TabsTrigger value="results">Results (Beta)</TabsTrigger>
          <TabsTrigger value="ballots">Ballots (Beta)</TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments">
          <MyTournaments />
        </TabsContent>

        <TabsContent value="pairings">
          <MyPairings />
        </TabsContent>

        <TabsContent value="judgings">
          <MyJudgings />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                My Results & Analytics (Beta)
                <Badge variant="secondary">Coming Soon</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Detailed performance analytics will be available here, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Win/loss record by tournament and opponent</li>
                  <li>Speaker point trends and improvements</li>
                  <li>Most common feedback themes from judges</li>
                  <li>Performance by debate format and topic area</li>
                  <li>Head-to-head records against specific opponents</li>
                  <li>Tournament placement history and rankings</li>
                </ul>
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Current Stats:</strong> Based on {stats.completedJudgings} completed rounds
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>Win Rate: {stats.winRate}%</div>
                    <div>Avg. Speaker Points: {stats.averageSpeakerPoints}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ballots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Ballots (Beta)
                <Badge variant="secondary">Coming Soon</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Access all your published ballots and feedback from judges:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>View detailed judge feedback and comments</li>
                  <li>Track speaker points and rankings across rounds</li>
                  <li>Export ballot data for personal analysis</li>
                  <li>Compare performance across different judges</li>
                  <li>Identify areas for improvement based on feedback patterns</li>
                </ul>
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Available Ballots:</strong> {ballots.length} published ballots ready for review
                  </p>
                  {ballots.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        Recent tournaments: {ballots.slice(0, 3).map(b => b.pairings?.tournaments?.name).filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
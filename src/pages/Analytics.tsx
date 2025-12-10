import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, Trophy, Target, BarChart3, Calendar, Download, Loader2, Gavel, Eye, Building } from "lucide-react";
import { SectionFX } from "@/components/SectionFX";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStats {
  totalTournaments: number;
  activeTournaments: number;
  totalRegistrations: number;
  totalJudges: number;
  totalRounds: number;
  completedRounds: number;
}

interface MonthlyData {
  month: string;
  tournaments: number;
  registrations: number;
  rounds: number;
}

interface FormatData {
  name: string;
  value: number;
  color: string;
}

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats>({
    totalTournaments: 0,
    activeTournaments: 0,
    totalRegistrations: 0,
    totalJudges: 0,
    totalRounds: 0,
    completedRounds: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [formatData, setFormatData] = useState<FormatData[]>([]);
  const [userRoleData, setUserRoleData] = useState<{ role: string; count: number }[]>([]);
  const [timePeriod, setTimePeriod] = useState("90d");

  useEffect(() => {
    fetchAnalytics();
  }, [timePeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all stats in parallel
      const [
        { count: tournamentsCount },
        { count: activeTournamentsCount },
        { count: registrationsCount },
        { count: judgesCount },
        { count: roundsCount },
        { count: completedRoundsCount },
        { data: tournaments },
        { data: registrations },
        { data: userRoles },
      ] = await Promise.all([
        supabase.from('tournaments').select('*', { count: 'exact', head: true }),
        supabase.from('tournaments').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('tournament_registrations').select('*', { count: 'exact', head: true }),
        supabase.from('judge_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('rounds').select('*', { count: 'exact', head: true }),
        supabase.from('rounds').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('tournaments').select('format, created_at').order('created_at', { ascending: false }),
        supabase.from('tournament_registrations').select('created_at').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('role'),
      ]);

      setStats({
        totalTournaments: tournamentsCount || 0,
        activeTournaments: activeTournamentsCount || 0,
        totalRegistrations: registrationsCount || 0,
        totalJudges: judgesCount || 0,
        totalRounds: roundsCount || 0,
        completedRounds: completedRoundsCount || 0,
      });

      // Process format distribution
      const formatCounts: Record<string, number> = {};
      tournaments?.forEach(t => {
        const format = t.format || 'Unknown';
        formatCounts[format] = (formatCounts[format] || 0) + 1;
      });

      const colors = [
        'hsl(var(--primary))',
        'hsl(var(--primary-glow))',
        'hsl(var(--accent))',
        'hsl(var(--muted))',
        'hsl(var(--secondary))',
      ];

      setFormatData(
        Object.entries(formatCounts).map(([name, value], idx) => ({
          name,
          value,
          color: colors[idx % colors.length],
        }))
      );

      // Process monthly data (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const monthlyStats: MonthlyData[] = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = months[date.getMonth()];
        
        const tournamentsInMonth = tournaments?.filter(t => {
          const created = new Date(t.created_at);
          return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
        }).length || 0;

        const registrationsInMonth = registrations?.filter(r => {
          const created = new Date(r.created_at);
          return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
        }).length || 0;

        monthlyStats.push({
          month: monthName,
          tournaments: tournamentsInMonth,
          registrations: registrationsInMonth,
          rounds: Math.floor(tournamentsInMonth * 4), // Estimate
        });
      }

      setMonthlyData(monthlyStats);

      // Process user roles
      const roleCounts: Record<string, number> = {};
      userRoles?.forEach(ur => {
        roleCounts[ur.role] = (roleCounts[ur.role] || 0) + 1;
      });

      setUserRoleData(
        Object.entries(roleCounts).map(([role, count]) => ({ role, count }))
      );

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      stats,
      monthlyData,
      formatData,
      userRoleData,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ziggy-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <SectionFX variant="default" intensity="low" />
      
      {/* Header */}
      <section className="relative bg-gradient-hero py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4 font-primary">
                Platform Analytics
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl">
                Real-time insights into tournament activity, user engagement, and platform performance.
              </p>
            </div>
            <div className="flex gap-4">
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-40 bg-card border-border text-card-foreground">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="7d" className="text-card-foreground hover:bg-accent">Last 7 days</SelectItem>
                  <SelectItem value="30d" className="text-card-foreground hover:bg-accent">Last 30 days</SelectItem>
                  <SelectItem value="90d" className="text-card-foreground hover:bg-accent">Last 90 days</SelectItem>
                  <SelectItem value="1y" className="text-card-foreground hover:bg-accent">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportData} className="border-border text-foreground hover:bg-accent">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="relative py-8 border-b border-border">
        <SectionFX variant="muted" intensity="low" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tournaments</CardTitle>
                <Trophy className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{stats.totalTournaments}</div>
                <div className="flex items-center text-sm">
                  <Badge variant="outline" className="text-green-500 border-green-500/20">
                    {stats.activeTournaments} active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Registrations</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{stats.totalRegistrations}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  Across all tournaments
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Judges</CardTitle>
                <Gavel className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{stats.totalJudges}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  Registered judge profiles
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rounds</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{stats.totalRounds}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-500">{stats.completedRounds}</span>
                  <span className="text-muted-foreground ml-1">completed</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="relative py-12">
        <SectionFX variant="accent" intensity="low" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Activity Trend */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-card-foreground font-primary">Platform Activity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--card-foreground))'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="tournaments" stroke="hsl(var(--primary))" strokeWidth={3} name="Tournaments" />
                    <Line type="monotone" dataKey="registrations" stroke="hsl(var(--accent))" strokeWidth={3} name="Registrations" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Format Distribution */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-card-foreground font-primary">Tournament Format Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {formatData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--card-foreground))'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No tournament format data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Roles Distribution */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-card-foreground font-primary">User Roles Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {userRoleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userRoleData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="role" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--card-foreground))'
                        }} 
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Users" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No user role data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Registrations */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-card-foreground font-primary">Monthly Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--card-foreground))'
                      }} 
                    />
                    <Bar dataKey="registrations" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Health Summary */}
      <section className="relative py-12 border-t border-border">
        <SectionFX variant="hero" intensity="low" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-2xl font-bold text-foreground mb-8 font-primary">Platform Health</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <Badge className="w-fit bg-green-500/10 text-green-500 border-green-500/20">
                  Active
                </Badge>
                <CardTitle className="text-lg text-card-foreground">Tournament Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {stats.activeTournaments} tournaments are currently active with {stats.totalRegistrations} total registrations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <Badge className="w-fit bg-blue-500/10 text-blue-500 border-blue-500/20">
                  Judges
                </Badge>
                <CardTitle className="text-lg text-card-foreground">Judge Pool</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {stats.totalJudges} registered judges available to officiate tournament rounds.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <Badge className="w-fit bg-purple-500/10 text-purple-500 border-purple-500/20">
                  Rounds
                </Badge>
                <CardTitle className="text-lg text-card-foreground">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {stats.totalRounds > 0 
                    ? `${((stats.completedRounds / stats.totalRounds) * 100).toFixed(1)}% of rounds completed`
                    : 'No rounds created yet'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Analytics;

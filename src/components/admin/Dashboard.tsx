import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from '@/components/KPICard';
import { Users, Trophy, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalUsers: number;
  activeTournaments: number;
  monthlyRevenue: number;
  upcomingEvents: number;
  recentActivity: { message: string; time: string }[];
}

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeTournaments: 0,
    monthlyRevenue: 0,
    upcomingEvents: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active tournaments
      const { count: activeTournaments } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Registration Open', 'Ongoing']);

      // Fetch upcoming tournaments (as events)
      const { count: upcomingEvents } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .gte('start_date', new Date().toISOString().split('T')[0]);

      // Fetch monthly revenue from payment transactions
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: payments } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      const monthlyRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Fetch recent activity (registrations, new users, judge applications)
      const { data: recentRegistrations } = await supabase
        .from('tournament_registrations')
        .select('participant_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      const recentActivity = (recentRegistrations || []).map(r => ({
        message: `New registration: ${r.participant_name}`,
        time: getTimeAgo(new Date(r.created_at))
      }));

      setStats({
        totalUsers: userCount || 0,
        activeTournaments: activeTournaments || 0,
        monthlyRevenue: monthlyRevenue / 100, // Convert cents to dollars
        upcomingEvents: upcomingEvents || 0,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of tournament management and system metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Total Users" 
          value={stats.totalUsers.toLocaleString()} 
          change="" 
          trend="up"
          icon={<Users className="h-4 w-4" />}
        />
        <KPICard 
          title="Active Tournaments" 
          value={stats.activeTournaments.toString()} 
          change="" 
          trend="up"
          icon={<Trophy className="h-4 w-4" />}
        />
        <KPICard 
          title="Monthly Revenue" 
          value={`$${stats.monthlyRevenue.toLocaleString()}`} 
          change="" 
          trend="up"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPICard 
          title="Upcoming Events" 
          value={stats.upcomingEvents.toString()} 
          change="" 
          trend="up"
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest tournament registrations and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                stats.recentActivity.map((activity, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span>{activity.message}</span>
                    <span className="text-muted-foreground">{activity.time}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Database</span>
                <span className="text-green-600">Healthy</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Payment Processing</span>
                <span className="text-green-600">Operational</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Email Service</span>
                <span className="text-green-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/admin/tournaments')}
                className="w-full text-left text-sm text-primary hover:underline"
              >
                Create New Tournament
              </button>
              <button 
                onClick={() => navigate('/admin/applications')}
                className="w-full text-left text-sm text-primary hover:underline"
              >
                Review Judge Applications
              </button>
              <button 
                onClick={() => navigate('/admin/payments')}
                className="w-full text-left text-sm text-primary hover:underline"
              >
                View Financial Reports
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Map, Users, Timer, Smartphone, TrendingUp, Eye } from 'lucide-react';

interface InteractionLog {
  id: string;
  route: string;
  scroll_depth: number;
  load_time_ms: number;
  device: string;
  user_role: string;
  created_at: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

const getHeatColor = (value: number, max: number): string => {
  const ratio = value / max;
  if (ratio > 0.75) return 'bg-primary text-primary-foreground';
  if (ratio > 0.5) return 'bg-primary/70 text-primary-foreground';
  if (ratio > 0.25) return 'bg-primary/40 text-foreground';
  return 'bg-muted text-muted-foreground';
};

export function HeatmapDashboard() {
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchLogs();
  }, [timeRange]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('user_interaction_logs')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Route popularity
  const routePopularity = React.useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
      counts[l.route] = (counts[l.route] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([route, visits]) => ({
        route: route.length > 25 ? route.slice(0, 25) + '...' : route,
        fullRoute: route,
        visits
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 12);
  }, [logs]);

  // Device distribution
  const deviceDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
      const device = l.device || 'unknown';
      counts[device] = (counts[device] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [logs]);

  // User role activity
  const roleActivity = React.useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
      const role = l.user_role || 'anonymous';
      counts[role] = (counts[role] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  // Average load times by route
  const loadTimesByRoute = React.useMemo(() => {
    const routes: Record<string, { total: number; count: number }> = {};
    logs.forEach(l => {
      if (!routes[l.route]) routes[l.route] = { total: 0, count: 0 };
      routes[l.route].total += l.load_time_ms;
      routes[l.route].count++;
    });
    return Object.entries(routes)
      .map(([route, data]) => ({
        route: route.length > 20 ? route.slice(0, 20) + '...' : route,
        avgTime: Math.round(data.total / data.count)
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);
  }, [logs]);

  // Scroll depth distribution
  const scrollDepthData = React.useMemo(() => {
    const buckets = [
      { name: '0-25%', min: 0, max: 25, count: 0 },
      { name: '26-50%', min: 26, max: 50, count: 0 },
      { name: '51-75%', min: 51, max: 75, count: 0 },
      { name: '76-100%', min: 76, max: 100, count: 0 }
    ];
    logs.forEach(l => {
      const bucket = buckets.find(b => l.scroll_depth >= b.min && l.scroll_depth <= b.max);
      if (bucket) bucket.count++;
    });
    return buckets;
  }, [logs]);

  // Activity over time
  const activityTrend = React.useMemo(() => {
    const grouped: Record<string, number> = {};
    logs.forEach(l => {
      const date = new Date(l.created_at).toLocaleDateString();
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, visits: count }))
      .reverse()
      .slice(-14);
  }, [logs]);

  const maxVisits = Math.max(...routePopularity.map(r => r.visits), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">UX Heatmap & Analytics</h2>
          <p className="text-muted-foreground">User behavior and engagement insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Page Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Map className="h-4 w-4" />
              Unique Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(logs.map(l => l.route)).size}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Avg Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.length ? Math.round(logs.reduce((a, l) => a + l.load_time_ms, 0) / logs.length) : 0}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Scroll Depth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.length ? Math.round(logs.reduce((a, l) => a + l.scroll_depth, 0) / logs.length) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Heatmap of Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Page Popularity Heatmap
          </CardTitle>
          <CardDescription>Color intensity represents visit frequency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {routePopularity.map((route, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${getHeatColor(route.visits, maxVisits)} transition-colors`}
                title={route.fullRoute}
              >
                <div className="text-xs font-medium truncate">{route.route}</div>
                <div className="text-lg font-bold">{route.visits}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Device Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {deviceDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Role Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Activity by User Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Scroll Depth Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Scroll Depth Distribution</CardTitle>
            <CardDescription>How far users scroll on pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scrollDepthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Load Times Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Average Load Times by Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loadTimesByRoute} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="route" type="category" width={150} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}ms`, 'Avg Time']} />
                <Bar dataKey="avgTime" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

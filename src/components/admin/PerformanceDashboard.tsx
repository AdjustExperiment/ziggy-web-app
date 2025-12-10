import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Activity, Gauge, Clock, Smartphone, Monitor, Tablet } from 'lucide-react';

interface PerformanceMetric {
  id: string;
  route: string;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  ttfb: number | null;
  fid: number | null;
  inp: number | null;
  device_type: string | null;
  connection_type: string | null;
  created_at: string;
}

interface AggregatedMetrics {
  avgFcp: number;
  avgLcp: number;
  avgCls: number;
  avgTtfb: number;
  totalSamples: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const getVitalScore = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds: Record<string, [number, number]> = {
    fcp: [1800, 3000],
    lcp: [2500, 4000],
    cls: [0.1, 0.25],
    ttfb: [800, 1800],
    fid: [100, 300],
    inp: [200, 500]
  };
  
  const [good, poor] = thresholds[name] || [0, 0];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
};

const scoreColors = {
  'good': 'text-green-600 bg-green-100 dark:bg-green-950/30',
  'needs-improvement': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30',
  'poor': 'text-red-600 bg-red-100 dark:bg-red-950/30'
};

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [aggregated, setAggregated] = useState<AggregatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      setMetrics(data || []);

      // Calculate aggregated metrics
      if (data && data.length > 0) {
        const fcpValues = data.filter(m => m.fcp !== null).map(m => m.fcp!);
        const lcpValues = data.filter(m => m.lcp !== null).map(m => m.lcp!);
        const clsValues = data.filter(m => m.cls !== null).map(m => m.cls!);
        const ttfbValues = data.filter(m => m.ttfb !== null).map(m => m.ttfb!);

        setAggregated({
          avgFcp: fcpValues.length ? fcpValues.reduce((a, b) => a + b, 0) / fcpValues.length : 0,
          avgLcp: lcpValues.length ? lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length : 0,
          avgCls: clsValues.length ? clsValues.reduce((a, b) => a + b, 0) / clsValues.length : 0,
          avgTtfb: ttfbValues.length ? ttfbValues.reduce((a, b) => a + b, 0) / ttfbValues.length : 0,
          totalSamples: data.length
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Device type distribution
  const deviceDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    metrics.forEach(m => {
      const device = m.device_type || 'unknown';
      counts[device] = (counts[device] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [metrics]);

  // Route performance
  const routePerformance = React.useMemo(() => {
    const routes: Record<string, { count: number; totalLcp: number }> = {};
    metrics.forEach(m => {
      if (!routes[m.route]) routes[m.route] = { count: 0, totalLcp: 0 };
      routes[m.route].count++;
      if (m.lcp) routes[m.route].totalLcp += m.lcp;
    });
    return Object.entries(routes)
      .map(([route, data]) => ({
        route: route.length > 20 ? route.slice(0, 20) + '...' : route,
        avgLcp: data.count > 0 ? Math.round(data.totalLcp / data.count) : 0,
        samples: data.count
      }))
      .sort((a, b) => b.avgLcp - a.avgLcp)
      .slice(0, 10);
  }, [metrics]);

  // Trend data
  const trendData = React.useMemo(() => {
    const grouped: Record<string, { lcp: number[]; fcp: number[] }> = {};
    metrics.forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString();
      if (!grouped[date]) grouped[date] = { lcp: [], fcp: [] };
      if (m.lcp) grouped[date].lcp.push(m.lcp);
      if (m.fcp) grouped[date].fcp.push(m.fcp);
    });
    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        lcp: data.lcp.length ? Math.round(data.lcp.reduce((a, b) => a + b, 0) / data.lcp.length) : 0,
        fcp: data.fcp.length ? Math.round(data.fcp.reduce((a, b) => a + b, 0) / data.fcp.length) : 0
      }))
      .reverse()
      .slice(-14);
  }, [metrics]);

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
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">Core Web Vitals and Real User Metrics</p>
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

      {/* Core Web Vitals Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">LCP</CardTitle>
              {aggregated && (
                <Badge className={scoreColors[getVitalScore('lcp', aggregated.avgLcp)]}>
                  {getVitalScore('lcp', aggregated.avgLcp)}
                </Badge>
              )}
            </div>
            <CardDescription>Largest Contentful Paint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregated ? `${Math.round(aggregated.avgLcp)}ms` : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">FCP</CardTitle>
              {aggregated && (
                <Badge className={scoreColors[getVitalScore('fcp', aggregated.avgFcp)]}>
                  {getVitalScore('fcp', aggregated.avgFcp)}
                </Badge>
              )}
            </div>
            <CardDescription>First Contentful Paint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregated ? `${Math.round(aggregated.avgFcp)}ms` : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">CLS</CardTitle>
              {aggregated && (
                <Badge className={scoreColors[getVitalScore('cls', aggregated.avgCls)]}>
                  {getVitalScore('cls', aggregated.avgCls)}
                </Badge>
              )}
            </div>
            <CardDescription>Cumulative Layout Shift</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregated ? aggregated.avgCls.toFixed(3) : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">TTFB</CardTitle>
              {aggregated && (
                <Badge className={scoreColors[getVitalScore('ttfb', aggregated.avgTtfb)]}>
                  {getVitalScore('ttfb', aggregated.avgTtfb)}
                </Badge>
              )}
            </div>
            <CardDescription>Time to First Byte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregated ? `${Math.round(aggregated.avgTtfb)}ms` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="lcp" stroke="hsl(var(--primary))" name="LCP (ms)" />
                  <Line type="monotone" dataKey="fcp" stroke="hsl(var(--secondary))" name="FCP (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Device Distribution
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

        {/* Slowest Routes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Slowest Routes (by LCP)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routePerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="route" type="category" width={150} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${value}ms`, 'Avg LCP']} />
                  <Bar dataKey="avgLcp" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Total samples: {aggregated?.totalSamples || 0}</span>
            <span>Data range: {timeRange}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

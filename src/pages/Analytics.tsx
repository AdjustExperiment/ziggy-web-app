import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, Trophy, Target, BarChart3, Calendar, Download } from "lucide-react";
import { SectionFX } from "@/components/SectionFX";

const performanceData = [
  { month: 'Jan', wins: 12, losses: 8, participation: 85 },
  { month: 'Feb', wins: 15, losses: 5, participation: 92 },
  { month: 'Mar', wins: 18, losses: 7, participation: 88 },
  { month: 'Apr', wins: 22, losses: 3, participation: 95 },
  { month: 'May', wins: 19, losses: 6, participation: 90 },
  { month: 'Jun', wins: 25, losses: 2, participation: 98 }
];

const formatData = [
  { name: 'Policy Debate', value: 35, color: 'hsl(var(--primary))' },
  { name: 'Parliamentary', value: 28, color: 'hsl(var(--primary-glow))' },
  { name: 'Public Forum', value: 22, color: 'hsl(var(--accent))' },
  { name: 'British Parliamentary', value: 15, color: 'hsl(var(--muted))' }
];

const Analytics = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <SectionFX variant="default" intensity="low" />
      
      {/* Header */}
      <section className="relative bg-gradient-hero py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4 font-primary">
                Performance Analytics
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl">
                Track your debate performance, identify improvement areas, and optimize your competitive strategy.
              </p>
            </div>
            <div className="flex gap-4">
              <Select>
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
              <Button variant="outline" className="border-border text-foreground hover:bg-accent">
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                <Trophy className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">78.5%</div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+5.2%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Debates</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">127</div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+12</span>
                  <span className="text-muted-foreground ml-1">this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">8.7/10</div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+0.3</span>
                  <span className="text-muted-foreground ml-1">improvement</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tournaments</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">23</div>
                <div className="flex items-center text-sm">
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">-2</span>
                  <span className="text-muted-foreground ml-1">vs last month</span>
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
            {/* Performance Trend */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-card-foreground font-primary">Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
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
                    <Line type="monotone" dataKey="wins" stroke="hsl(var(--primary))" strokeWidth={3} name="Wins" />
                    <Line type="monotone" dataKey="losses" stroke="hsl(var(--destructive))" strokeWidth={3} name="Losses" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Format Distribution */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-card-foreground font-primary">Debate Format Distribution</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Monthly Participation */}
            <Card className="bg-gradient-card border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-card-foreground font-primary">Monthly Participation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
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
                    <Bar dataKey="participation" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Insights */}
      <section className="relative py-12 border-t border-border">
        <SectionFX variant="hero" intensity="low" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-2xl font-bold text-foreground mb-8 font-primary">Performance Insights</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <Badge className="w-fit bg-green-500/10 text-green-500 border-green-500/20">
                  Strength
                </Badge>
                <CardTitle className="text-lg text-card-foreground">Policy Debate Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your win rate in Policy Debate is 15% above average. Consider specializing further in this format.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <Badge className="w-fit bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                  Opportunity  
                </Badge>
                <CardTitle className="text-lg text-card-foreground">Public Forum Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your Public Forum performance has room for improvement. Focus on cross-examination skills.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <Badge className="w-fit bg-red-500/10 text-red-500 border-red-500/20">
                  Challenge
                </Badge>
                <CardTitle className="text-lg text-card-foreground">Consistency Needed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Performance varies significantly between tournaments. Work on maintaining consistent preparation.
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
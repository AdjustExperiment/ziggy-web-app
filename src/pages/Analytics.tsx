import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, Trophy, Target, BarChart3, Calendar, Download } from "lucide-react";

const performanceData = [
  { month: 'Jan', wins: 12, losses: 8, participation: 85 },
  { month: 'Feb', wins: 15, losses: 5, participation: 92 },
  { month: 'Mar', wins: 18, losses: 7, participation: 88 },
  { month: 'Apr', wins: 22, losses: 3, participation: 95 },
  { month: 'May', wins: 19, losses: 6, participation: 90 },
  { month: 'Jun', wins: 25, losses: 2, participation: 98 }
];

const formatData = [
  { name: 'Policy Debate', value: 35, color: '#DC2626' },
  { name: 'Parliamentary', value: 28, color: '#991B1B' },
  { name: 'Public Forum', value: 22, color: '#B91C1C' },
  { name: 'British Parliamentary', value: 15, color: '#7F1D1D' }
];

const Analytics = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-black py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4 font-primary">
                Performance Analytics
              </h1>
              <p className="text-xl text-white/70 max-w-3xl">
                Track your debate performance, identify improvement areas, and optimize your competitive strategy.
              </p>
            </div>
            <div className="flex gap-4">
              <Select>
                <SelectTrigger className="w-40 bg-black border-white/20 text-white">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  <SelectItem value="7d" className="text-white hover:bg-white/10">Last 7 days</SelectItem>
                  <SelectItem value="30d" className="text-white hover:bg-white/10">Last 30 days</SelectItem>
                  <SelectItem value="90d" className="text-white hover:bg-white/10">Last 90 days</SelectItem>
                  <SelectItem value="1y" className="text-white hover:bg-white/10">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-white/30 text-white hover:bg-red-500 hover:border-red-500">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="py-8 bg-black border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-black border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Win Rate</CardTitle>
                <Trophy className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">78.5%</div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+5.2%</span>
                  <span className="text-white/70 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Total Debates</CardTitle>
                <BarChart3 className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">127</div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+12</span>
                  <span className="text-white/70 ml-1">this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Average Score</CardTitle>
                <Target className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">8.7/10</div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+0.3</span>
                  <span className="text-white/70 ml-1">improvement</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Tournaments</CardTitle>
                <Calendar className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">23</div>
                <div className="flex items-center text-sm">
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">-2</span>
                  <span className="text-white/70 ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="py-12 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Performance Trend */}
            <Card className="bg-black border-white/10">
              <CardHeader>
                <CardTitle className="text-white font-primary">Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#000000', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="wins" stroke="#DC2626" strokeWidth={3} name="Wins" />
                    <Line type="monotone" dataKey="losses" stroke="#991B1B" strokeWidth={3} name="Losses" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Format Distribution */}
            <Card className="bg-black border-white/10">
              <CardHeader>
                <CardTitle className="text-white font-primary">Debate Format Distribution</CardTitle>
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
                        backgroundColor: '#000000', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Participation */}
            <Card className="bg-black border-white/10 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white font-primary">Monthly Participation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#000000', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                    <Bar dataKey="participation" fill="#DC2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Insights */}
      <section className="py-12 bg-black/95 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8 font-primary">Performance Insights</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-black border-white/10">
              <CardHeader>
                <Badge className="w-fit bg-green-500/10 text-green-500 border-green-500/20">
                  Strength
                </Badge>
                <CardTitle className="text-lg text-white">Policy Debate Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">
                  Your win rate in Policy Debate is 15% above average. Consider specializing further in this format.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/10">
              <CardHeader>
                <Badge className="w-fit bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                  Opportunity  
                </Badge>
                <CardTitle className="text-lg text-white">Public Forum Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">
                  Your Public Forum performance has room for improvement. Focus on cross-examination skills.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/10">
              <CardHeader>
                <Badge className="w-fit bg-red-500/10 text-red-500 border-red-500/20">
                  Challenge
                </Badge>
                <CardTitle className="text-lg text-white">Consistency Needed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">
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
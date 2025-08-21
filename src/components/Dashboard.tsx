import { Users, Trophy, Target, TrendingUp, Calendar, Star } from "lucide-react";
import { KPICard } from "./KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const growthData = [
  { month: "Jan", participants: 420, tournaments: 12 },
  { month: "Feb", participants: 580, tournaments: 15 },
  { month: "Mar", participants: 720, tournaments: 18 },
  { month: "Apr", participants: 890, tournaments: 22 },
  { month: "May", participants: 1150, tournaments: 28 },
  { month: "Jun", participants: 1340, tournaments: 32 },
];

const tournamentData = [
  { name: "High School", value: 45, color: "hsl(355 100% 45%)" },
  { name: "College", value: 35, color: "hsl(355 80% 50%)" },
  { name: "Professional", value: 20, color: "hsl(355 60% 55%)" },
];

const recentResults = [
  { tournament: "National Championship 2024", winner: "Harvard Debate Society", date: "2024-03-15" },
  { tournament: "Regional Finals", winner: "Stanford Speech Team", date: "2024-03-10" },
  { tournament: "Youth Debate Cup", winner: "Lincoln High Debaters", date: "2024-03-05" },
];

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Tournament Analytics</h1>
          <p className="mt-2 text-sm sm:text-base text-white/70">
            Comprehensive insights into debate tournament performance and engagement
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 sm:mb-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Participants"
            value="1,342"
            change="+16.5%"
            trend="up"
            description="vs last month"
            icon={<Users className="h-4 w-4" />}
          />
          <KPICard
            title="Active Tournaments"
            value="32"
            change="+8.2%"
            trend="up"
            description="currently running"
            icon={<Trophy className="h-4 w-4" />}
          />
          <KPICard
            title="Win Rate"
            value="78.5%"
            change="-2.1%"
            trend="down"
            description="championship success"
            icon={<Target className="h-4 w-4" />}
          />
          <KPICard
            title="Engagement Score"
            value="94.2"
            change="+12.8%"
            trend="up"
            description="participant satisfaction"
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="mb-6 sm:mb-8 grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Growth Chart */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-primary" />
                Growth Trajectory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="white" />
                  <YAxis stroke="white" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "white"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="participants"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tournaments"
                    stroke="hsl(var(--primary-glow))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary-glow))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tournament Distribution */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5 text-primary" />
                Tournament Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <PieChart>
                  <Pie
                    data={tournamentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tournamentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "white"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex justify-center gap-4">
                {tournamentData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-white/70">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Results */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Star className="h-5 w-5 text-primary" />
              Recent Tournament Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth"
                >
                  <div className="space-y-1">
                    <h4 className="font-medium text-white">{result.tournament}</h4>
                    <p className="text-sm text-white/70">{result.winner}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="outline" className="text-xs text-white border-white/20">
                      <Calendar className="h-3 w-3 mr-1" />
                      {result.date}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
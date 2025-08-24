import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from '@/components/KPICard';
import { Users, Trophy, DollarSign, Calendar } from 'lucide-react';

export function Dashboard() {
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
          value="1,234" 
          change="12%" 
          trend="up"
          icon={<Users className="h-4 w-4" />}
        />
        <KPICard 
          title="Active Tournaments" 
          value="23" 
          change="8%" 
          trend="up"
          icon={<Trophy className="h-4 w-4" />}
        />
        <KPICard 
          title="Monthly Revenue" 
          value="$12,450" 
          change="15%" 
          trend="up"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPICard 
          title="Upcoming Events" 
          value="7" 
          change="2%" 
          trend="down"
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
              <div className="flex justify-between items-center text-sm">
                <span>New registration: John Doe</span>
                <span className="text-muted-foreground">2 mins ago</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Tournament created: State Championships</span>
                <span className="text-muted-foreground">1 hour ago</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Judge application: Sarah Smith</span>
                <span className="text-muted-foreground">3 hours ago</span>
              </div>
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
              <button className="w-full text-left text-sm text-primary hover:underline">
                Create New Tournament
              </button>
              <button className="w-full text-left text-sm text-primary hover:underline">
                Review Judge Applications
              </button>
              <button className="w-full text-left text-sm text-primary hover:underline">
                Generate Financial Report
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
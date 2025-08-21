import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TournamentManager from '@/components/admin/TournamentManager';
import { UserManager } from '@/components/admin/UserManager';
import { PaymentManager } from '@/components/admin/PaymentManager';
import { EmailManager } from '@/components/admin/EmailManager';
import { ResultsManager } from '@/components/admin/ResultsManager';
import { SiteEditor } from '@/components/admin/SiteEditor';
import { BlogManager } from '@/components/admin/BlogManager';
import { NotificationsManager } from '@/components/admin/NotificationsManager';
import { TabManager } from '@/components/admin/TabManager';
import { 
  Trophy, 
  Users, 
  CreditCard, 
  Mail, 
  BarChart3, 
  Settings, 
  FileText, 
  Bell,
  Gavel
} from 'lucide-react';

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('tournaments');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage tournaments, users, payments, and site content
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="tournaments" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Tournaments
            </TabsTrigger>
            <TabsTrigger value="tab" className="flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              Tab
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="site" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Site
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tournaments">
            <TournamentManager />
          </TabsContent>

          <TabsContent value="tab">
            <TabManager />
          </TabsContent>

          <TabsContent value="users">
            <UserManager />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentManager />
          </TabsContent>

          <TabsContent value="emails">
            <EmailManager />
          </TabsContent>

          <TabsContent value="results">
            <ResultsManager />
          </TabsContent>

          <TabsContent value="site">
            <SiteEditor />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManager />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

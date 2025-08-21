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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-1">
            <TabsTrigger value="tournaments" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Tournaments</span>
              <span className="sm:hidden text-xs">Tours</span>
            </TabsTrigger>
            <TabsTrigger value="tab" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
              <Gavel className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Tab</span>
              <span className="sm:hidden text-xs">Tab</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden text-xs">Users</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Payments</span>
              <span className="sm:hidden text-xs">Pay</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
              <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Emails</span>
              <span className="sm:hidden text-xs">Mail</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Results</span>
              <span className="sm:hidden text-xs">Results</span>
            </TabsTrigger>
            <TabsTrigger value="site" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Site</span>
              <span className="sm:hidden text-xs">Site</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Blog</span>
              <span className="sm:hidden text-xs">Blog</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden text-xs">Notify</span>
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

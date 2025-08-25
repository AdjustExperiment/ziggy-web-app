import React, { useState, useMemo } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dashboard } from '@/components/admin/Dashboard';
import { TournamentManager } from '@/components/admin/TournamentManager';
import { TabulationPlatform } from '@/components/admin/TabulationPlatform';
import { PaymentManager } from '@/components/admin/PaymentManager';
import { JudgeApplicationManager } from '@/components/admin/JudgeApplicationManager';
import { EnhancedJudgesManager } from '@/components/admin/EnhancedJudgesManager';
import { UserManager } from '@/components/admin/UserManager';
import { EnhancedEmailTemplateManager } from '@/components/admin/EnhancedEmailTemplateManager';
import { NotificationsManager } from '@/components/admin/NotificationsManager';
import { BlogManager } from '@/components/admin/BlogManager';
import { SiteEditor } from '@/components/admin/SiteEditor';
import { PromoCodesManager } from '@/components/admin/PromoCodesManager';
import { StaffRevenueCalculator } from '@/components/admin/StaffRevenueCalculator';
import { SecurityDashboard } from '@/components/admin/SecurityDashboard';

import { FooterContentManager } from '@/components/admin/FooterContentManager';

export default function AdminDashboard() {
  const { signOut, isAdmin } = useOptimizedAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  // Memoize tab content to prevent unnecessary re-renders
  const renderTabContent = useMemo(() => {
    const components = {
      dashboard: <Dashboard />,
      tournaments: <TournamentManager />,
      tabulation: <TabulationPlatform />,
      payments: <PaymentManager activeTab={activeTab} setActiveTab={setActiveTab} />,
      applications: <JudgeApplicationManager />,
      judges: <EnhancedJudgesManager />,
      users: <UserManager />,
      emails: <EnhancedEmailTemplateManager />,
      notifications: <NotificationsManager />,
      blog: <BlogManager />,
      site: <SiteEditor />,
      promos: <PromoCodesManager />,
      staff: <StaffRevenueCalculator />,
      security: <SecurityDashboard />,
      footer: <FooterContentManager />,
    };

    return components[activeTab as keyof typeof components] || <Dashboard />;
  }, [activeTab]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={() => signOut()}>Logout</Button>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-1 h-auto p-1">
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="tournaments" className="text-xs">Tournaments</TabsTrigger>
          <TabsTrigger value="tabulation" className="text-xs">Tabulation</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
          <TabsTrigger value="applications" className="text-xs">Applications</TabsTrigger>
          <TabsTrigger value="judges" className="text-xs">Judges</TabsTrigger>
          <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
          <TabsTrigger value="emails" className="text-xs">Emails</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">Notifications</TabsTrigger>
          <TabsTrigger value="blog" className="text-xs">Blog</TabsTrigger>
          <TabsTrigger value="site" className="text-xs">Site Editor</TabsTrigger>
          <TabsTrigger value="promos" className="text-xs">Promo Codes</TabsTrigger>
          <TabsTrigger value="staff" className="text-xs">Staff Calc</TabsTrigger>
          <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
          <TabsTrigger value="footer" className="text-xs">Footer</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          {renderTabContent}
        </TabsContent>
      </Tabs>
    </div>
  );
}

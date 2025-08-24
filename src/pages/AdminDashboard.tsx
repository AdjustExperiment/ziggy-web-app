import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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

export default function AdminDashboard() {
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tournaments':
        return <TournamentManager />;
      case 'tabulation':
        return <TabulationPlatform />;
      case 'payments':
        return <PaymentManager activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'applications':
        return <JudgeApplicationManager />;
      case 'judges':
        return <EnhancedJudgesManager />;
      case 'users':
        return <UserManager />;
      case 'emails':
        return <EnhancedEmailTemplateManager />;
      case 'notifications':
        return <NotificationsManager />;
      case 'blog':
        return <BlogManager />;
      case 'site':
        return <SiteEditor />;
      case 'promos':
        return <PromoCodesManager />;
      case 'staff':
        return <StaffRevenueCalculator />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={() => signOut()}>Logout</Button>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-1 h-auto p-1">
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
        </TabsList>
        <TabsContent value={activeTab}>
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

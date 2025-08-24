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
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="tabulation">Tabulation</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

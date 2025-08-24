
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminPanelTab } from '@/components/admin/AdminPanelTab';
import { TournamentManager } from '@/components/admin/TournamentManager';
import { TabulationPlatform } from '@/components/admin/TabulationPlatform';

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tournaments">Tournament Manager</TabsTrigger>
          <TabsTrigger value="tabulation">Tabulation Platform</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <AdminPanelTab />
        </TabsContent>
        
        <TabsContent value="tournaments">
          <TournamentManager />
        </TabsContent>
        
        <TabsContent value="tabulation">
          <TabulationPlatform />
        </TabsContent>
      </Tabs>
    </div>
  );
}


import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentManager } from '@/components/admin/TournamentManager';
import { TabulationPlatform } from '@/components/admin/TabulationPlatform';
import { EmailManager } from '@/components/admin/EmailManager';
import { PaymentManager } from '@/components/admin/PaymentManager';
import { JudgesManager } from '@/components/admin/JudgesManager';
import { UserManager } from '@/components/admin/UserManager';
import { DebateFormatsManager } from '@/components/admin/DebateFormatsManager';
import { BallotTemplatesManager } from '@/components/admin/BallotTemplatesManager';
import { TournamentContentManager } from '@/components/admin/TournamentContentManager';
import { ResultsManager } from '@/components/admin/ResultsManager';
import { NotificationsManager } from '@/components/admin/NotificationsManager';
import { BlogManager } from '@/components/admin/BlogManager';
import { SiteEditor } from '@/components/admin/SiteEditor';

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('tournaments');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-1">
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="tabulation">Tabulation</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="judges">Judges</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="formats">Formats</TabsTrigger>
          <TabsTrigger value="ballots">Ballots</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="site">Site</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tournaments">
          <TournamentManager />
        </TabsContent>
        
        <TabsContent value="tabulation">
          <TabulationPlatform />
        </TabsContent>
        
        <TabsContent value="emails">
          <EmailManager />
        </TabsContent>
        
        <TabsContent value="payments">
          <PaymentManager />
        </TabsContent>
        
        <TabsContent value="judges">
          <JudgesManager />
        </TabsContent>
        
        <TabsContent value="users">
          <UserManager />
        </TabsContent>
        
        <TabsContent value="formats">
          <DebateFormatsManager />
        </TabsContent>
        
        <TabsContent value="ballots">
          <BallotTemplatesManager />
        </TabsContent>
        
        <TabsContent value="content">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Tournament Content Management</h3>
            <p className="text-muted-foreground">Select a tournament from the Tournaments tab to manage its content.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="results">
          <ResultsManager />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationsManager />
        </TabsContent>
        
        <TabsContent value="blog">
          <BlogManager />
        </TabsContent>
        
        <TabsContent value="site">
          <SiteEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}


import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoundsManager } from './RoundsManager';
import { TabulationPlatform } from './TabulationPlatform';
import { EnhancedJudgesManager } from './EnhancedJudgesManager';
import { BallotTemplatesManager } from './BallotTemplatesManager';
import { BallotRevealSettings } from './BallotRevealSettings';
import { DebateFormatsManager } from './DebateFormatsManager';
import { Users, Clock, Gavel, FileText, Eye, MessageSquare } from 'lucide-react';

export function TabManager() {
  const [activeTab, setActiveTab] = useState('formats');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tournament Tab Management</h2>
        <p className="text-muted-foreground">
          Manage debate formats, rounds, pairings, judges, and ballots for tournaments
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="formats" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Formats
          </TabsTrigger>
          <TabsTrigger value="rounds" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Rounds
          </TabsTrigger>
          <TabsTrigger value="pairings" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Tabulation
          </TabsTrigger>
          <TabsTrigger value="judges" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            Judges
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ballot Templates
          </TabsTrigger>
          <TabsTrigger value="reveal" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Ballot Reveal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="formats">
          <DebateFormatsManager />
        </TabsContent>

        <TabsContent value="rounds">
          <RoundsManager />
        </TabsContent>

        <TabsContent value="pairings">
          <TabulationPlatform />
        </TabsContent>

        <TabsContent value="judges">
          <EnhancedJudgesManager />
        </TabsContent>

        <TabsContent value="templates">
          <BallotTemplatesManager />
        </TabsContent>

        <TabsContent value="reveal">
          <BallotRevealSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedJudgesManager } from './EnhancedJudgesManager';
import { BallotTemplatesManager } from './BallotTemplatesManager';
import { DebateFormatsManager } from './DebateFormatsManager';
import { Gavel, FileText, MessageSquare } from 'lucide-react';

export function TabManager() {
  const [activeTab, setActiveTab] = useState('formats');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Global Tab Settings</h2>
        <p className="text-muted-foreground">
          Manage debate formats, judges, and ballot templates. Rounds and pairings are managed per-tournament.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="formats" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Formats
          </TabsTrigger>
          <TabsTrigger value="judges" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            Judges
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ballot Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="formats">
          <DebateFormatsManager />
        </TabsContent>

        <TabsContent value="judges">
          <EnhancedJudgesManager />
        </TabsContent>

        <TabsContent value="templates">
          <BallotTemplatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

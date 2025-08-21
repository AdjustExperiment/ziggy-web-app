
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MultiJudgePanelManager from './MultiJudgePanelManager';
import JudgeSelectionHeuristics from './JudgeSelectionHeuristics';
import { Users, Brain } from 'lucide-react';

interface AdminPanelTabProps {
  tournamentId: string;
}

export default function AdminPanelTab({ tournamentId }: AdminPanelTabProps) {
  return (
    <Tabs defaultValue="panels" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="panels" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Multi-Judge Panels
        </TabsTrigger>
        <TabsTrigger value="heuristics" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          AI Selection
        </TabsTrigger>
      </TabsList>

      <TabsContent value="panels">
        <MultiJudgePanelManager tournamentId={tournamentId} />
      </TabsContent>

      <TabsContent value="heuristics">
        <JudgeSelectionHeuristics tournamentId={tournamentId} />
      </TabsContent>
    </Tabs>
  );
}

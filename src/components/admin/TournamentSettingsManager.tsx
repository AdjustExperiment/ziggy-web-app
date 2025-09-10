import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentRoleAccessManager } from './TournamentRoleAccessManager';
import { TabulationSettingsManager } from './TabulationSettingsManager';

interface TournamentSettingsManagerProps {
  tournamentId: string;
}

export function TournamentSettingsManager({ tournamentId }: TournamentSettingsManagerProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Tournament Settings</h3>
        <p className="text-muted-foreground">Configure tournament-specific settings and permissions</p>
      </div>

      <Tabs defaultValue="access" className="space-y-6">
        <TabsList>
          <TabsTrigger value="access">Role Access</TabsTrigger>
          <TabsTrigger value="tabulation">Tabulation (Beta)</TabsTrigger>
        </TabsList>

        <TabsContent value="access">
          <TournamentRoleAccessManager tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="tabulation">
          <TabulationSettingsManager tournamentId={tournamentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
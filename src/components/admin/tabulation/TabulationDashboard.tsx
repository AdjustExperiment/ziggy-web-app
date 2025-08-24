import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CompetitorDirectory } from './CompetitorDirectory';
import { ParticipationManager } from './ParticipationManager';
import { TabulationRulesManager } from './TabulationRulesManager';
import { JudgePostingsView } from './JudgePostingsView';

interface TabulationDashboardProps {
  tournamentId: string;
}

export default function TabulationDashboard({ tournamentId }: TabulationDashboardProps) {
  const [activeTab, setActiveTab] = useState('competitors');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tabulation Dashboard</h1>
        <p className="text-muted-foreground">
          Manage tournament participants, pairings, and standings.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="pairings">Pairings</TabsTrigger>
          <TabsTrigger value="participation">Participation</TabsTrigger>
          <TabsTrigger value="judges">Judges</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="brackets">Brackets</TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="competitors">
          <CompetitorDirectory tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="pairings">
          <Card>
            <CardHeader>
              <CardTitle>Pairing Generator</CardTitle>
              <CardDescription>Generate tournament pairings and manage rounds.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Pairing generation will be available soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participation">
          <ParticipationManager tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="judges">
          <JudgePostingsView tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="standings">
          <Card>
            <CardHeader>
              <CardTitle>Standings View</CardTitle>
              <CardDescription>View current tournament standings and rankings.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Standings will be available after rounds are completed.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brackets">
          <Card>
            <CardHeader>
              <CardTitle>Brackets Manager</CardTitle>
              <CardDescription>Manage tournament brackets and elimination rounds.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Bracket management will be available soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="constraints">
          <Card>
            <CardHeader>
              <CardTitle>Constraints Manager</CardTitle>
              <CardDescription>Set up pairing constraints and preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Constraint management will be available soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <TabulationRulesManager tournamentId={tournamentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
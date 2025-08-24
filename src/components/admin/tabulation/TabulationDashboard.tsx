
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Settings, BarChart3, UserCheck, Calendar, CheckSquare } from 'lucide-react';
import { CompetitorDirectory } from './CompetitorDirectory';
import { TabulationRulesManager } from './TabulationRulesManager';
import { JudgePostingsView } from './JudgePostingsView';
import { ParticipationManager } from './ParticipationManager';

interface TabulationDashboardProps {
  tournamentId: string;
}

export function TabulationDashboard({ tournamentId }: TabulationDashboardProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Tournament Tabulation Dashboard
          </CardTitle>
          <CardDescription>
            Manage all aspects of tournament tabulation including pairings, standings, and participation
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="competitors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
          <TabsTrigger value="competitors" className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            <span className="hidden sm:inline">Competitors</span>
          </TabsTrigger>
          <TabsTrigger value="pairings" className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            <span className="hidden sm:inline">Pairings</span>
          </TabsTrigger>
          <TabsTrigger value="participation" className="flex items-center gap-1 text-xs">
            <UserCheck className="h-3 w-3" />
            <span className="hidden sm:inline">Participation</span>
          </TabsTrigger>
          <TabsTrigger value="judges" className="flex items-center gap-1 text-xs">
            <CheckSquare className="h-3 w-3" />
            <span className="hidden sm:inline">Judges</span>
          </TabsTrigger>
          <TabsTrigger value="standings" className="flex items-center gap-1 text-xs">
            <BarChart3 className="h-3 w-3" />
            <span className="hidden sm:inline">Standings</span>
          </TabsTrigger>
          <TabsTrigger value="brackets" className="flex items-center gap-1 text-xs">
            <Trophy className="h-3 w-3" />
            <span className="hidden sm:inline">Brackets</span>
          </TabsTrigger>
          <TabsTrigger value="constraints" className="flex items-center gap-1 text-xs">
            <Settings className="h-3 w-3" />
            <span className="hidden sm:inline">Constraints</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-1 text-xs">
            <Settings className="h-3 w-3" />
            <span className="hidden sm:inline">Rules</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="competitors">
          <CompetitorDirectory tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="pairings">
          <div className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-bold mb-2">Pairing Generator</h3>
              <p className="text-muted-foreground">Generate tournament pairings here</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="participation">
          <ParticipationManager tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="judges">
          <JudgePostingsView tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="standings">
          <div className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-bold mb-2">Tournament Standings</h3>
              <p className="text-muted-foreground">View tournament standings here</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="brackets">
          <div className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-bold mb-2">Elimination Brackets</h3>
              <p className="text-muted-foreground">Manage elimination brackets here</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="constraints">
          <div className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-bold mb-2">Constraints Manager</h3>
              <p className="text-muted-foreground">Manage pairing constraints here</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <TabulationRulesManager tournamentId={tournamentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

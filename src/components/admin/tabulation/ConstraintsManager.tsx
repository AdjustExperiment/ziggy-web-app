import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, X } from 'lucide-react';
import { Registration, JudgeProfile } from '@/types/database';

interface ConstraintsManagerProps {
  tournamentId: string;
  registrations: Registration[];
  judges: JudgeProfile[];
}

export function ConstraintsManager({ tournamentId, registrations, judges }: ConstraintsManagerProps) {
  const [teamConflicts, setTeamConflicts] = useState<Array<{id: string; team1: string; team2: string}>>([]);
  const [judgeConflicts, setJudgeConflicts] = useState<Array<{id: string; judge: string; team: string}>>([]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Constraints Manager
          </CardTitle>
          <CardDescription>
            Manage team conflicts, judge conflicts, and pairing constraints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Team Conflicts</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Conflict
              </Button>
            </div>
            {teamConflicts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No team conflicts configured</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamConflicts.map((conflict) => (
                  <div key={conflict.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{conflict.team1}</Badge>
                      <span className="text-sm text-muted-foreground">cannot face</span>
                      <Badge variant="outline">{conflict.team2}</Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Judge Conflicts</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Conflict
              </Button>
            </div>
            {judgeConflicts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No judge conflicts configured</p>
              </div>
            ) : (
              <div className="space-y-2">
                {judgeConflicts.map((conflict) => (
                  <div key={conflict.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{conflict.judge}</Badge>
                      <span className="text-sm text-muted-foreground">cannot judge</span>
                      <Badge variant="outline">{conflict.team}</Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
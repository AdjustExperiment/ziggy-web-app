import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, ChevronRight } from 'lucide-react';
import { Registration, JudgeProfile, Round } from '@/types/database';

interface BracketsManagerProps {
  tournamentId: string;
  rounds: Round[];
  registrations: Registration[];
  judges: JudgeProfile[];
  onRoundsUpdate: () => void;
}

export function BracketsManager({ 
  tournamentId, 
  rounds, 
  registrations, 
  judges, 
  onRoundsUpdate 
}: BracketsManagerProps) {
  const [bracketType, setBracketType] = useState<'single' | 'double'>('single');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Elimination Brackets
          </CardTitle>
          <CardDescription>
            Manage elimination rounds and bracket progression
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button 
              variant={bracketType === 'single' ? 'default' : 'outline'}
              onClick={() => setBracketType('single')}
            >
              Single Elimination
            </Button>
            <Button 
              variant={bracketType === 'double' ? 'default' : 'outline'}
              onClick={() => setBracketType('double')}
            >
              Double Elimination
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Brackets Created</h3>
              <p className="text-muted-foreground mb-4">
                Create elimination brackets from preliminary round results
              </p>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Generate Brackets
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
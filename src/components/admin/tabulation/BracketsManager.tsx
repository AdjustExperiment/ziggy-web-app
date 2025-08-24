import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Users, Play, Settings, Target } from 'lucide-react';

interface BracketsManagerProps {
  tournamentId: string;
  rounds: any[];
  registrations: any[];
}

export function BracketsManager({ tournamentId, rounds, registrations }: BracketsManagerProps) {
  const { toast } = useToast();
  const [bracketType, setBracketType] = useState<'single' | 'double'>('single');
  const [bracketSize, setBracketSize] = useState<number>(8);
  const [loading, setLoading] = useState(false);

  const availableSizes = [4, 8, 16, 32, 64];

  const generateBracket = async () => {
    try {
      setLoading(true);
      
      toast({
        title: "Feature Coming Soon",
        description: "Bracket generation will be available in a future update",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate bracket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Bracket Configuration
          </CardTitle>
          <CardDescription>
            Set up elimination brackets for tournament finals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Bracket Type</label>
              <Select value={bracketType} onValueChange={(value: any) => setBracketType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Elimination</SelectItem>
                  <SelectItem value="double">Double Elimination</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Bracket Size</label>
              <Select value={bracketSize.toString()} onValueChange={(value) => setBracketSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSizes.map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} Teams
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={generateBracket} disabled={loading}>
              <Play className="h-4 w-4 mr-2" />
              Generate Bracket
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{registrations.length} registered teams</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bracket Preview</CardTitle>
          <CardDescription>
            Bracket visualization will appear here once generated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Bracket Generated</h3>
            <p className="text-muted-foreground">
              Configure your bracket settings and click "Generate Bracket" to create the elimination structure.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
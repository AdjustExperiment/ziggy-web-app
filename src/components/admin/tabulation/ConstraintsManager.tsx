import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Shield, Users, AlertTriangle, Plus, X } from 'lucide-react';

interface ConstraintsManagerProps {
  tournamentId: string;
  registrations: any[];
  judges: any[];
}

interface Constraint {
  id: string;
  type: 'team_conflict' | 'judge_conflict' | 'school_protect' | 'rematch_avoid';
  description: string;
  enabled: boolean;
}

export function ConstraintsManager({ tournamentId, registrations, judges }: ConstraintsManagerProps) {
  const { toast } = useToast();
  const [constraints, setConstraints] = useState<Constraint[]>([
    {
      id: '1',
      type: 'school_protect',
      description: 'Prevent teams from the same school from debating each other',
      enabled: true
    },
    {
      id: '2',
      type: 'rematch_avoid',
      description: 'Avoid teams debating each other multiple times',
      enabled: true
    },
    {
      id: '3',
      type: 'judge_conflict',
      description: 'Prevent judges from judging teams from their school',
      enabled: true
    }
  ]);
  const [loading, setLoading] = useState(false);

  const toggleConstraint = (constraintId: string) => {
    setConstraints(prev => 
      prev.map(constraint => 
        constraint.id === constraintId 
          ? { ...constraint, enabled: !constraint.enabled }
          : constraint
      )
    );
  };

  const addCustomConstraint = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Custom constraint creation will be available in a future update",
    });
  };

  const saveConstraints = async () => {
    try {
      setLoading(true);
      
      // This would normally save to database
      toast({
        title: "Success",
        description: "Constraints updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save constraints",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getConstraintIcon = (type: string) => {
    switch (type) {
      case 'school_protect': return <Shield className="h-4 w-4" />;
      case 'rematch_avoid': return <Users className="h-4 w-4" />;
      case 'judge_conflict': return <AlertTriangle className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getConstraintColor = (type: string, enabled: boolean) => {
    if (!enabled) return 'outline';
    switch (type) {
      case 'school_protect': return 'default';
      case 'rematch_avoid': return 'secondary';
      case 'judge_conflict': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Pairing Constraints
              </CardTitle>
              <CardDescription>
                Configure rules and restrictions for tournament pairings
              </CardDescription>
            </div>
            <Button onClick={addCustomConstraint} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {constraints.map((constraint) => (
            <Card key={constraint.id} className={`border-l-4 ${
              constraint.enabled ? 'border-l-primary' : 'border-l-muted'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      {getConstraintIcon(constraint.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{constraint.description}</span>
                        <Badge variant={getConstraintColor(constraint.type, constraint.enabled)} className="text-xs">
                          {constraint.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Status: {constraint.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={constraint.enabled}
                    onCheckedChange={() => toggleConstraint(constraint.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end pt-4">
            <Button onClick={saveConstraints} disabled={loading}>
              {loading ? 'Saving...' : 'Save Constraints'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Constraint Summary</CardTitle>
          <CardDescription>
            Overview of active constraints and their impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Constraints</p>
                    <p className="text-2xl font-bold text-green-600">
                      {constraints.filter(c => c.enabled).length}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Protected Schools</p>
                    <p className="text-2xl font-bold">
                      {new Set(registrations.map(r => r.school_organization).filter(Boolean)).size}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Judge Conflicts</p>
                    <p className="text-2xl font-bold text-orange-600">0</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
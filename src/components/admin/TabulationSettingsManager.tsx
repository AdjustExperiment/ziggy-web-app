import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface TabulationSettings {
  id?: string;
  tournament_id: string;
  pairing_method: string;
  avoid_rematches: boolean;
  club_protect: boolean;
  preserve_break_rounds: boolean;
  prevent_bracket_breaks: boolean;
  max_repeat_opponents: number;
  side_balance_target: number;
  speaker_points_method: string;
  allow_judges_view_all_chat: boolean;
}

interface TabulationSettingsManagerProps {
  tournamentId: string;
}

export function TabulationSettingsManager({ tournamentId }: TabulationSettingsManagerProps) {
  const [settings, setSettings] = useState<TabulationSettings>({
    tournament_id: tournamentId,
    pairing_method: 'swiss',
    avoid_rematches: true,
    club_protect: true,
    preserve_break_rounds: false,
    prevent_bracket_breaks: false,
    max_repeat_opponents: 0,
    side_balance_target: 50,
    speaker_points_method: 'standard',
    allow_judges_view_all_chat: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchSettings();
    }
  }, [tournamentId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_tabulation_settings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error('Error fetching tabulation settings:', error);
      toast({
        title: "Error",
        description: "Failed to load tabulation settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tournament_tabulation_settings')
        .upsert(settings, { onConflict: 'tournament_id' });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Tabulation settings have been saved successfully.",
      });
    } catch (error: any) {
      console.error('Error saving tabulation settings:', error);
      toast({
        title: "Error",
        description: "Failed to save tabulation settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof TabulationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">Beta Feature</Badge>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pairing Configuration</CardTitle>
          <CardDescription>
            Configure how pairings are generated for this tournament
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pairing-method">Pairing Method</Label>
              <Select
                value={settings.pairing_method}
                onValueChange={(value) => updateSetting('pairing_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="swiss">Swiss System</SelectItem>
                  <SelectItem value="elimination">Single Elimination</SelectItem>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speaker-points">Speaker Points Method</Label>
              <Select
                value={settings.speaker_points_method}
                onValueChange={(value) => updateSetting('speaker_points_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (20-30)</SelectItem>
                  <SelectItem value="high_low">High-Low (25-30)</SelectItem>
                  <SelectItem value="percentile">Percentile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-repeat">Max Repeat Opponents</Label>
              <Input
                id="max-repeat"
                type="number"
                min="0"
                max="10"
                value={settings.max_repeat_opponents}
                onChange={(e) => updateSetting('max_repeat_opponents', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="side-balance">Side Balance Target (%)</Label>
              <Input
                id="side-balance"
                type="number"
                min="0"
                max="100"
                value={settings.side_balance_target}
                onChange={(e) => updateSetting('side_balance_target', parseInt(e.target.value) || 50)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pairing Constraints</CardTitle>
          <CardDescription>
            Configure constraints and restrictions for pairing generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Avoid Rematches</Label>
              <p className="text-sm text-muted-foreground">
                Prevent teams from facing the same opponent multiple times
              </p>
            </div>
            <Switch
              checked={settings.avoid_rematches}
              onCheckedChange={(value) => updateSetting('avoid_rematches', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Club Protection</Label>
              <p className="text-sm text-muted-foreground">
                Avoid pairing teams from the same institution
              </p>
            </div>
            <Switch
              checked={settings.club_protect}
              onCheckedChange={(value) => updateSetting('club_protect', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Preserve Break Rounds</Label>
              <p className="text-sm text-muted-foreground">
                Maintain break order for elimination rounds
              </p>
            </div>
            <Switch
              checked={settings.preserve_break_rounds}
              onCheckedChange={(value) => updateSetting('preserve_break_rounds', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Prevent Bracket Breaks</Label>
              <p className="text-sm text-muted-foreground">
                Avoid pairing competitors from different skill brackets
              </p>
            </div>
            <Switch
              checked={settings.prevent_bracket_breaks}
              onCheckedChange={(value) => updateSetting('prevent_bracket_breaks', value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communication Settings</CardTitle>
          <CardDescription>
            Configure judge and participant communication options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Judges to View All Chat</Label>
              <p className="text-sm text-muted-foreground">
                Permit judges to access all tournament chat channels
              </p>
            </div>
            <Switch
              checked={settings.allow_judges_view_all_chat}
              onCheckedChange={(value) => updateSetting('allow_judges_view_all_chat', value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
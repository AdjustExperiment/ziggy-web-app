import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Settings, Save, RotateCcw, Users, Zap, AlertCircle } from 'lucide-react';

interface TabulationSettings {
  id?: string;
  tournament_id: string;
  pairing_method: string;
  draw_method: string;
  side_method: string;
  odd_bracket: string;
  avoid_rematches: boolean;
  club_protect: boolean;
  preserve_break_rounds: boolean;
  prevent_bracket_breaks: boolean;
  max_repeat_opponents: number;
  side_balance_target: number;
  speaker_points_method: string;
  allow_judges_view_all_chat: boolean;
  // New: Optional judge auto-assignment
  auto_judge_assignment: boolean;
  judges_per_room: number;
}

interface TournamentSettings {
  auto_judge_assignment: boolean;
  judges_per_room: number;
}

interface TabulationRulesManagerProps {
  tournamentId: string;
}

export function TabulationRulesManager({ tournamentId }: TabulationRulesManagerProps) {
  const [settings, setSettings] = useState<TabulationSettings>({
    tournament_id: tournamentId,
    pairing_method: 'swiss',
    draw_method: 'power_paired',
    side_method: 'balance',
    odd_bracket: 'pullup_top',
    avoid_rematches: true,
    club_protect: true,
    preserve_break_rounds: true,
    prevent_bracket_breaks: true,
    max_repeat_opponents: 0,
    side_balance_target: 0,
    speaker_points_method: 'sum',
    allow_judges_view_all_chat: false,
    auto_judge_assignment: false,
    judges_per_room: 1,
  });
  const [tournamentSettings, setTournamentSettings] = useState<TournamentSettings>({
    auto_judge_assignment: false,
    judges_per_room: 1,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchSettings();
    }
  }, [tournamentId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Fetch tabulation settings
      const { data: tabSettings, error: tabError } = await supabase
        .from('tournament_tabulation_settings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .maybeSingle();

      if (tabError) throw tabError;

      // Fetch tournament settings for auto-assignment
      const { data: tournament, error: tournError } = await supabase
        .from('tournaments')
        .select('auto_judge_assignment, judges_per_room')
        .eq('id', tournamentId)
        .single();

      if (tournError && tournError.code !== 'PGRST116') throw tournError;

      if (tabSettings) {
        setSettings(prev => ({
          ...prev,
          ...tabSettings,
          auto_judge_assignment: tournament?.auto_judge_assignment ?? false,
          judges_per_room: tournament?.judges_per_room ?? 1,
        }));
      }

      if (tournament) {
        setTournamentSettings({
          auto_judge_assignment: tournament.auto_judge_assignment ?? false,
          judges_per_room: tournament.judges_per_room ?? 1,
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save tabulation settings
      const { error: tabError } = await supabase
        .from('tournament_tabulation_settings')
        .upsert({
          tournament_id: tournamentId,
          pairing_method: settings.pairing_method,
          draw_method: settings.draw_method,
          side_method: settings.side_method,
          odd_bracket: settings.odd_bracket,
          avoid_rematches: settings.avoid_rematches,
          club_protect: settings.club_protect,
          preserve_break_rounds: settings.preserve_break_rounds,
          prevent_bracket_breaks: settings.prevent_bracket_breaks,
          max_repeat_opponents: settings.max_repeat_opponents,
          speaker_points_method: settings.speaker_points_method,
          allow_judges_view_all_chat: settings.allow_judges_view_all_chat,
          side_balance_target: settings.side_balance_target,
        }, { onConflict: 'tournament_id' });

      if (tabError) throw tabError;

      // Save tournament-level auto-assignment settings
      const { error: tournError } = await supabase
        .from('tournaments')
        .update({
          auto_judge_assignment: settings.auto_judge_assignment,
          judges_per_room: settings.judges_per_room,
        })
        .eq('id', tournamentId);

      if (tournError) throw tournError;

      toast({
        title: "Success",
        description: "Tabulation settings saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save tabulation rules",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      tournament_id: tournamentId,
      pairing_method: 'swiss',
      draw_method: 'power_paired',
      side_method: 'balance',
      odd_bracket: 'pullup_top',
      avoid_rematches: true,
      club_protect: true,
      preserve_break_rounds: true,
      prevent_bracket_breaks: true,
      max_repeat_opponents: 0,
      side_balance_target: 0,
      speaker_points_method: 'sum',
      allow_judges_view_all_chat: false,
      auto_judge_assignment: false,
      judges_per_room: 1,
    });
  };

  const updateSetting = (key: keyof TabulationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
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
      {/* Judge Assignment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Judge Assignment
          </CardTitle>
          <CardDescription>
            Configure how judges are assigned to rounds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-judge">Enable Automatic Judge Assignment</Label>
                {settings.auto_judge_assignment && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, admins can auto-assign judges using the allocation algorithm.
                Existing judge requests and volunteer system remain available.
              </p>
            </div>
            <Switch
              id="auto-judge"
              checked={settings.auto_judge_assignment}
              onCheckedChange={(checked) => updateSetting('auto_judge_assignment', checked)}
            />
          </div>

          {settings.auto_judge_assignment && (
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <div>
                <Label>Judges per Room</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={settings.judges_per_room}
                  onChange={(e) => updateSetting('judges_per_room', parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of judges assigned to each pairing (all equally weighted)
                </p>
              </div>
              <div className="flex items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Auto-assignment considers conflicts and availability. 
                  Manual overrides are always possible.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pairing Algorithm */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pairing Algorithm
          </CardTitle>
          <CardDescription>
            Configure tournament pairing algorithms and methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Draw Method</Label>
              <Select
                value={settings.draw_method}
                onValueChange={(value) => updateSetting('draw_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="power_paired">Power Paired (Swiss)</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Side Method</Label>
              <Select
                value={settings.side_method}
                onValueChange={(value) => updateSetting('side_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance">Balance (minimize imbalance)</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="preallocated">Pre-allocated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Odd Bracket Handling</Label>
              <Select
                value={settings.odd_bracket}
                onValueChange={(value) => updateSetting('odd_bracket', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pullup_top">Pull-up Top</SelectItem>
                  <SelectItem value="pullup_bottom">Pull-up Bottom</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="intermediate_bubble_up_down">Bubble Up/Down</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Max Repeat Opponents</Label>
              <Input
                type="number"
                min="0"
                max="5"
                value={settings.max_repeat_opponents}
                onChange={(e) => updateSetting('max_repeat_opponents', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="avoid-rematches">Avoid Rematches</Label>
              <Switch
                id="avoid-rematches"
                checked={settings.avoid_rematches}
                onCheckedChange={(checked) => updateSetting('avoid_rematches', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="club-protect">Club/Institution Protection</Label>
              <Switch
                id="club-protect"
                checked={settings.club_protect}
                onCheckedChange={(checked) => updateSetting('club_protect', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="preserve-break">Preserve Break Rounds</Label>
              <Switch
                id="preserve-break"
                checked={settings.preserve_break_rounds}
                onCheckedChange={(checked) => updateSetting('preserve_break_rounds', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="prevent-bracket">Prevent Bracket Breaking</Label>
              <Switch
                id="prevent-bracket"
                checked={settings.prevent_bracket_breaks}
                onCheckedChange={(checked) => updateSetting('prevent_bracket_breaks', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speaker Points & Scoring */}
      <Card>
        <CardHeader>
          <CardTitle>Speaker Points & Scoring</CardTitle>
          <CardDescription>Configure scoring methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Speaker Points Method</Label>
              <Select
                value={settings.speaker_points_method}
                onValueChange={(value) => updateSetting('speaker_points_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum Total</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="high_low">High-Low Drop</SelectItem>
                  <SelectItem value="median">Median</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Side Balance Target</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={settings.side_balance_target}
                onChange={(e) => updateSetting('side_balance_target', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Judge Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Judge Permissions</CardTitle>
          <CardDescription>Control what judges can access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="judge-chat">Allow Judges to View All Chat</Label>
              <p className="text-sm text-muted-foreground">
                Permits judges to read messages in pairings they're not assigned to
              </p>
            </div>
            <Switch
              id="judge-chat"
              checked={settings.allow_judges_view_all_chat}
              onCheckedChange={(checked) => updateSetting('allow_judges_view_all_chat', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}

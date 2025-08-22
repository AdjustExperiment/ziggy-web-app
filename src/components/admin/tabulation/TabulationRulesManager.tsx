
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Settings, Save, RotateCcw } from 'lucide-react';

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

interface TabulationRulesManagerProps {
  tournamentId: string;
}

export function TabulationRulesManager({ tournamentId }: TabulationRulesManagerProps) {
  const [settings, setSettings] = useState<TabulationSettings>({
    tournament_id: tournamentId,
    pairing_method: 'high_high',
    avoid_rematches: true,
    club_protect: true,
    preserve_break_rounds: true,
    prevent_bracket_breaks: true,
    max_repeat_opponents: 1,
    side_balance_target: 0,
    speaker_points_method: 'sum',
    allow_judges_view_all_chat: false
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
      const { data, error } = await supabase
      .from('tournament_tabulation_settings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error('Error fetching tabulation settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
      .from('tournament_tabulation_settings')
        .upsert({
          ...settings,
          tournament_id: tournamentId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tabulation rules saved successfully",
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
      pairing_method: 'high_high',
      avoid_rematches: true,
      club_protect: true,
      preserve_break_rounds: true,
      prevent_bracket_breaks: true,
      max_repeat_opponents: 1,
      side_balance_target: 0,
      speaker_points_method: 'sum',
      allow_judges_view_all_chat: false
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tabulation Rules
          </CardTitle>
          <CardDescription>
            Configure tournament pairing algorithms and scoring methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pairing Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pairing Algorithm</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pairing Method</Label>
                <Select
                  value={settings.pairing_method}
                  onValueChange={(value) => updateSetting('pairing_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_high">High-High (1v2, 3v4...)</SelectItem>
                    <SelectItem value="high_low">High-Low (1v8, 2v7...)</SelectItem>
                    <SelectItem value="random">Random Pairing</SelectItem>
                    <SelectItem value="swiss">Swiss System</SelectItem>
                    <SelectItem value="power_match">Power Matching</SelectItem>
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
                <Label htmlFor="club-protect">Club Protection</Label>
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
          </div>

          <Separator />

          {/* Speaker Points */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Speaker Points & Scoring</h3>
            
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
          </div>

          <Separator />

          {/* Judge Access */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Judge Permissions</h3>
            
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
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Rules
            </Button>
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

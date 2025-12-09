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
import { Separator } from '@/components/ui/separator';

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
  draw_method: string;
  side_method: string;
  odd_bracket: string;
  pullup_restriction: string;
  history_penalty: number;
  institution_penalty: number;
  side_penalty: number;
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
    draw_method: 'power_paired',
    side_method: 'balance',
    odd_bracket: 'pullup_top',
    pullup_restriction: 'least_to_date',
    history_penalty: 1000,
    institution_penalty: 500,
    side_penalty: 100,
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
        .maybeSingle();

      if (error) throw error;
      if (data) setSettings(prev => ({ ...prev, ...data }));
    } catch (error: any) {
      console.error('Error fetching tabulation settings:', error);
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
      toast({ title: "Settings Saved", description: "Tabulation settings saved successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof TabulationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">Advanced Tabulation</Badge>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Draw Generation</CardTitle>
          <CardDescription>Configure power pairing algorithms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Draw Method</Label>
              <Select value={settings.draw_method} onValueChange={(v) => updateSetting('draw_method', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="power_paired">Power Paired</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Side Allocation</Label>
              <Select value={settings.side_method} onValueChange={(v) => updateSetting('side_method', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance">Balance</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optimization Weights</CardTitle>
          <CardDescription>Fine-tune the Munkres algorithm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>History Penalty</Label>
              <Input type="number" value={settings.history_penalty} onChange={(e) => updateSetting('history_penalty', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Institution Penalty</Label>
              <Input type="number" value={settings.institution_penalty} onChange={(e) => updateSetting('institution_penalty', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Side Penalty</Label>
              <Input type="number" value={settings.side_penalty} onChange={(e) => updateSetting('side_penalty', parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pairing Constraints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><Label>Avoid Rematches</Label><p className="text-sm text-muted-foreground">Prevent repeat opponents</p></div>
            <Switch checked={settings.avoid_rematches} onCheckedChange={(v) => updateSetting('avoid_rematches', v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div><Label>Club Protection</Label><p className="text-sm text-muted-foreground">Avoid same-institution matchups</p></div>
            <Switch checked={settings.club_protect} onCheckedChange={(v) => updateSetting('club_protect', v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
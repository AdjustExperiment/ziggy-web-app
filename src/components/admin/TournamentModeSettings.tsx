import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Zap, Clock, Shuffle, MapPin, Wifi, Users, Calendar, Gavel } from 'lucide-react';

interface TournamentModeSettingsProps {
  tournamentId: string;
}

interface TournamentModeData {
  tournament_type: 'live_paced' | 'long_form' | 'hybrid';
  is_online: boolean;
  judge_requests_enabled: boolean;
  schedule_proposals_enabled: boolean;
  venue_management_enabled: boolean;
}

export function TournamentModeSettings({ tournamentId }: TournamentModeSettingsProps) {
  const [settings, setSettings] = useState<TournamentModeData>({
    tournament_type: 'long_form',
    is_online: true,
    judge_requests_enabled: true,
    schedule_proposals_enabled: true,
    venue_management_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [tournamentId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('tournament_type, is_online, judge_requests_enabled, schedule_proposals_enabled, venue_management_enabled')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          tournament_type: data.tournament_type as TournamentModeData['tournament_type'],
          is_online: data.is_online ?? true,
          judge_requests_enabled: data.judge_requests_enabled ?? true,
          schedule_proposals_enabled: data.schedule_proposals_enabled ?? true,
          venue_management_enabled: data.venue_management_enabled ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching tournament mode settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('tournaments')
        .update(settings)
        .eq('id', tournamentId);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Tournament mode settings have been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = (type: TournamentModeData['tournament_type']) => {
    // Apply presets based on tournament type
    if (type === 'live_paced') {
      setSettings({
        ...settings,
        tournament_type: type,
        judge_requests_enabled: false,
        schedule_proposals_enabled: false,
      });
    } else if (type === 'long_form') {
      setSettings({
        ...settings,
        tournament_type: type,
        judge_requests_enabled: true,
        schedule_proposals_enabled: true,
      });
    } else {
      setSettings({
        ...settings,
        tournament_type: type,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Tournament Pacing
          </CardTitle>
          <CardDescription>
            Choose how rounds are scheduled and managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={settings.tournament_type}
            onValueChange={(value) => handleTypeChange(value as TournamentModeData['tournament_type'])}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="relative">
              <RadioGroupItem value="live_paced" id="live_paced" className="peer sr-only" />
              <Label
                htmlFor="live_paced"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Zap className="h-6 w-6 mb-2 text-amber-500" />
                <span className="font-medium">Live-Paced</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Fixed schedule, all rounds run back-to-back
                </span>
              </Label>
            </div>

            <div className="relative">
              <RadioGroupItem value="long_form" id="long_form" className="peer sr-only" />
              <Label
                htmlFor="long_form"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Clock className="h-6 w-6 mb-2 text-blue-500" />
                <span className="font-medium">Long-Form</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Flexible scheduling, debaters coordinate times
                </span>
              </Label>
            </div>

            <div className="relative">
              <RadioGroupItem value="hybrid" id="hybrid" className="peer sr-only" />
              <Label
                htmlFor="hybrid"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Shuffle className="h-6 w-6 mb-2 text-purple-500" />
                <span className="font-medium">Hybrid</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Mix of fixed and flexible rounds
                </span>
              </Label>
            </div>
          </RadioGroup>

          {settings.tournament_type === 'live_paced' && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
              <p className="text-amber-800 dark:text-amber-200">
                <strong>Live-Paced Mode:</strong> Judge requests and schedule proposals are disabled. 
                Admins control all scheduling and judge assignments.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Tournament Location
          </CardTitle>
          <CardDescription>
            Specify whether this is an online or in-person tournament
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.is_online ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <MapPin className="h-5 w-5 text-blue-500" />
              )}
              <div>
                <Label htmlFor="is_online" className="text-base">
                  {settings.is_online ? 'Online Tournament' : 'In-Person Tournament'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {settings.is_online 
                    ? 'Rounds conducted via video conferencing'
                    : 'Rounds conducted at a physical venue'
                  }
                </p>
              </div>
            </div>
            <Switch
              id="is_online"
              checked={settings.is_online}
              onCheckedChange={(checked) => setSettings({ 
                ...settings, 
                is_online: checked,
                venue_management_enabled: checked ? false : settings.venue_management_enabled 
              })}
            />
          </div>

          {!settings.is_online && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="venue_management" className="text-base">
                    Enable Venue Management
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Track rooms, buildings, and assign venues to pairings
                  </p>
                </div>
              </div>
              <Switch
                id="venue_management"
                checked={settings.venue_management_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, venue_management_enabled: checked })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Debater Features
          </CardTitle>
          <CardDescription>
            Control what features are available to debaters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gavel className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="judge_requests" className="text-base">
                  Judge Requests
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow debaters to request specific judges
                </p>
              </div>
            </div>
            <Switch
              id="judge_requests"
              checked={settings.judge_requests_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, judge_requests_enabled: checked })}
              disabled={settings.tournament_type === 'live_paced'}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="schedule_proposals" className="text-base">
                  Schedule Proposals
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow debaters to propose round times
                </p>
              </div>
            </div>
            <Switch
              id="schedule_proposals"
              checked={settings.schedule_proposals_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, schedule_proposals_enabled: checked })}
              disabled={settings.tournament_type === 'live_paced'}
            />
          </div>

          {settings.tournament_type === 'live_paced' && (
            <p className="text-sm text-muted-foreground italic mt-2">
              These features are automatically disabled for live-paced tournaments
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

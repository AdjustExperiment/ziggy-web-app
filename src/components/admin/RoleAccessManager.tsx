import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const ROLES = ['judge', 'observer', 'participant'];

interface RoleAccess {
  role: string;
  can_view_pairings: boolean;
  can_view_rooms: boolean;
  can_view_stream: boolean;
  can_chat: boolean;
}

export function RoleAccessManager() {
  const [settings, setSettings] = useState<RoleAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('role_access_settings')
        .select('*');

      if (error) throw error;

      const merged = ROLES.map(role => (
        data?.find((s: any) => s.role === role) || {
          role,
          can_view_pairings: false,
          can_view_rooms: false,
          can_view_stream: false,
          can_chat: false,
        }
      ));

      setSettings(merged);
    } catch (error: any) {
      console.error('Error fetching role access settings:', error);
      toast({ title: 'Error', description: 'Failed to load role access settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (role: string, key: keyof RoleAccess, value: boolean) => {
    setSettings(prev => prev.map(s => s.role === role ? { ...s, [key]: value } : s));
  };

  const saveSettings = async () => {
    try {
      const { error } = await supabase.from('role_access_settings').upsert(settings);
      if (error) throw error;
      toast({ title: 'Success', description: 'Role access updated' });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Access Control</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings.map(setting => (
          <div key={setting.role} className="space-y-2">
            <h3 className="font-medium capitalize">{setting.role}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${setting.role}-pairings`}
                  checked={setting.can_view_pairings}
                  onCheckedChange={val => updateSetting(setting.role, 'can_view_pairings', val)}
                />
                <Label htmlFor={`${setting.role}-pairings`}>Pairings</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${setting.role}-rooms`}
                  checked={setting.can_view_rooms}
                  onCheckedChange={val => updateSetting(setting.role, 'can_view_rooms', val)}
                />
                <Label htmlFor={`${setting.role}-rooms`}>Rooms</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${setting.role}-stream`}
                  checked={setting.can_view_stream}
                  onCheckedChange={val => updateSetting(setting.role, 'can_view_stream', val)}
                />
                <Label htmlFor={`${setting.role}-stream`}>Stream</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${setting.role}-chat`}
                  checked={setting.can_chat}
                  onCheckedChange={val => updateSetting(setting.role, 'can_chat', val)}
                />
                <Label htmlFor={`${setting.role}-chat`}>Chat</Label>
              </div>
            </div>
          </div>
        ))}
        <Button onClick={saveSettings}>Save Changes</Button>
      </CardContent>
    </Card>
  );
}


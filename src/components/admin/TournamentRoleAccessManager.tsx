import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface TournamentRoleAccess {
  id: string;
  tournament_id: string;
  role: string;
  can_view_pairings: boolean;
  can_view_rooms: boolean;
  can_view_stream: boolean;
  can_chat: boolean;
}

interface TournamentRoleAccessManagerProps {
  tournamentId: string;
}

export function TournamentRoleAccessManager({ tournamentId }: TournamentRoleAccessManagerProps) {
  const [settings, setSettings] = useState<TournamentRoleAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultRoles = ['admin', 'judge', 'participant', 'observer', 'user'];

  useEffect(() => {
    if (tournamentId) {
      fetchSettings();
    }
  }, [tournamentId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_role_access')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (error) throw error;

      // Create default settings for missing roles
      const existingRoles = data?.map(d => d.role) || [];
      const missingRoles = defaultRoles.filter(role => !existingRoles.includes(role));
      
      const defaultSettings = missingRoles.map(role => ({
        id: `temp-${role}`,
        tournament_id: tournamentId,
        role,
        can_view_pairings: role === 'admin' || role === 'judge' || role === 'participant',
        can_view_rooms: role === 'admin' || role === 'judge',
        can_view_stream: true,
        can_chat: role !== 'observer'
      }));

      setSettings([...(data || []), ...defaultSettings]);
    } catch (error: any) {
      console.error('Error fetching tournament role access:', error);
      toast({
        title: "Error",
        description: "Failed to load role access settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (role: string, permission: string, value: boolean) => {
    try {
      const existingSetting = settings.find(s => s.role === role && !s.id.startsWith('temp-'));
      
      if (existingSetting) {
        // Update existing setting
        const { error } = await supabase
          .from('tournament_role_access')
          .update({ [permission]: value })
          .eq('id', existingSetting.id);

        if (error) throw error;
      } else {
        // Create new setting
        const { error } = await supabase
          .from('tournament_role_access')
          .insert({
            tournament_id: tournamentId,
            role,
            can_view_pairings: role === 'participant' ? true : permission === 'can_view_pairings' ? value : false,
            can_view_rooms: role === 'admin' || role === 'judge' ? true : permission === 'can_view_rooms' ? value : false,
            can_view_stream: true,
            can_chat: permission === 'can_chat' ? value : role !== 'observer',
            [permission]: value
          });

        if (error) throw error;
      }

      // Update local state
      setSettings(prev => prev.map(setting => 
        setting.role === role 
          ? { ...setting, [permission]: value }
          : setting
      ));

      toast({
        title: "Permission Updated",
        description: `Role access for ${role} has been updated.`,
      });

      // Refresh settings to get updated data
      await fetchSettings();
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      });
    }
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
          <CardTitle>Tournament-Specific Role Permissions</CardTitle>
          <CardDescription>
            Configure what different user roles can access for this tournament
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>View Pairings</TableHead>
                <TableHead>View Rooms</TableHead>
                <TableHead>View Stream</TableHead>
                <TableHead>Chat Access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((setting) => (
                <TableRow key={`${setting.tournament_id}-${setting.role}`}>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {setting.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={setting.can_view_pairings}
                      onCheckedChange={(value) => 
                        handlePermissionChange(setting.role, 'can_view_pairings', value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={setting.can_view_rooms}
                      onCheckedChange={(value) => 
                        handlePermissionChange(setting.role, 'can_view_rooms', value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={setting.can_view_stream}
                      onCheckedChange={(value) => 
                        handlePermissionChange(setting.role, 'can_view_stream', value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={setting.can_chat}
                      onCheckedChange={(value) => 
                        handlePermissionChange(setting.role, 'can_chat', value)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
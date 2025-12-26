import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoleAccess {
  id: string;
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
        .from('global_role_access')
        .select('*')
        .order('role');
      
      if (error) {
        console.error('Error fetching role access settings:', error);
        toast({
          title: "Error",
          description: "Failed to load role access settings",
          variant: "destructive",
        });
        return;
      }
      
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (settingId: string, permission: string, value: boolean) => {
    // Optimistic update
    setSettings(prev => prev.map(setting => 
      setting.id === settingId 
        ? { ...setting, [permission]: value }
        : setting
    ));

    const { error } = await supabase
      .from('global_role_access')
      .update({ 
        [permission]: value,
        updated_at: new Date().toISOString()
      })
      .eq('id', settingId);

    if (error) {
      console.error('Error updating permission:', error);
      // Revert optimistic update
      fetchSettings();
      toast({
        title: "Error",
        description: "Failed to update permission. Admin access required.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Permission Updated",
      description: "Role access settings have been saved.",
    });
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
        <div>
          <h2 className="text-2xl font-bold">Global Role Access Manager</h2>
          <p className="text-muted-foreground">Manage default permissions for different user roles across the platform</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Configure what different user roles can access in the live dashboard by default.
            Tournament-specific overrides can be set in{' '}
            <Link to="/admin?tab=tournaments" className="text-primary underline hover:no-underline">
              Tournament Settings
            </Link>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No role settings found. Contact an administrator to initialize default roles.
            </p>
          ) : (
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
                  <TableRow key={setting.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {setting.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={setting.can_view_pairings}
                        onCheckedChange={(value) => 
                          handlePermissionChange(setting.id, 'can_view_pairings', value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={setting.can_view_rooms}
                        onCheckedChange={(value) => 
                          handlePermissionChange(setting.id, 'can_view_rooms', value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={setting.can_view_stream}
                        onCheckedChange={(value) => 
                          handlePermissionChange(setting.id, 'can_view_stream', value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={setting.can_chat}
                        onCheckedChange={(value) => 
                          handlePermissionChange(setting.id, 'can_chat', value)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

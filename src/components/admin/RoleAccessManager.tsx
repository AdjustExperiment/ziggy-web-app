import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
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
    // Initialize with default role permissions since table doesn't exist yet
    const defaultSettings: RoleAccess[] = [
      {
        id: '1',
        role: 'admin',
        can_view_pairings: true,
        can_view_rooms: true,
        can_view_stream: true,
        can_chat: true
      },
      {
        id: '2',
        role: 'judge',
        can_view_pairings: true,
        can_view_rooms: true,
        can_view_stream: true,
        can_chat: true
      },
      {
        id: '3',
        role: 'participant',
        can_view_pairings: true,
        can_view_rooms: false,
        can_view_stream: true,
        can_chat: true
      },
      {
        id: '4',
        role: 'observer',
        can_view_pairings: false,
        can_view_rooms: false,
        can_view_stream: true,
        can_chat: false
      },
      {
        id: '5',
        role: 'user',
        can_view_pairings: false,
        can_view_rooms: false,
        can_view_stream: true,
        can_chat: false
      }
    ];
    setSettings(defaultSettings);
    setLoading(false);
  }, []);

  const handlePermissionChange = async (settingId: string, permission: string, value: boolean) => {
    // Update local state for demonstration
    setSettings(prev => prev.map(setting => 
      setting.id === settingId 
        ? { ...setting, [permission]: value }
        : setting
    ));

    toast({
      title: "Permission Updated",
      description: "Role access settings have been updated (demo mode).",
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
      <div>
        <h2 className="text-2xl font-bold">Role Access Manager</h2>
        <p className="text-muted-foreground">Manage permissions for different user roles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Configure what different user roles can access in the live dashboard
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
        </CardContent>
      </Card>

      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">Demo Mode</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          This panel is for demonstration only. Changes are stored locally and will not persist across sessions.
          For tournament-specific role access, use the{' '}
          <Link to="/admin?tab=tournaments" className="underline hover:no-underline">
            Tournament Role Access Manager
          </Link>{' '}
          within each tournament's settings.
        </AlertDescription>
      </Alert>
    </div>
  );
}
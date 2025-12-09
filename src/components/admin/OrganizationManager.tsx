import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Plus, Building, Users, Trash2, UserPlus, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  contact_email: string | null;
  logo_url: string | null;
  created_at: string;
}

interface OrganizationAdmin {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  granted_at: string;
  user_email?: string;
  user_name?: string;
}

interface TournamentAdmin {
  id: string;
  user_id: string;
  tournament_id: string;
  granted_at: string;
  user_email?: string;
  user_name?: string;
  tournament_name?: string;
}

export function OrganizationManager() {
  const { user } = useOptimizedAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgAdmins, setOrgAdmins] = useState<OrganizationAdmin[]>([]);
  const [tournamentAdmins, setTournamentAdmins] = useState<TournamentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [showAddTournamentAdminDialog, setShowAddTournamentAdminDialog] = useState(false);
  const [tournaments, setTournaments] = useState<{ id: string; name: string }[]>([]);

  const [newOrg, setNewOrg] = useState({
    name: '',
    slug: '',
    description: '',
    contact_email: '',
  });

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'owner'>('admin');
  const [newTournamentAdminEmail, setNewTournamentAdminEmail] = useState('');
  const [selectedTournamentId, setSelectedTournamentId] = useState('');

  useEffect(() => {
    fetchOrganizations();
    fetchTournaments();
    fetchAllTournamentAdmins();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      fetchOrgAdmins(selectedOrg.id);
    }
  }, [selectedOrg]);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast({ title: 'Error', description: 'Failed to load organizations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTournaments = async () => {
    const { data } = await supabase
      .from('tournaments')
      .select('id, name')
      .order('name');
    setTournaments(data || []);
  };

  const fetchOrgAdmins = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_admins')
        .select('*')
        .eq('organization_id', orgId);

      if (error) throw error;

      // Fetch user details for each admin
      const adminsWithDetails = await Promise.all(
        (data || []).map(async (admin) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', admin.user_id)
            .single();

          return {
            ...admin,
            user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown',
          };
        })
      );

      setOrgAdmins(adminsWithDetails);
    } catch (error: any) {
      console.error('Error fetching org admins:', error);
    }
  };

  const fetchAllTournamentAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_admins')
        .select(`
          *,
          tournaments!inner(name)
        `);

      if (error) throw error;

      const adminsWithDetails = await Promise.all(
        (data || []).map(async (admin) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', admin.user_id)
            .single();

          return {
            ...admin,
            user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown',
            tournament_name: (admin.tournaments as any)?.name || 'Unknown',
          };
        })
      );

      setTournamentAdmins(adminsWithDetails);
    } catch (error: any) {
      console.error('Error fetching tournament admins:', error);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrg.name || !newOrg.slug) {
      toast({ title: 'Error', description: 'Name and slug are required', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .insert({
          name: newOrg.name,
          slug: newOrg.slug.toLowerCase().replace(/\s+/g, '-'),
          description: newOrg.description || null,
          contact_email: newOrg.contact_email || null,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Organization created' });
      setShowCreateDialog(false);
      setNewOrg({ name: '', slug: '', description: '', contact_email: '' });
      fetchOrganizations();
    } catch (error: any) {
      console.error('Error creating org:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddOrgAdmin = async () => {
    if (!selectedOrg || !newAdminEmail) return;

    try {
      // Look up user by email using edge function
      const { data: userData, error: lookupError } = await supabase.functions.invoke('lookup-user-by-email', {
        body: { email: newAdminEmail }
      });

      if (lookupError || !userData?.user_id) {
        toast({ title: 'Error', description: 'User not found with that email', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('organization_admins')
        .insert({
          organization_id: selectedOrg.id,
          user_id: userData.user_id,
          role: newAdminRole,
          granted_by: user?.id,
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Admin added to organization' });
      setShowAddAdminDialog(false);
      setNewAdminEmail('');
      fetchOrgAdmins(selectedOrg.id);
    } catch (error: any) {
      console.error('Error adding org admin:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddTournamentAdmin = async () => {
    if (!selectedTournamentId || !newTournamentAdminEmail) return;

    try {
      const { data: userData, error: lookupError } = await supabase.functions.invoke('lookup-user-by-email', {
        body: { email: newTournamentAdminEmail }
      });

      if (lookupError || !userData?.user_id) {
        toast({ title: 'Error', description: 'User not found with that email', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('tournament_admins')
        .insert({
          tournament_id: selectedTournamentId,
          user_id: userData.user_id,
          granted_by: user?.id,
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Tournament admin added' });
      setShowAddTournamentAdminDialog(false);
      setNewTournamentAdminEmail('');
      setSelectedTournamentId('');
      fetchAllTournamentAdmins();
    } catch (error: any) {
      console.error('Error adding tournament admin:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleRemoveOrgAdmin = async (adminId: string) => {
    try {
      const { error } = await supabase
        .from('organization_admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Admin removed' });
      if (selectedOrg) fetchOrgAdmins(selectedOrg.id);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleRemoveTournamentAdmin = async (adminId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Tournament admin removed' });
      fetchAllTournamentAdmins();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Access Management</h2>
          <p className="text-muted-foreground">Manage organizations and delegate admin access</p>
        </div>
      </div>

      <Tabs defaultValue="organizations">
        <TabsList>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="tournament-admins" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Tournament Admins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Organization</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                      placeholder="Organization Name"
                    />
                  </div>
                  <div>
                    <Label>Slug (URL-friendly)</Label>
                    <Input
                      value={newOrg.slug}
                      onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                      placeholder="organization-slug"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newOrg.description}
                      onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={newOrg.contact_email}
                      onChange={(e) => setNewOrg({ ...newOrg, contact_email: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateOrg}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className={`cursor-pointer transition-colors ${selectedOrg?.id === org.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedOrg(org)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {org.name}
                  </CardTitle>
                  <CardDescription>{org.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{org.contact_email || 'No contact email'}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedOrg && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {selectedOrg.name} Admins
                  </CardTitle>
                  <CardDescription>Manage who can administer this organization's tournaments</CardDescription>
                </div>
                <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Organization Admin</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>User Email</Label>
                        <Input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="user@example.com"
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select value={newAdminRole} onValueChange={(v) => setNewAdminRole(v as 'admin' | 'owner')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddAdminDialog(false)}>Cancel</Button>
                      <Button onClick={handleAddOrgAdmin}>Add</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>{admin.user_name}</TableCell>
                        <TableCell>
                          <Badge variant={admin.role === 'owner' ? 'default' : 'secondary'}>
                            {admin.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(admin.granted_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOrgAdmin(admin.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {orgAdmins.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No admins assigned
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tournament-admins" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={showAddTournamentAdminDialog} onOpenChange={setShowAddTournamentAdminDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Tournament Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tournament Admin</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tournament</Label>
                    <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tournament..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tournaments.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>User Email</Label>
                    <Input
                      type="email"
                      value={newTournamentAdminEmail}
                      onChange={(e) => setNewTournamentAdminEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddTournamentAdminDialog(false)}>Cancel</Button>
                  <Button onClick={handleAddTournamentAdmin}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Tournament Admins</CardTitle>
              <CardDescription>Users with direct tournament admin access</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournamentAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>{admin.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{admin.tournament_name}</Badge>
                      </TableCell>
                      <TableCell>{new Date(admin.granted_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTournamentAdmin(admin.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tournamentAdmins.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No tournament admins assigned
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

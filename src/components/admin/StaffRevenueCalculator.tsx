
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Calculator, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface Tournament {
  id: string;
  name: string;
  registration_fee: number;
}

interface AdminProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface StaffShare {
  id: string;
  tournament_id: string;
  admin_user_id: string;
  percentage: number;
  active: boolean;
  admin_name?: string;
  admin_email?: string;
}

interface RevenueStats {
  totalRevenue: number;
  totalRegistrations: number;
}

export function StaffRevenueCalculator() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>([]);
  const [staffShares, setStaffShares] = useState<StaffShare[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({ totalRevenue: 0, totalRegistrations: 0 });
  const [loading, setLoading] = useState(true);
  const [newShare, setNewShare] = useState({
    admin_user_id: '',
    percentage: 0
  });

  useEffect(() => {
    fetchTournaments();
    fetchAdminProfiles();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchStaffShares();
      fetchRevenueStats();
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, registration_fee')
        .order('name');

      if (error) throw error;
      setTournaments(data || []);
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('role', 'admin');

      if (error) throw error;

      // Get emails from auth.users via RPC or service role function
      const profiles = data?.map(profile => ({
        ...profile,
        email: `${profile.first_name?.toLowerCase()}.${profile.last_name?.toLowerCase()}@domain.com` // Placeholder
      })) || [];
      
      setAdminProfiles(profiles);
    } catch (error: any) {
      console.error('Error fetching admin profiles:', error);
    }
  };

  const fetchStaffShares = async () => {
    if (!selectedTournament) return;

    try {
      const { data, error } = await supabase
        .from('tournament_staff_shares')
        .select(`
          *,
          profiles!tournament_staff_shares_admin_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('tournament_id', selectedTournament)
        .eq('active', true);

      if (error) throw error;

      const sharesWithNames = data?.map(share => ({
        ...share,
        admin_name: 'Admin User'
      })) || [];

      setStaffShares(sharesWithNames);
    } catch (error: any) {
      console.error('Error fetching staff shares:', error);
    }
  };

  const fetchRevenueStats = async () => {
    if (!selectedTournament) return;

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('amount_paid, payment_status')
        .eq('tournament_id', selectedTournament)
        .eq('payment_status', 'paid');

      if (error) throw error;

      const totalRevenue = data?.reduce((sum, reg) => sum + (reg.amount_paid || 0), 0) || 0;
      const totalRegistrations = data?.length || 0;

      setRevenueStats({ totalRevenue, totalRegistrations });
    } catch (error: any) {
      console.error('Error fetching revenue stats:', error);
    }
  };

  const handleAddShare = async () => {
    if (!selectedTournament || !newShare.admin_user_id || newShare.percentage <= 0) {
      toast({
        title: "Error",
        description: "Please select an admin and set a percentage greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Check total percentage doesn't exceed 100%
    const currentTotal = staffShares.reduce((sum, share) => sum + share.percentage, 0);
    if (currentTotal + newShare.percentage > 100) {
      toast({
        title: "Error",
        description: `Total percentage cannot exceed 100%. Current total: ${currentTotal}%`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tournament_staff_shares')
        .insert([{
          tournament_id: selectedTournament,
          admin_user_id: newShare.admin_user_id,
          percentage: newShare.percentage,
          active: true
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff share added successfully",
      });

      setNewShare({ admin_user_id: '', percentage: 0 });
      fetchStaffShares();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add staff share",
        variant: "destructive",
      });
    }
  };

  const handleUpdateShare = async (shareId: string, newPercentage: number) => {
    try {
      const { error } = await supabase
        .from('tournament_staff_shares')
        .update({ percentage: newPercentage })
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff share updated successfully",
      });

      fetchStaffShares();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update staff share",
        variant: "destructive",
      });
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_staff_shares')
        .update({ active: false })
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff share removed successfully",
      });

      fetchStaffShares();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove staff share",
        variant: "destructive",
      });
    }
  };

  const totalPercentage = staffShares.reduce((sum, share) => sum + share.percentage, 0);
  const remainingPercentage = Math.max(0, 100 - totalPercentage);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-6 w-6" />
        <div>
          <h2 className="text-2xl font-bold">Staff Revenue Calculator</h2>
          <p className="text-muted-foreground">Calculate revenue shares for tournament staff</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Selection</CardTitle>
            <CardDescription>Select a tournament to calculate staff revenue shares</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tournament">Tournament</Label>
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tournament..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTournament && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-sm font-medium">Total Revenue</div>
                      <div className="text-lg font-bold">${revenueStats.totalRevenue.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium">Paid Registrations</div>
                      <div className="text-lg font-bold">{revenueStats.totalRegistrations}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium">Distributed</div>
                      <div className="text-lg font-bold">{totalPercentage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedTournament && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Add Staff Member</CardTitle>
                <CardDescription>Add a new admin to receive revenue share</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <Label htmlFor="admin">Admin Staff Member</Label>
                    <Select value={newShare.admin_user_id} onValueChange={(value) => setNewShare({...newShare, admin_user_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select admin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {adminProfiles
                          .filter(admin => !staffShares.find(share => share.admin_user_id === admin.user_id))
                          .map((admin) => (
                          <SelectItem key={admin.user_id} value={admin.user_id}>
                            {admin.first_name} {admin.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Percentage Share (Available: {remainingPercentage.toFixed(1)}%)</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[newShare.percentage]}
                        onValueChange={(value) => setNewShare({...newShare, percentage: value[0]})}
                        max={remainingPercentage}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-center text-sm font-medium">
                        {newShare.percentage.toFixed(1)}% = ${((revenueStats.totalRevenue * newShare.percentage) / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={handleAddShare} disabled={!newShare.admin_user_id || newShare.percentage <= 0}>
                    Add Staff Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Staff Shares</CardTitle>
                <CardDescription>Revenue distribution for selected tournament</CardDescription>
              </CardHeader>
              <CardContent>
                {staffShares.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No staff shares configured for this tournament
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Share Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffShares.map((share) => (
                        <TableRow key={share.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{share.admin_name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {share.percentage.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              ${((revenueStats.totalRevenue * share.percentage) / 100).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveShare(share.id)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

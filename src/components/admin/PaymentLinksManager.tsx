import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Edit } from 'lucide-react';

interface PaymentLink {
  id: string;
  tournament_id: string | null;
  provider: 'paypal' | 'venmo';
  link_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Tournament {
  id: string;
  name: string;
}

const PaymentLinksManager = () => {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<PaymentLink | null>(null);
  const [formData, setFormData] = useState({
    tournament_id: 'global',
    provider: 'paypal' as 'paypal' | 'venmo',
    link_url: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentLinks();
    fetchTournaments();
  }, []);

  const fetchPaymentLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentLinks((data || []) as PaymentLink[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch payment links",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        tournament_id: formData.tournament_id === 'global' ? null : formData.tournament_id
      };

      if (editingLink) {
        const { error } = await supabase
          .from('payment_links')
          .update(submitData)
          .eq('id', editingLink.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Payment link updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('payment_links')
          .insert([submitData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Payment link created successfully",
        });
      }

      resetForm();
      fetchPaymentLinks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save payment link",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (link: PaymentLink) => {
    setEditingLink(link);
    setFormData({
      tournament_id: link.tournament_id || 'global',
      provider: link.provider,
      link_url: link.link_url,
      is_active: link.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Payment link deleted successfully",
      });
      fetchPaymentLinks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete payment link",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      tournament_id: 'global',
      provider: 'paypal',
      link_url: '',
      is_active: true
    });
    setEditingLink(null);
    setDialogOpen(false);
  };

  const getTournamentName = (tournamentId: string | null) => {
    if (!tournamentId) return 'Global';
    const tournament = tournaments.find(t => t.id === tournamentId);
    return tournament?.name || 'Unknown Tournament';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Payment Links Management
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingLink ? 'Edit Payment Link' : 'Add Payment Link'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="tournament_id">Tournament (leave blank for global)</Label>
                  <Select 
                    value={formData.tournament_id} 
                    onValueChange={(value) => setFormData({ ...formData, tournament_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tournament (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global (All Tournaments)</SelectItem>
                      {tournaments.map((tournament) => (
                        <SelectItem key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Select 
                    value={formData.provider} 
                    onValueChange={(value: 'paypal' | 'venmo') => setFormData({ ...formData, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="venmo">Venmo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="link_url">Payment Link URL</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://paypal.me/username or https://venmo.com/username"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingLink ? 'Update' : 'Create'} Payment Link
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tournament</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Link URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentLinks.map((link) => (
              <TableRow key={link.id}>
                <TableCell>{getTournamentName(link.tournament_id)}</TableCell>
                <TableCell className="capitalize">{link.provider}</TableCell>
                <TableCell className="max-w-xs truncate">{link.link_url}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    link.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {link.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(link)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {paymentLinks.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No payment links configured
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PaymentLinksManager;
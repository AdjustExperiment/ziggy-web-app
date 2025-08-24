
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Percent, DollarSign } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface PromoCode {
  id: string;
  code: string;
  tournament_id: string;
  discount_type: string;
  discount_value: number;
  max_redemptions: number | null;
  per_user_limit: number;
  allowed_user_ids: string[];
  allowed_emails: string[];
  valid_from: string | null;
  valid_to: string | null;
  active: boolean;
  created_at: string;
}

interface Tournament {
  id: string;
  name: string;
}

export function PromoCodesManager() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: '',
    tournament_id: '',
    discount_type: 'percent',
    discount_value: 0,
    max_redemptions: '',
    per_user_limit: 1,
    allowed_emails: '',
    valid_from: '',
    valid_to: '',
    active: true
  });

  useEffect(() => {
    fetchPromoCodes();
    fetchTournaments();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch promo codes",
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
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const promoData = {
        code: formData.code.toUpperCase(),
        tournament_id: formData.tournament_id || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions) : null,
        per_user_limit: formData.per_user_limit,
        allowed_emails: formData.allowed_emails ? formData.allowed_emails.split(',').map(e => e.trim()) : [],
        valid_from: formData.valid_from || null,
        valid_to: formData.valid_to || null,
        active: formData.active
      };

      if (editingCode) {
        const { error } = await supabase
          .from('promo_codes')
          .update(promoData)
          .eq('id', editingCode.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Promo code updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('promo_codes')
          .insert([promoData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Promo code created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save promo code",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      tournament_id: '',
      discount_type: 'percent',
      discount_value: 0,
      max_redemptions: '',
      per_user_limit: 1,
      allowed_emails: '',
      valid_from: '',
      valid_to: '',
      active: true
    });
    setEditingCode(null);
  };

  const handleEdit = (promoCode: PromoCode) => {
    setEditingCode(promoCode);
    setFormData({
      code: promoCode.code,
      tournament_id: promoCode.tournament_id || '',
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      max_redemptions: promoCode.max_redemptions?.toString() || '',
      per_user_limit: promoCode.per_user_limit,
      allowed_emails: promoCode.allowed_emails.join(', '),
      valid_from: promoCode.valid_from || '',
      valid_to: promoCode.valid_to || '',
      active: promoCode.active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Promo code deleted successfully",
      });

      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete promo code",
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promo Codes</h2>
          <p className="text-muted-foreground">Manage discount codes for tournament registrations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCode ? 'Edit' : 'Create'} Promo Code</DialogTitle>
              <DialogDescription>
                {editingCode ? 'Update the promo code details' : 'Create a new promo code for tournaments'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Promo Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="SAVE20"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="tournament">Tournament (Optional)</Label>
                  <Select value={formData.tournament_id} onValueChange={(value) => setFormData({...formData, tournament_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All tournaments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All tournaments</SelectItem>
                      {tournaments.map((tournament) => (
                        <SelectItem key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type *</Label>
                  <Select value={formData.discount_type} onValueChange={(value) => setFormData({...formData, discount_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">
                        <div className="flex items-center">
                          <Percent className="h-4 w-4 mr-2" />
                          Percentage
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Fixed Amount
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="discount_value">
                    Discount Value * {formData.discount_type === 'percent' ? '(%)' : '($)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    max={formData.discount_type === 'percent' ? 100 : undefined}
                    step={formData.discount_type === 'percent' ? 1 : 0.01}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_redemptions">Max Total Uses</Label>
                  <Input
                    id="max_redemptions"
                    type="number"
                    min="1"
                    value={formData.max_redemptions}
                    onChange={(e) => setFormData({...formData, max_redemptions: e.target.value})}
                    placeholder="Unlimited"
                  />
                </div>
                
                <div>
                  <Label htmlFor="per_user_limit">Uses Per User</Label>
                  <Input
                    id="per_user_limit"
                    type="number"
                    min="1"
                    value={formData.per_user_limit}
                    onChange={(e) => setFormData({...formData, per_user_limit: parseInt(e.target.value) || 1})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="allowed_emails">Allowed Emails (comma separated)</Label>
                <Textarea
                  id="allowed_emails"
                  value={formData.allowed_emails}
                  onChange={(e) => setFormData({...formData, allowed_emails: e.target.value})}
                  placeholder="user1@example.com, user2@example.com"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="datetime-local"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="valid_to">Valid To</Label>
                  <Input
                    id="valid_to"
                    type="datetime-local"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({...formData, valid_to: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                />
                <Label htmlFor="active">Active</Label>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCode ? 'Update' : 'Create'} Promo Code
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promo Codes</CardTitle>
          <CardDescription>Manage discount codes for tournament registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Tournament</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage Limits</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((promoCode) => (
                <TableRow key={promoCode.id}>
                  <TableCell>
                    <code className="px-2 py-1 bg-muted rounded font-mono text-sm">
                      {promoCode.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    {tournaments.find(t => t.id === promoCode.tournament_id)?.name || 'All tournaments'}
                  </TableCell>
                  <TableCell>
                    {promoCode.discount_type === 'percent' 
                      ? `${promoCode.discount_value}%`
                      : `$${promoCode.discount_value}`
                    }
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Max: {promoCode.max_redemptions || 'Unlimited'}</div>
                      <div>Per user: {promoCode.per_user_limit}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {promoCode.valid_from && <div>From: {new Date(promoCode.valid_from).toLocaleDateString()}</div>}
                      {promoCode.valid_to && <div>To: {new Date(promoCode.valid_to).toLocaleDateString()}</div>}
                      {!promoCode.valid_from && !promoCode.valid_to && 'No limits'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={promoCode.active ? 'default' : 'secondary'}>
                      {promoCode.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(promoCode)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(promoCode.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

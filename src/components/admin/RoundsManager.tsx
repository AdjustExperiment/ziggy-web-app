
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit2, Trash2, Clock, Play, Pause } from 'lucide-react';
import { Round } from '@/types/database';

interface Tournament {
  id: string;
  name: string;
}

export function RoundsManager() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [formData, setFormData] = useState({
    tournament_id: '',
    name: '',
    round_number: 1,
    status: 'pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch tournaments
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, name')
        .order('name');

      if (tournamentsError) throw tournamentsError;
      setTournaments(tournamentsData || []);

      // Since rounds table doesn't exist yet, show empty state
      console.log('Rounds table not available yet');
      setRounds([]);
    } catch (error: any) {
      console.error('Error fetching rounds:', error);
      toast({
        title: "Info",
        description: "Round management will be available after database migration",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Info",
      description: "Round management will be available after database migration",
      variant: "default",
    });
  };

  const deleteRound = async (roundId: string) => {
    toast({
      title: "Info",
      description: "Round management will be available after database migration",
      variant: "default",
    });
  };

  const updateRoundStatus = async (roundId: string, status: string) => {
    toast({
      title: "Info",
      description: "Round management will be available after database migration",
      variant: "default",
    });
  };

  const resetForm = () => {
    setFormData({ tournament_id: '', name: '', round_number: 1, status: 'pending' });
    setEditingRound(null);
  };

  const openEditDialog = (round: Round) => {
    setEditingRound(round);
    setFormData({
      tournament_id: round.tournament_id,
      name: round.name,
      round_number: round.round_number,
      status: round.status
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
          <h3 className="text-lg font-semibold">Round Management</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage tournament rounds
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Round
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRound ? 'Edit Round' : 'Add New Round'}
              </DialogTitle>
              <DialogDescription>
                Create or modify a tournament round
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tournament">Tournament</Label>
                <Select
                  value={formData.tournament_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tournament_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tournament" />
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Round Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Preliminary Round 1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="round_number">Round Number</Label>
                  <Input
                    id="round_number"
                    type="number"
                    min="1"
                    value={formData.round_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, round_number: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRound ? 'Update' : 'Add'} Round
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="text-center py-8">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Round Management Coming Soon</h3>
          <p className="text-muted-foreground">
            Round management features will be available after the database migration is complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

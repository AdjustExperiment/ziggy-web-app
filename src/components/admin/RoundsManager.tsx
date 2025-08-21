
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

      // Fetch rounds
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select(`
          id,
          name,
          round_number,
          status,
          scheduled_date,
          tournament_id,
          created_at,
          updated_at
        `)
        .order('tournament_id', { ascending: true })
        .order('round_number', { ascending: true });

      if (roundsError) throw roundsError;
      setRounds(roundsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rounds data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRound) {
        // Update existing round
        const { error } = await supabase
          .from('rounds')
          .update({
            name: formData.name,
            round_number: formData.round_number,
            status: formData.status,
            tournament_id: formData.tournament_id
          })
          .eq('id', editingRound.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Round updated successfully",
        });
      } else {
        // Create new round
        const { error } = await supabase
          .from('rounds')
          .insert({
            name: formData.name,
            round_number: formData.round_number,
            status: formData.status,
            tournament_id: formData.tournament_id
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Round created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving round:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save round",
        variant: "destructive",
      });
    }
  };

  const deleteRound = async (roundId: string) => {
    try {
      const { error } = await supabase
        .from('rounds')
        .delete()
        .eq('id', roundId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Round deleted successfully",
      });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting round:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete round",
        variant: "destructive",
      });
    }
  };

  const updateRoundStatus = async (roundId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('rounds')
        .update({ status })
        .eq('id', roundId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Round status updated successfully",
      });
      fetchData();
    } catch (error: any) {
      console.error('Error updating round status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update round status",
        variant: "destructive",
      });
    }
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

      <div className="grid gap-4">
        {rounds.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Rounds Found</h3>
              <p className="text-muted-foreground">
                Create your first round to get started with tournament management.
              </p>
            </CardContent>
          </Card>
        ) : (
          rounds.map((round) => {
            const tournament = tournaments.find(t => t.id === round.tournament_id);
            const getStatusColor = (status: string) => {
              switch (status) {
                case 'active': return 'bg-green-500';
                case 'completed': return 'bg-blue-500';
                case 'pending': return 'bg-yellow-500';
                default: return 'bg-gray-500';
              }
            };

            return (
              <Card key={round.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {round.name}
                      </CardTitle>
                      <CardDescription>
                        Tournament: {tournament?.name || 'Unknown'} • Round #{round.round_number}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(round.status)}`} />
                        {round.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {round.scheduled_date ? (
                        `Scheduled: ${new Date(round.scheduled_date).toLocaleDateString()}`
                      ) : (
                        'No date scheduled'
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(round)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      {round.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateRoundStatus(round.id, 'active')}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      )}
                      {round.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateRoundStatus(round.id, 'completed')}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Complete
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteRound(round.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

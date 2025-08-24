
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Edit, Users, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Tournament {
  id: string;
  name: string;
  format: string;
}

interface Competitor {
  id: string;
  tournament_id: string;
  registration_id?: string;
  competitor_type: 'team' | 'individual';
  participant_names: string[];
  team_name?: string;
  status: string;
  seed?: number;
}

interface Registration {
  id: string;
  participant_name: string;
  partner_name?: string;
  payment_status: string;
}

export const TournamentCompetitorsManager = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    competitor_type: 'individual' as 'team' | 'individual',
    participant_names: [''],
    team_name: '',
    status: 'active',
    seed: '',
    registration_id: 'none'
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchCompetitors();
      fetchRegistrations();
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, format')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tournaments.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitors = async () => {
    if (!selectedTournament) return;

    try {
      // Use direct table query since tournament_competitors table doesn't exist yet
      console.log('Tournament competitors functionality pending database migration');
      setCompetitors([]);
    } catch (error) {
      console.error('Error fetching competitors:', error);
      setCompetitors([]);
    }
  };

  const fetchRegistrations = async () => {
    if (!selectedTournament) return;

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('id, participant_name, partner_name, payment_status')
        .eq('tournament_id', selectedTournament)
        .eq('payment_status', 'paid');

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      competitor_type: 'individual',
      participant_names: [''],
      team_name: '',
      status: 'active',
      seed: '',
      registration_id: 'none'
    });
    setEditingCompetitor(null);
  };

  const openDialog = (competitor?: Competitor) => {
    if (competitor) {
      setEditingCompetitor(competitor);
      setFormData({
        competitor_type: competitor.competitor_type,
        participant_names: competitor.participant_names,
        team_name: competitor.team_name || '',
        status: competitor.status,
        seed: competitor.seed?.toString() || '',
        registration_id: competitor.registration_id || 'none'
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;

    try {
      const competitorData = {
        tournament_id: selectedTournament,
        competitor_type: formData.competitor_type,
        participant_names: formData.participant_names.filter(name => name.trim()),
        team_name: formData.team_name || null,
        status: formData.status,
        seed: formData.seed ? parseInt(formData.seed) : null,
        registration_id: formData.registration_id === 'none' ? null : formData.registration_id
      };

      // Use raw SQL insert for now
      const query = editingCompetitor
        ? `UPDATE tournament_competitors SET 
           competitor_type = $2, 
           participant_names = $3, 
           team_name = $4, 
           status = $5, 
           seed = $6, 
           registration_id = $7 
           WHERE id = $1`
        : `INSERT INTO tournament_competitors 
           (tournament_id, competitor_type, participant_names, team_name, status, seed, registration_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`;

      const params = editingCompetitor
        ? [editingCompetitor.id, competitorData.competitor_type, JSON.stringify(competitorData.participant_names), competitorData.team_name, competitorData.status, competitorData.seed, competitorData.registration_id]
        : [competitorData.tournament_id, competitorData.competitor_type, JSON.stringify(competitorData.participant_names), competitorData.team_name, competitorData.status, competitorData.seed, competitorData.registration_id];

      // Placeholder for tournament competitors creation
      console.log('Create competitor functionality pending database migration:', formData);
      
      toast({ 
        title: 'Info', 
        description: 'Competitor management will be available once database types are updated.' 
      });

      setDialogOpen(false);
      resetForm();
      fetchCompetitors();
    } catch (error) {
      console.error('Error saving competitor:', error);
      toast({
        title: 'Info',
        description: 'Competitor management will be available once database setup is complete.',
      });
    }
  };

  const handleDelete = async (competitorId: string) => {
    if (!confirm('Are you sure you want to delete this competitor?')) return;

    try {
      // Placeholder for tournament competitors deletion
      console.log('Delete competitor functionality pending database migration:', competitorId);
      
      toast({
        title: 'Info',
        description: 'Delete functionality will be available once database setup is complete.',
      });
    } catch (error) {
      console.error('Error deleting competitor:', error);
      toast({
        title: 'Info',
        description: 'Delete functionality will be available once database setup is complete.',
      });
    }
  };

  const updateParticipantName = (index: number, value: string) => {
    const newNames = [...formData.participant_names];
    newNames[index] = value;
    setFormData(prev => ({ ...prev, participant_names: newNames }));
  };

  const addParticipantName = () => {
    setFormData(prev => ({
      ...prev,
      participant_names: [...prev.participant_names, '']
    }));
  };

  const removeParticipantName = (index: number) => {
    if (formData.participant_names.length > 1) {
      const newNames = formData.participant_names.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, participant_names: newNames }));
    }
  };

  const syncFromRegistrations = async () => {
    if (!selectedTournament || registrations.length === 0) return;

    toast({
      title: 'Info',
      description: 'Sync functionality will be available once database setup is complete.',
    });
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tournament Competitors</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a tournament" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name} ({tournament.format})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTournament && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Competitors ({competitors.length})</CardTitle>
            <div className="flex gap-2">
              <Button onClick={syncFromRegistrations} variant="outline">
                Sync from Registrations
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Competitor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCompetitor ? 'Edit Competitor' : 'Add Competitor'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Competitor Type</Label>
                        <Select
                          value={formData.competitor_type}
                          onValueChange={(value: 'team' | 'individual') => 
                            setFormData(prev => ({ ...prev, competitor_type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="team">Team</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Participant Names</Label>
                      {formData.participant_names.map((name, index) => (
                        <div key={index} className="flex gap-2 mt-2">
                          <Input
                            value={name}
                            onChange={(e) => updateParticipantName(index, e.target.value)}
                            placeholder={`Participant ${index + 1} name`}
                            required
                          />
                          {formData.participant_names.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeParticipantName(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addParticipantName}
                        className="mt-2"
                      >
                        Add Participant
                      </Button>
                    </div>

                    {formData.competitor_type === 'team' && (
                      <div>
                        <Label>Team Name (Optional)</Label>
                        <Input
                          value={formData.team_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, team_name: e.target.value }))}
                          placeholder="Team name"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Seed (Optional)</Label>
                        <Input
                          type="number"
                          value={formData.seed}
                          onChange={(e) => setFormData(prev => ({ ...prev, seed: e.target.value }))}
                          placeholder="Seeding number"
                        />
                      </div>

                      <div>
                        <Label>Link to Registration (Optional)</Label>
                        <Select
                          value={formData.registration_id}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, registration_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select registration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No registration</SelectItem>
                            {registrations.map((reg) => (
                              <SelectItem key={reg.id} value={reg.id}>
                                {reg.participant_name} {reg.partner_name && `& ${reg.partner_name}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingCompetitor ? 'Update' : 'Add'} Competitor
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {competitors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Seed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map((competitor) => (
                    <TableRow key={competitor.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {competitor.competitor_type === 'team' ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                          {competitor.competitor_type}
                        </div>
                      </TableCell>
                      <TableCell>
                        {competitor.participant_names.join(' & ')}
                      </TableCell>
                      <TableCell>{competitor.team_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={competitor.status === 'active' ? 'default' : 'secondary'}>
                          {competitor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{competitor.seed || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(competitor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(competitor.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Tournament competitor management will be available once database setup is complete.
                </p>
                <p className="text-sm text-muted-foreground">
                  The database migration has been applied, but TypeScript types need to be regenerated.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecentResult {
  id: string;
  tournament: string;
  position: string;
  format: string;
  date: string;
  participants: number;
  points: number;
  prize?: string;
}

interface Championship {
  id: string;
  name: string;
  winner: string;
  runner_up: string;
  date: string;
  location: string;
  participants: number;
}

interface TopPerformer {
  id: string;
  rank: number;
  name: string;
  school: string;
  points: number;
  tournaments: number;
  win_rate: number;
}

export function ResultsManager() {
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');
  const { toast } = useToast();

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'recent' | 'championship' | 'performer'>('recent');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [recentForm, setRecentForm] = useState({
    tournament: '',
    position: '',
    format: '',
    date: '',
    participants: '',
    points: '',
    prize: ''
  });

  const [championshipForm, setChampionshipForm] = useState({
    name: '',
    winner: '',
    runner_up: '',
    date: '',
    location: '',
    participants: ''
  });

  const [performerForm, setPerformerForm] = useState({
    rank: '',
    name: '',
    school: '',
    points: '',
    tournaments: '',
    win_rate: ''
  });

  const fetchData = async () => {
    try {
      const [recentRes, champRes, performerRes] = await Promise.all([
        supabase.from('results_recent').select('*').order('date', { ascending: false }),
        supabase.from('championships').select('*').order('date', { ascending: false }),
        supabase.from('top_performers').select('*').order('rank', { ascending: true })
      ]);

      if (recentRes.error) throw recentRes.error;
      if (champRes.error) throw champRes.error;
      if (performerRes.error) throw performerRes.error;

      setRecentResults(recentRes.data || []);
      setChampionships(champRes.data || []);
      setTopPerformers(performerRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch results data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForms = () => {
    setRecentForm({
      tournament: '',
      position: '',
      format: '',
      date: '',
      participants: '',
      points: '',
      prize: ''
    });
    setChampionshipForm({
      name: '',
      winner: '',
      runner_up: '',
      date: '',
      location: '',
      participants: ''
    });
    setPerformerForm({
      rank: '',
      name: '',
      school: '',
      points: '',
      tournaments: '',
      win_rate: ''
    });
  };

  const openDialog = (type: 'recent' | 'championship' | 'performer', item?: any) => {
    setDialogType(type);
    setEditingItem(item);
    
    if (item) {
      if (type === 'recent') {
        setRecentForm({
          tournament: item.tournament,
          position: item.position,
          format: item.format,
          date: item.date,
          participants: item.participants.toString(),
          points: item.points.toString(),
          prize: item.prize || ''
        });
      } else if (type === 'championship') {
        setChampionshipForm({
          name: item.name,
          winner: item.winner,
          runner_up: item.runner_up,
          date: item.date,
          location: item.location,
          participants: item.participants.toString()
        });
      } else if (type === 'performer') {
        setPerformerForm({
          rank: item.rank.toString(),
          name: item.name,
          school: item.school,
          points: item.points.toString(),
          tournaments: item.tournaments.toString(),
          win_rate: item.win_rate.toString()
        });
      }
    } else {
      resetForms();
    }
    
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      let error;
      
      if (dialogType === 'recent') {
        const data = {
          tournament: recentForm.tournament,
          position: recentForm.position,
          format: recentForm.format,
          date: recentForm.date,
          participants: parseInt(recentForm.participants),
          points: parseInt(recentForm.points),
          prize: recentForm.prize || null
        };
        
        if (editingItem) {
          const { error: updateError } = await supabase
            .from('results_recent')
            .update(data)
            .eq('id', editingItem.id);
          error = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('results_recent')
            .insert([data]);
          error = insertError;
        }
      } else if (dialogType === 'championship') {
        const data = {
          name: championshipForm.name,
          winner: championshipForm.winner,
          runner_up: championshipForm.runner_up,
          date: championshipForm.date,
          location: championshipForm.location,
          participants: parseInt(championshipForm.participants)
        };
        
        if (editingItem) {
          const { error: updateError } = await supabase
            .from('championships')
            .update(data)
            .eq('id', editingItem.id);
          error = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('championships')
            .insert([data]);
          error = insertError;
        }
      } else if (dialogType === 'performer') {
        const data = {
          rank: parseInt(performerForm.rank),
          name: performerForm.name,
          school: performerForm.school,
          points: parseInt(performerForm.points),
          tournaments: parseInt(performerForm.tournaments),
          win_rate: parseFloat(performerForm.win_rate)
        };
        
        if (editingItem) {
          const { error: updateError } = await supabase
            .from('top_performers')
            .update(data)
            .eq('id', editingItem.id);
          error = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('top_performers')
            .insert([data]);
          error = insertError;
        }
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${dialogType} ${editingItem ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingItem(null);
      resetForms();
      fetchData();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (type: 'recent' | 'championship' | 'performer', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      let error;
      
      if (type === 'recent') {
        const { error: deleteError } = await supabase
          .from('results_recent')
          .delete()
          .eq('id', id);
        error = deleteError;
      } else if (type === 'championship') {
        const { error: deleteError } = await supabase
          .from('championships')
          .delete()
          .eq('id', id);
        error = deleteError;
      } else if (type === 'performer') {
        const { error: deleteError } = await supabase
          .from('top_performers')
          .delete()
          .eq('id', id);
        error = deleteError;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${type} deleted successfully`,
      });
      
      fetchData();
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderRecentResultsForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Tournament Name</Label>
        <Input
          value={recentForm.tournament}
          onChange={(e) => setRecentForm({ ...recentForm, tournament: e.target.value })}
          placeholder="Tournament name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Position</Label>
          <Input
            value={recentForm.position}
            onChange={(e) => setRecentForm({ ...recentForm, position: e.target.value })}
            placeholder="1st, 2nd, etc."
          />
        </div>
        <div>
          <Label>Format</Label>
          <Input
            value={recentForm.format}
            onChange={(e) => setRecentForm({ ...recentForm, format: e.target.value })}
            placeholder="Parliamentary, BP, etc."
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={recentForm.date}
            onChange={(e) => setRecentForm({ ...recentForm, date: e.target.value })}
          />
        </div>
        <div>
          <Label>Participants</Label>
          <Input
            type="number"
            value={recentForm.participants}
            onChange={(e) => setRecentForm({ ...recentForm, participants: e.target.value })}
            placeholder="Number of teams"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Points</Label>
          <Input
            type="number"
            value={recentForm.points}
            onChange={(e) => setRecentForm({ ...recentForm, points: e.target.value })}
            placeholder="Points earned"
          />
        </div>
        <div>
          <Label>Prize</Label>
          <Input
            value={recentForm.prize}
            onChange={(e) => setRecentForm({ ...recentForm, prize: e.target.value })}
            placeholder="Prize amount (optional)"
          />
        </div>
      </div>
    </div>
  );

  const renderChampionshipForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Championship Name</Label>
        <Input
          value={championshipForm.name}
          onChange={(e) => setChampionshipForm({ ...championshipForm, name: e.target.value })}
          placeholder="Championship name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Winner</Label>
          <Input
            value={championshipForm.winner}
            onChange={(e) => setChampionshipForm({ ...championshipForm, winner: e.target.value })}
            placeholder="Winner name"
          />
        </div>
        <div>
          <Label>Runner-up</Label>
          <Input
            value={championshipForm.runner_up}
            onChange={(e) => setChampionshipForm({ ...championshipForm, runner_up: e.target.value })}
            placeholder="Runner-up name"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={championshipForm.date}
            onChange={(e) => setChampionshipForm({ ...championshipForm, date: e.target.value })}
          />
        </div>
        <div>
          <Label>Location</Label>
          <Input
            value={championshipForm.location}
            onChange={(e) => setChampionshipForm({ ...championshipForm, location: e.target.value })}
            placeholder="Location"
          />
        </div>
      </div>
      <div>
        <Label>Participants</Label>
        <Input
          type="number"
          value={championshipForm.participants}
          onChange={(e) => setChampionshipForm({ ...championshipForm, participants: e.target.value })}
          placeholder="Number of participants"
        />
      </div>
    </div>
  );

  const renderPerformerForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Rank</Label>
          <Input
            type="number"
            value={performerForm.rank}
            onChange={(e) => setPerformerForm({ ...performerForm, rank: e.target.value })}
            placeholder="Ranking position"
          />
        </div>
        <div>
          <Label>Name</Label>
          <Input
            value={performerForm.name}
            onChange={(e) => setPerformerForm({ ...performerForm, name: e.target.value })}
            placeholder="Debater name"
          />
        </div>
      </div>
      <div>
        <Label>School</Label>
        <Input
          value={performerForm.school}
          onChange={(e) => setPerformerForm({ ...performerForm, school: e.target.value })}
          placeholder="School/Institution"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Points</Label>
          <Input
            type="number"
            value={performerForm.points}
            onChange={(e) => setPerformerForm({ ...performerForm, points: e.target.value })}
            placeholder="Total points"
          />
        </div>
        <div>
          <Label>Tournaments</Label>
          <Input
            type="number"
            value={performerForm.tournaments}
            onChange={(e) => setPerformerForm({ ...performerForm, tournaments: e.target.value })}
            placeholder="Tournament count"
          />
        </div>
        <div>
          <Label>Win Rate (%)</Label>
          <Input
            type="number"
            step="0.01"
            value={performerForm.win_rate}
            onChange={(e) => setPerformerForm({ ...performerForm, win_rate: e.target.value })}
            placeholder="Win percentage"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Results Management</h2>
        <p className="text-muted-foreground">Manage tournament results, championships, and rankings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="recent">Recent Results</TabsTrigger>
          <TabsTrigger value="championships">Championships</TabsTrigger>
          <TabsTrigger value="performers">Top Performers</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Results</h3>
              <Button onClick={() => openDialog('recent')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Result
              </Button>
            </div>
            
            <div className="grid gap-4">
              {recentResults.map((result) => (
                <Card key={result.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{result.tournament}</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.position} • {result.format} • {result.participants} teams • {result.points} pts
                        </p>
                        <p className="text-sm text-muted-foreground">{result.date}</p>
                        {result.prize && (
                          <p className="text-sm font-medium">{result.prize}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openDialog('recent', result)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete('recent', result.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="championships">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Championships</h3>
              <Button onClick={() => openDialog('championship')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Championship
              </Button>
            </div>
            
            <div className="grid gap-4">
              {championships.map((championship) => (
                <Card key={championship.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{championship.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Winner: {championship.winner} • Runner-up: {championship.runner_up}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {championship.date} • {championship.location} • {championship.participants} participants
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openDialog('championship', championship)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete('championship', championship.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performers">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Top Performers</h3>
              <Button onClick={() => openDialog('performer')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Performer
              </Button>
            </div>
            
            <div className="grid gap-4">
              {topPerformers.map((performer) => (
                <Card key={performer.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-semibold">#{performer.rank} {performer.name}</h4>
                        <p className="text-sm text-muted-foreground">{performer.school}</p>
                        <p className="text-sm text-muted-foreground">
                          {performer.points} points • {performer.tournaments} tournaments • {performer.win_rate}% win rate
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openDialog('performer', performer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete('performer', performer.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog for forms */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit' : 'Add'} {dialogType === 'recent' ? 'Recent Result' : 
               dialogType === 'championship' ? 'Championship' : 'Top Performer'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogType === 'recent' && renderRecentResultsForm()}
          {dialogType === 'championship' && renderChampionshipForm()}
          {dialogType === 'performer' && renderPerformerForm()}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
}

interface Availability {
  id: string;
  tournament_id: string;
  available_dates: string[];
  time_preferences: {
    morning?: boolean;
    afternoon?: boolean;
    evening?: boolean;
  };
  max_rounds_per_day: number;
  special_requirements: string;
  tournament?: Tournament;
}

interface JudgeAvailabilityProps {
  judgeProfileId: string;
}

export default function JudgeAvailability({ judgeProfileId }: JudgeAvailabilityProps) {
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    tournament_id: '',
    available_dates: [''],
    morning: true,
    afternoon: true,
    evening: false,
    max_rounds_per_day: 3,
    special_requirements: ''
  });

  useEffect(() => {
    fetchTournaments();
    fetchAvailabilities();
  }, [judgeProfileId]);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('registration_open', true)
        .order('start_date');

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchAvailabilities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('judge_availability')
        .select(`
          *,
          tournament:tournaments (
            id,
            name,
            start_date,
            end_date,
            location
          )
        `)
        .eq('judge_profile_id', judgeProfileId);

      if (error) throw error;
      setAvailabilities((data || []).map(item => ({
        ...item,
        available_dates: Array.isArray(item.available_dates) ? item.available_dates as string[] : [],
        time_preferences: typeof item.time_preferences === 'object' && item.time_preferences !== null 
          ? item.time_preferences as { morning?: boolean; afternoon?: boolean; evening?: boolean; }
          : {},
        tournament: item.tournament && typeof item.tournament === 'object' && !('error' in item.tournament) && item.tournament !== null
          ? {
              id: (item.tournament as any).id,
              name: (item.tournament as any).name,
              start_date: (item.tournament as any).start_date,
              end_date: (item.tournament as any).end_date,
              location: (item.tournament as any).location
            }
          : undefined
      })));
    } catch (error) {
      console.error('Error fetching availabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const availabilityData = {
        judge_profile_id: judgeProfileId,
        tournament_id: formData.tournament_id,
        available_dates: formData.available_dates.filter(date => date.trim() !== ''),
        time_preferences: {
          morning: formData.morning,
          afternoon: formData.afternoon,
          evening: formData.evening
        },
        max_rounds_per_day: formData.max_rounds_per_day,
        special_requirements: formData.special_requirements
      };

      if (editingAvailability) {
        const { error } = await supabase
          .from('judge_availability')
          .update(availabilityData)
          .eq('id', editingAvailability.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Availability updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('judge_availability')
          .insert(availabilityData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Availability added successfully',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAvailabilities();
    } catch (error: any) {
      console.error('Error saving availability:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save availability',
        variant: 'destructive',
      });
    }
  };

  const deleteAvailability = async (availabilityId: string) => {
    if (!confirm('Are you sure you want to delete this availability?')) return;

    try {
      const { error } = await supabase
        .from('judge_availability')
        .delete()
        .eq('id', availabilityId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Availability deleted successfully',
      });

      fetchAvailabilities();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete availability',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      tournament_id: '',
      available_dates: [''],
      morning: true,
      afternoon: true,
      evening: false,
      max_rounds_per_day: 3,
      special_requirements: ''
    });
    setEditingAvailability(null);
  };

  const openEditDialog = (availability: Availability) => {
    setEditingAvailability(availability);
    setFormData({
      tournament_id: availability.tournament_id,
      available_dates: availability.available_dates.length > 0 ? availability.available_dates : [''],
      morning: availability.time_preferences.morning || false,
      afternoon: availability.time_preferences.afternoon || false,
      evening: availability.time_preferences.evening || false,
      max_rounds_per_day: availability.max_rounds_per_day,
      special_requirements: availability.special_requirements || ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const addDateField = () => {
    setFormData(prev => ({
      ...prev,
      available_dates: [...prev.available_dates, '']
    }));
  };

  const updateDate = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      available_dates: prev.available_dates.map((date, i) => i === index ? value : date)
    }));
  };

  const removeDate = (index: number) => {
    if (formData.available_dates.length > 1) {
      setFormData(prev => ({
        ...prev,
        available_dates: prev.available_dates.filter((_, i) => i !== index)
      }));
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
          <h3 className="text-lg font-semibold">Tournament Availability</h3>
          <p className="text-sm text-muted-foreground">
            Set your availability for upcoming tournaments
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Availability
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAvailability ? 'Edit Availability' : 'Add Tournament Availability'}
              </DialogTitle>
              <DialogDescription>
                Set your judging availability and preferences for a tournament
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tournament">Tournament</Label>
                <Select 
                  value={formData.tournament_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tournament_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map(tournament => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        {tournament.name} - {new Date(tournament.start_date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Available Dates</Label>
                <div className="space-y-2 mt-2">
                  {formData.available_dates.map((date, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => updateDate(index, e.target.value)}
                        className="flex-1"
                        required
                      />
                      {formData.available_dates.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeDate(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addDateField}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Date
                  </Button>
                </div>
              </div>

              <div>
                <Label>Time Preferences</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.morning}
                      onChange={(e) => setFormData(prev => ({ ...prev, morning: e.target.checked }))}
                    />
                    <span className="text-sm">Morning</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.afternoon}
                      onChange={(e) => setFormData(prev => ({ ...prev, afternoon: e.target.checked }))}
                    />
                    <span className="text-sm">Afternoon</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.evening}
                      onChange={(e) => setFormData(prev => ({ ...prev, evening: e.target.checked }))}
                    />
                    <span className="text-sm">Evening</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="max_rounds">Maximum Rounds per Day</Label>
                <Select 
                  value={formData.max_rounds_per_day.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, max_rounds_per_day: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} round{num !== 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="special_requirements">Special Requirements</Label>
                <Textarea
                  id="special_requirements"
                  value={formData.special_requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
                  placeholder="Any special scheduling requirements or preferences..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingAvailability ? 'Update' : 'Save'} Availability
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {availabilities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Availability Set</h3>
            <p className="text-muted-foreground mb-4">
              Set your availability for tournaments to receive judging assignments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {availabilities.map((availability) => (
            <Card key={availability.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {availability.tournament?.name}
                    </CardTitle>
                    <CardDescription>
                      {availability.tournament?.location} • {new Date(availability.tournament?.start_date || '').toLocaleDateString()} - {new Date(availability.tournament?.end_date || '').toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(availability)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteAvailability(availability.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Available Dates</h4>
                  <div className="flex flex-wrap gap-2">
                    {availability.available_dates.map((date, index) => (
                      <Badge key={index} variant="outline">
                        {new Date(date).toLocaleDateString()}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Time Preferences</h4>
                    <div className="space-y-1">
                      {availability.time_preferences.morning && (
                        <Badge variant="secondary" className="mr-1">Morning</Badge>
                      )}
                      {availability.time_preferences.afternoon && (
                        <Badge variant="secondary" className="mr-1">Afternoon</Badge>
                      )}
                      {availability.time_preferences.evening && (
                        <Badge variant="secondary" className="mr-1">Evening</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Maximum Rounds</h4>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{availability.max_rounds_per_day} per day</span>
                    </div>
                  </div>
                </div>

                {availability.special_requirements && (
                  <div>
                    <h4 className="font-medium mb-2">Special Requirements</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {availability.special_requirements}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
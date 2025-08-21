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
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Plus, Edit2, Trash2, Save, X, MapPin, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  format: string;
}

interface Availability {
  id: string;
  tournament_id: string;
  available_dates: string[];
  time_preferences: {
    morning?: boolean;
    afternoon?: boolean;
    evening?: boolean;
    preferred_start?: string;
    preferred_end?: string;
  };
  max_rounds_per_day: number;
  special_requirements: string;
  preferred_roles: string[];
  conflicts: string[];
  travel_requirements: {
    needs_accommodation?: boolean;
    accommodation_nights?: number;
    travel_reimbursement_needed?: boolean;
    arrival_date?: string;
    departure_date?: string;
  };
  tournament?: Tournament;
}

interface EnhancedJudgeAvailabilityProps {
  judgeProfileId: string;
}

export default function EnhancedJudgeAvailability({ judgeProfileId }: EnhancedJudgeAvailabilityProps) {
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
    preferred_start: '09:00',
    preferred_end: '17:00',
    max_rounds_per_day: 3,
    special_requirements: '',
    preferred_roles: [] as string[],
    conflicts: [''],
    needs_accommodation: false,
    accommodation_nights: 1,
    travel_reimbursement_needed: false,
    arrival_date: '',
    departure_date: ''
  });

  const judgeRoles = [
    { value: 'chair', label: 'Chair Judge' },
    { value: 'panelist', label: 'Panelist' },
    { value: 'shadow', label: 'Shadow Judge' },
    { value: 'trainee', label: 'Trainee Judge' }
  ];

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
            location,
            format
          )
        `)
        .eq('judge_profile_id', judgeProfileId);

      if (error) throw error;
      
      const processedData = (data || []).map(item => ({
        ...item,
        available_dates: Array.isArray(item.available_dates) ? item.available_dates as string[] : [],
        time_preferences: typeof item.time_preferences === 'object' && item.time_preferences !== null 
          ? item.time_preferences as any : {},
        preferred_roles: item.additional_info?.preferred_roles || [],
        conflicts: item.additional_info?.conflicts || [],
        travel_requirements: item.additional_info?.travel_requirements || {},
        tournament: item.tournament && typeof item.tournament === 'object' && !('error' in item.tournament)
          ? item.tournament as Tournament
          : undefined
      }));

      setAvailabilities(processedData);
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
          evening: formData.evening,
          preferred_start: formData.preferred_start,
          preferred_end: formData.preferred_end
        },
        max_rounds_per_day: formData.max_rounds_per_day,
        special_requirements: formData.special_requirements,
        additional_info: {
          preferred_roles: formData.preferred_roles,
          conflicts: formData.conflicts.filter(c => c.trim() !== ''),
          travel_requirements: {
            needs_accommodation: formData.needs_accommodation,
            accommodation_nights: formData.accommodation_nights,
            travel_reimbursement_needed: formData.travel_reimbursement_needed,
            arrival_date: formData.arrival_date || null,
            departure_date: formData.departure_date || null
          }
        }
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
      preferred_start: '09:00',
      preferred_end: '17:00',
      max_rounds_per_day: 3,
      special_requirements: '',
      preferred_roles: [],
      conflicts: [''],
      needs_accommodation: false,
      accommodation_nights: 1,
      travel_reimbursement_needed: false,
      arrival_date: '',
      departure_date: ''
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
      preferred_start: availability.time_preferences.preferred_start || '09:00',
      preferred_end: availability.time_preferences.preferred_end || '17:00',
      max_rounds_per_day: availability.max_rounds_per_day,
      special_requirements: availability.special_requirements || '',
      preferred_roles: availability.preferred_roles || [],
      conflicts: availability.conflicts || [''],
      needs_accommodation: availability.travel_requirements.needs_accommodation || false,
      accommodation_nights: availability.travel_requirements.accommodation_nights || 1,
      travel_reimbursement_needed: availability.travel_requirements.travel_reimbursement_needed || false,
      arrival_date: availability.travel_requirements.arrival_date || '',
      departure_date: availability.travel_requirements.departure_date || ''
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

  const addConflict = () => {
    setFormData(prev => ({
      ...prev,
      conflicts: [...prev.conflicts, '']
    }));
  };

  const updateConflict = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      conflicts: prev.conflicts.map((conflict, i) => i === index ? value : conflict)
    }));
  };

  const removeConflict = (index: number) => {
    if (formData.conflicts.length > 1) {
      setFormData(prev => ({
        ...prev,
        conflicts: prev.conflicts.filter((_, i) => i !== index)
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
          <h3 className="text-lg font-semibold">Enhanced Tournament Availability</h3>
          <p className="text-sm text-muted-foreground">
            Set comprehensive availability preferences for tournaments
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Availability
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAvailability ? 'Edit Availability' : 'Add Tournament Availability'}
              </DialogTitle>
              <DialogDescription>
                Set comprehensive judging preferences and requirements
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Tournament</Label>
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
                              {tournament.name} - {tournament.format}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Maximum Rounds per Day</Label>
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
                      <Label>Preferred Judge Roles</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {judgeRoles.map(role => (
                          <label key={role.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.preferred_roles.includes(role.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    preferred_roles: [...prev.preferred_roles, role.value]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    preferred_roles: prev.preferred_roles.filter(r => r !== role.value)
                                  }));
                                }
                              }}
                            />
                            <span className="text-sm">{role.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Time Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Time Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Available Time Periods</Label>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Preferred Start Time</Label>
                        <Input
                          type="time"
                          value={formData.preferred_start}
                          onChange={(e) => setFormData(prev => ({ ...prev, preferred_start: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Preferred End Time</Label>
                        <Input
                          type="time"
                          value={formData.preferred_end}
                          onChange={(e) => setFormData(prev => ({ ...prev, preferred_end: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Available Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Dates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formData.available_dates.map((date, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => {
                            const newDates = [...formData.available_dates];
                            newDates[index] = e.target.value;
                            setFormData(prev => ({ ...prev, available_dates: newDates }));
                          }}
                          className="flex-1"
                          required
                        />
                        {formData.available_dates.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (formData.available_dates.length > 1) {
                                setFormData(prev => ({
                                  ...prev,
                                  available_dates: prev.available_dates.filter((_, i) => i !== index)
                                }));
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setFormData(prev => ({ ...prev, available_dates: [...prev.available_dates, ''] }))}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Date
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Travel & Accommodation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Travel & Accommodation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.needs_accommodation}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needs_accommodation: checked }))}
                    />
                    <Label>I need accommodation assistance</Label>
                  </div>

                  {formData.needs_accommodation && (
                    <div>
                      <Label>Number of nights needed</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.accommodation_nights}
                        onChange={(e) => setFormData(prev => ({ ...prev, accommodation_nights: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.travel_reimbursement_needed}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, travel_reimbursement_needed: checked }))}
                    />
                    <Label>I need travel reimbursement</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Arrival Date</Label>
                      <Input
                        type="date"
                        value={formData.arrival_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, arrival_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Departure Date</Label>
                      <Input
                        type="date"
                        value={formData.departure_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, departure_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Special Requirements & Conflicts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Special Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={formData.special_requirements}
                      onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
                      placeholder="Any dietary restrictions, accessibility needs, or other requirements..."
                      rows={4}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Conflicts of Interest</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {formData.conflicts.map((conflict, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={conflict}
                            onChange={(e) => updateConflict(index, e.target.value)}
                            placeholder="School, organization, or participant name..."
                            className="flex-1"
                          />
                          {formData.conflicts.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeConflict(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addConflict}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Conflict
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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

      {/* Display existing availabilities */}
      {availabilities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Availability Set</h3>
            <p className="text-muted-foreground mb-4">
              Set your comprehensive availability preferences for tournaments.
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
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {availability.tournament?.location}
                      </span>
                      <span>{availability.tournament?.format}</span>
                      <span>
                        {new Date(availability.tournament?.start_date || '').toLocaleDateString()} - 
                        {new Date(availability.tournament?.end_date || '').toLocaleDateString()}
                      </span>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Available Dates</h4>
                    <div className="flex flex-wrap gap-1">
                      {availability.available_dates.map((date, index) => (
                        <Badge key={index} variant="outline">
                          {new Date(date).toLocaleDateString()}
                        </Badge>
                      ))}
                    </div>
                  </div>

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
                      {availability.time_preferences.preferred_start && (
                        <div className="text-xs text-muted-foreground">
                          {availability.time_preferences.preferred_start} - {availability.time_preferences.preferred_end}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Capacity</h4>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{availability.max_rounds_per_day} rounds/day max</span>
                    </div>
                  </div>
                </div>

                {availability.preferred_roles.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Preferred Roles</h4>
                    <div className="flex flex-wrap gap-1">
                      {availability.preferred_roles.map((role, index) => (
                        <Badge key={index} variant="outline">
                          {judgeRoles.find(r => r.value === role)?.label || role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(availability.travel_requirements.needs_accommodation || availability.travel_requirements.travel_reimbursement_needed) && (
                  <div>
                    <h4 className="font-medium mb-2">Travel Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {availability.travel_requirements.needs_accommodation && (
                        <Badge variant="outline">
                          Accommodation needed ({availability.travel_requirements.accommodation_nights} nights)
                        </Badge>
                      )}
                      {availability.travel_requirements.travel_reimbursement_needed && (
                        <Badge variant="outline">Travel reimbursement needed</Badge>
                      )}
                    </div>
                  </div>
                )}

                {availability.conflicts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Conflicts of Interest</h4>
                    <div className="flex flex-wrap gap-1">
                      {availability.conflicts.map((conflict, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {conflict}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

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

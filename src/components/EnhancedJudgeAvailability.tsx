
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Calendar, Clock, MapPin, User, AlertCircle, Check } from 'lucide-react';
import { format } from 'date-fns';

interface JudgeAvailability {
  id: string;
  judge_profile_id: string;
  tournament_id: string;
  available_dates: any;
  time_preferences: any;
  max_rounds_per_day: number;
  special_requirements: string | null;
  created_at: string;
  updated_at: string;
  tournament?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    location: string;
  } | null;
}

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
}

export function EnhancedJudgeAvailability() {
  const { user, profile } = useAuth();
  const [judgeProfile, setJudgeProfile] = useState<any>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [availabilities, setAvailabilities] = useState<JudgeAvailability[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [timePreferences, setTimePreferences] = useState({
    morning: false,
    afternoon: false,
    evening: false,
    preferred_start_time: '',
    preferred_end_time: ''
  });
  const [maxRoundsPerDay, setMaxRoundsPerDay] = useState(3);
  const [specialRequirements, setSpecialRequirements] = useState('');

  useEffect(() => {
    if (user) {
      fetchJudgeProfile();
      fetchTournaments();
      fetchAvailabilities();
    }
  }, [user]);

  const fetchJudgeProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('judge_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setJudgeProfile(data);
    } catch (error) {
      console.error('Error fetching judge profile:', error);
      toast({
        title: "Error",
        description: "Failed to load judge profile",
        variant: "destructive",
      });
    }
  };

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, start_date, end_date, location')
        .eq('status', 'Registration Open')
        .order('start_date');

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchAvailabilities = async () => {
    if (!judgeProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('judge_availability')
        .select(`
          *,
          tournaments:tournament_id (
            id,
            name,
            start_date,
            end_date,
            location
          )
        `)
        .eq('judge_profile_id', judgeProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailabilities(data || []);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (judgeProfile) {
      fetchAvailabilities();
    }
  }, [judgeProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeProfile || !selectedTournament) {
      toast({
        title: "Error",
        description: "Please select a tournament",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const availabilityData = {
        judge_profile_id: judgeProfile.id,
        tournament_id: selectedTournament,
        available_dates: availableDates,
        time_preferences: timePreferences,
        max_rounds_per_day: maxRoundsPerDay,
        special_requirements: specialRequirements || null
      };

      const { error } = await supabase
        .from('judge_availability')
        .upsert(availabilityData, {
          onConflict: 'judge_profile_id,tournament_id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability updated successfully",
      });

      // Reset form
      setSelectedTournament('');
      setAvailableDates([]);
      setTimePreferences({
        morning: false,
        afternoon: false,
        evening: false,
        preferred_start_time: '',
        preferred_end_time: ''
      });
      setMaxRoundsPerDay(3);
      setSpecialRequirements('');

      // Refresh availabilities
      fetchAvailabilities();
    } catch (error: any) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save availability",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateToggle = (date: string) => {
    setAvailableDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const generateDateRange = (startDate: string, endDate: string): string[] => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(format(d, 'yyyy-MM-dd'));
    }
    
    return dates;
  };

  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Please log in to manage your judging availability.</p>
      </div>
    );
  }

  if (!judgeProfile) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">You need a judge profile to set availability.</p>
        <Button onClick={() => window.location.href = '/judge-dashboard'}>
          Create Judge Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Availabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Availability Settings
          </CardTitle>
          <CardDescription>
            Your current judging availability for upcoming tournaments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : availabilities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p>No availability set yet. Submit your first availability below.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availabilities.map((item) => {
                const tournament = item.tournament as Tournament | null;
                return (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {tournament?.name || 'Tournament'}
                        </h4>
                        {tournament && (
                          <p className="text-sm text-muted-foreground">
                            {tournament.location} • {format(new Date(tournament.start_date), 'MMM d')} - {format(new Date(tournament.end_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        <Check className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-1">Available Dates</p>
                        <p className="text-muted-foreground">
                          {Array.isArray(item.available_dates) && item.available_dates.length > 0
                            ? `${item.available_dates.length} dates selected`
                            : 'No specific dates'
                          }
                        </p>
                      </div>

                      <div>
                        <p className="font-medium mb-1">Time Preferences</p>
                        <div className="flex flex-wrap gap-1">
                          {typeof item.time_preferences === 'object' && item.time_preferences && [
                            item.time_preferences.morning && 'Morning',
                            item.time_preferences.afternoon && 'Afternoon', 
                            item.time_preferences.evening && 'Evening'
                          ].filter(Boolean).map((time, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="font-medium mb-1">Max Rounds/Day</p>
                        <p className="text-muted-foreground">{item.max_rounds_per_day}</p>
                      </div>
                    </div>

                    {item.special_requirements && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="font-medium mb-1">Special Requirements</p>
                        <p className="text-sm text-muted-foreground">{item.special_requirements}</p>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Last updated: {format(new Date(item.updated_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set New Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Set Tournament Availability</CardTitle>
          <CardDescription>
            Set your availability for a specific tournament
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tournament Selection */}
            <div>
              <Label htmlFor="tournament">Select Tournament</Label>
              <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tournament..." />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      <div className="flex flex-col">
                        <span>{tournament.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {tournament.location} • {format(new Date(tournament.start_date), 'MMM d')} - {format(new Date(tournament.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Available Dates */}
            {selectedTournament && (
              <div>
                <Label>Available Dates</Label>
                <div className="mt-2">
                  {(() => {
                    const tournament = tournaments.find(t => t.id === selectedTournament);
                    if (!tournament) return null;

                    const dates = generateDateRange(tournament.start_date, tournament.end_date);
                    return (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {dates.map((date) => (
                          <div key={date} className="flex items-center space-x-2">
                            <Checkbox
                              id={date}
                              checked={availableDates.includes(date)}
                              onCheckedChange={() => handleDateToggle(date)}
                            />
                            <Label
                              htmlFor={date}
                              className="text-sm cursor-pointer"
                            >
                              {format(new Date(date), 'MMM d')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Time Preferences */}
            <div>
              <Label>Time Preferences</Label>
              <div className="mt-2 space-y-3">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="morning"
                      checked={timePreferences.morning}
                      onCheckedChange={(checked) =>
                        setTimePreferences(prev => ({ ...prev, morning: !!checked }))
                      }
                    />
                    <Label htmlFor="morning">Morning (8AM-12PM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="afternoon"
                      checked={timePreferences.afternoon}
                      onCheckedChange={(checked) =>
                        setTimePreferences(prev => ({ ...prev, afternoon: !!checked }))
                      }
                    />
                    <Label htmlFor="afternoon">Afternoon (12PM-5PM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="evening"
                      checked={timePreferences.evening}
                      onCheckedChange={(checked) =>
                        setTimePreferences(prev => ({ ...prev, evening: !!checked }))
                      }
                    />
                    <Label htmlFor="evening">Evening (5PM-9PM)</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Preferred Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={timePreferences.preferred_start_time}
                      onChange={(e) =>
                        setTimePreferences(prev => ({ ...prev, preferred_start_time: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">Preferred End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={timePreferences.preferred_end_time}
                      onChange={(e) =>
                        setTimePreferences(prev => ({ ...prev, preferred_end_time: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Max Rounds Per Day */}
            <div>
              <Label htmlFor="max-rounds">Maximum Rounds Per Day</Label>
              <Select
                value={maxRoundsPerDay.toString()}
                onValueChange={(value) => setMaxRoundsPerDay(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} round{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Special Requirements */}
            <div>
              <Label htmlFor="special-requirements">Special Requirements (Optional)</Label>
              <Textarea
                id="special-requirements"
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="Any special requirements or notes for tournament organizers..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={submitting || !selectedTournament} className="w-full">
              {submitting ? 'Saving...' : 'Save Availability'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

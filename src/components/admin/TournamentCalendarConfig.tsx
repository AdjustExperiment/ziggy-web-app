import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Clock, Target } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Round {
  id: string;
  name: string;
  date: string;
  time?: string;
  description?: string;
  type: 'preliminary' | 'quarterfinal' | 'semifinal' | 'final' | 'custom';
}

interface TournamentCalendarConfigProps {
  startDate: Date;
  endDate: Date;
  roundScheduleType: string;
  roundIntervalDays: number;
  roundCount: number;
  roundsConfig: Round[];
  autoScheduleRounds: boolean;
  onChange: (field: string, value: any) => void;
}

export const TournamentCalendarConfig: React.FC<TournamentCalendarConfigProps> = ({
  startDate,
  endDate,
  roundScheduleType,
  roundIntervalDays,
  roundCount,
  roundsConfig,
  autoScheduleRounds,
  onChange,
}) => {
  const [newRound, setNewRound] = useState<Partial<Round>>({
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    type: 'preliminary',
    description: '',
  });

  // Auto-generate rounds when schedule type or parameters change
  useEffect(() => {
    if (autoScheduleRounds && roundScheduleType !== 'custom') {
      generateRounds();
    }
  }, [autoScheduleRounds, roundScheduleType, roundIntervalDays, roundCount, startDate]);

  const generateRounds = () => {
    const rounds: Round[] = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < roundCount; i++) {
      let roundName = '';
      let roundType: Round['type'] = 'preliminary';

      // Determine round type and name based on position
      if (i === roundCount - 1) {
        roundName = 'Final';
        roundType = 'final';
      } else if (i === roundCount - 2 && roundCount > 2) {
        roundName = 'Semi-Final';
        roundType = 'semifinal';
      } else if (i === roundCount - 3 && roundCount > 3) {
        roundName = 'Quarter-Final';
        roundType = 'quarterfinal';
      } else {
        roundName = `Round ${i + 1}`;
        roundType = 'preliminary';
      }

      rounds.push({
        id: `round-${i + 1}`,
        name: roundName,
        date: format(currentDate, 'yyyy-MM-dd'),
        time: '09:00',
        type: roundType,
        description: `Automatically scheduled ${roundName.toLowerCase()}`,
      });

      // Calculate next round date based on schedule type
      if (roundScheduleType === 'weekly') {
        currentDate = addDays(currentDate, 7);
      } else if (roundScheduleType === 'daily') {
        currentDate = addDays(currentDate, 1);
      } else if (roundScheduleType === 'monthly') {
        currentDate = addDays(currentDate, 30);
      } else {
        currentDate = addDays(currentDate, roundIntervalDays);
      }
    }

    onChange('rounds_config', rounds);
  };

  const addRound = () => {
    if (!newRound.name || !newRound.date) return;

    const round: Round = {
      id: `round-${Date.now()}`,
      name: newRound.name,
      date: newRound.date,
      time: newRound.time || '09:00',
      type: newRound.type || 'preliminary',
      description: newRound.description || '',
    };

    onChange('rounds_config', [...roundsConfig, round]);
    setNewRound({
      name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      type: 'preliminary',
      description: '',
    });
  };

  const removeRound = (id: string) => {
    onChange('rounds_config', roundsConfig.filter(round => round.id !== id));
  };

  const updateRound = (id: string, field: keyof Round, value: string) => {
    const updatedRounds = roundsConfig.map(round =>
      round.id === id ? { ...round, [field]: value } : round
    );
    onChange('rounds_config', updatedRounds);
  };

  const getRoundTypeColor = (type: Round['type']) => {
    switch (type) {
      case 'preliminary': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'quarterfinal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'semifinal': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'final': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Schedule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Tournament Schedule Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roundScheduleType">Schedule Type</Label>
              <Select 
                value={roundScheduleType} 
                onValueChange={(value) => onChange('round_schedule_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Schedule</SelectItem>
                  <SelectItem value="weekly">Weekly Rounds</SelectItem>
                  <SelectItem value="daily">Daily Rounds</SelectItem>
                  <SelectItem value="monthly">Monthly Rounds</SelectItem>
                  <SelectItem value="interval">Custom Interval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {roundScheduleType === 'interval' && (
              <div>
                <Label htmlFor="roundIntervalDays">Days Between Rounds</Label>
                <Input
                  id="roundIntervalDays"
                  type="number"
                  value={roundIntervalDays}
                  onChange={(e) => onChange('round_interval_days', parseInt(e.target.value) || 7)}
                  min="1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="roundCount">Number of Rounds</Label>
              <Input
                id="roundCount"
                type="number"
                value={roundCount}
                onChange={(e) => onChange('round_count', parseInt(e.target.value) || 1)}
                min="1"
                max="20"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoSchedule">Auto-Schedule Rounds</Label>
              <Switch
                id="autoSchedule"
                checked={autoScheduleRounds}
                onCheckedChange={(checked) => onChange('auto_schedule_rounds', checked)}
              />
            </div>
          </div>

          {autoScheduleRounds && roundScheduleType !== 'custom' && (
            <div className="mt-4">
              <Button onClick={generateRounds} variant="outline" size="sm">
                <Target className="h-4 w-4 mr-2" />
                Regenerate Rounds
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rounds Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tournament Rounds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Round */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg bg-muted/20">
            <div>
              <Label htmlFor="newRoundName">Round Name</Label>
              <Input
                id="newRoundName"
                placeholder="e.g., Round 1"
                value={newRound.name}
                onChange={(e) => setNewRound({ ...newRound, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="newRoundType">Type</Label>
              <Select 
                value={newRound.type} 
                onValueChange={(value) => setNewRound({ ...newRound, type: value as Round['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preliminary">Preliminary</SelectItem>
                  <SelectItem value="quarterfinal">Quarter-Final</SelectItem>
                  <SelectItem value="semifinal">Semi-Final</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="newRoundDate">Date</Label>
              <Input
                id="newRoundDate"
                type="date"
                value={newRound.date}
                onChange={(e) => setNewRound({ ...newRound, date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="newRoundTime">Time</Label>
              <Input
                id="newRoundTime"
                type="time"
                value={newRound.time}
                onChange={(e) => setNewRound({ ...newRound, time: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="newRoundDescription">Description</Label>
              <Input
                id="newRoundDescription"
                placeholder="Optional description"
                value={newRound.description}
                onChange={(e) => setNewRound({ ...newRound, description: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={addRound} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Round
              </Button>
            </div>
          </div>

          {/* Existing Rounds */}
          <div className="space-y-3">
            {roundsConfig.length > 0 ? (
              roundsConfig.map((round) => (
                <div key={round.id} className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border rounded-lg">
                  <div>
                    <Input
                      value={round.name}
                      onChange={(e) => updateRound(round.id, 'name', e.target.value)}
                      placeholder="Round name"
                    />
                  </div>

                  <div>
                    <Badge className={getRoundTypeColor(round.type)}>{round.type}</Badge>
                  </div>

                  <div>
                    <Input
                      type="date"
                      value={round.date}
                      onChange={(e) => updateRound(round.id, 'date', e.target.value)}
                    />
                  </div>

                  <div>
                    <Input
                      type="time"
                      value={round.time || '09:00'}
                      onChange={(e) => updateRound(round.id, 'time', e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      value={round.description || ''}
                      onChange={(e) => updateRound(round.id, 'description', e.target.value)}
                      placeholder="Description (optional)"
                    />
                  </div>

                  <div className="flex items-center">
                    <Button
                      onClick={() => removeRound(round.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No rounds configured yet. Add your first round above.</p>
              </div>
            )}
          </div>

          {/* Round Summary */}
          {roundsConfig.length > 0 && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <h4 className="font-medium mb-2 text-foreground">Tournament Schedule Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Rounds:</span>
                  <span className="ml-2 font-medium">{roundsConfig.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">First Round:</span>
                  <span className="ml-2 font-medium">
                    {roundsConfig.length > 0 && format(parseISO(roundsConfig[0].date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Round:</span>
                  <span className="ml-2 font-medium">
                    {roundsConfig.length > 0 && 
                      format(parseISO(roundsConfig[roundsConfig.length - 1].date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentCalendarConfig;

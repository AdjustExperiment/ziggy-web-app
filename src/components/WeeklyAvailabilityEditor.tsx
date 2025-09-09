import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export interface WeeklyAvailability {
  monday: { morning: boolean; afternoon: boolean; evening: boolean };
  tuesday: { morning: boolean; afternoon: boolean; evening: boolean };
  wednesday: { morning: boolean; afternoon: boolean; evening: boolean };
  thursday: { morning: boolean; afternoon: boolean; evening: boolean };
  friday: { morning: boolean; afternoon: boolean; evening: boolean };
  saturday: { morning: boolean; afternoon: boolean; evening: boolean };
  sunday: { morning: boolean; afternoon: boolean; evening: boolean };
}

interface WeeklyAvailabilityEditorProps {
  availability: WeeklyAvailability;
  onAvailabilityChange: (availability: WeeklyAvailability) => void;
  onSave: () => void;
  loading?: boolean;
  specializations?: string[];
  onSpecializationsChange?: (specializations: string[]) => void;
  showSpecializations?: boolean;
  hideSaveButton?: boolean;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
] as const;

const TIME_SLOTS = [
  { key: 'morning', label: 'Morning', icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', icon: '🌤️' },
  { key: 'evening', label: 'Evening', icon: '🌙' }
] as const;

const SPECIALIZATIONS = ['Parliamentary', 'Policy', 'Public Forum', 'Lincoln-Douglas', 'World Schools', 'Academic', 'British Parliamentary'];

export default function WeeklyAvailabilityEditor({
  availability,
  onAvailabilityChange,
  onSave,
  loading = false,
  specializations = [],
  onSpecializationsChange,
  showSpecializations = false,
  hideSaveButton = false
}: WeeklyAvailabilityEditorProps) {
  const updateAvailability = (day: keyof WeeklyAvailability, timeSlot: 'morning' | 'afternoon' | 'evening', value: boolean) => {
    const newAvailability = {
      ...availability,
      [day]: {
        ...availability[day],
        [timeSlot]: value
      }
    };
    onAvailabilityChange(newAvailability);
  };

  const setAllDayAvailability = (day: keyof WeeklyAvailability, value: boolean) => {
    const newAvailability = {
      ...availability,
      [day]: {
        morning: value,
        afternoon: value,
        evening: value
      }
    };
    onAvailabilityChange(newAvailability);
  };

  const setAllTimeSlotAvailability = (timeSlot: 'morning' | 'afternoon' | 'evening', value: boolean) => {
    const newAvailability = { ...availability };
    DAYS.forEach(day => {
      newAvailability[day.key] = {
        ...newAvailability[day.key],
        [timeSlot]: value
      };
    });
    onAvailabilityChange(newAvailability);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Weekly Availability
        </CardTitle>
        <CardDescription>
          Set your general availability for each day and time slot. This helps match you with appropriate debate rounds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showSpecializations && onSpecializationsChange && (
          <div className="space-y-2">
            <Label className="font-medium">Specializations</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SPECIALIZATIONS.map(spec => (
                <label key={spec} className="flex items-center space-x-2">
                  <Checkbox
                    checked={specializations.includes(spec)}
                    onCheckedChange={(checked) => {
                      const newSpecs = checked
                        ? [...specializations, spec]
                        : specializations.filter(s => s !== spec);
                      onSpecializationsChange(newSpecs);
                    }}
                  />
                  <span className="text-sm">{spec}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Time slot headers with bulk actions */}
        <div className="grid grid-cols-4 gap-4">
          <div className="font-medium">Day</div>
          {TIME_SLOTS.map(slot => (
            <div key={slot.key} className="text-center">
              <div className="font-medium text-sm">{slot.icon} {slot.label}</div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs mt-1"
                onClick={() => {
                  const allSelected = DAYS.every(day => availability[day.key][slot.key]);
                  setAllTimeSlotAvailability(slot.key, !allSelected);
                }}
              >
                {DAYS.every(day => availability[day.key][slot.key]) ? 'Clear All' : 'Select All'}
              </Button>
            </div>
          ))}
        </div>

        {/* Daily availability grid */}
        <div className="space-y-3">
          {DAYS.map(day => (
            <div key={day.key} className="grid grid-cols-4 gap-4 items-center">
              <div className="flex items-center justify-between">
                <Label className="font-medium">{day.label}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const dayAvailability = availability[day.key];
                    const allSelected = dayAvailability.morning && dayAvailability.afternoon && dayAvailability.evening;
                    setAllDayAvailability(day.key, !allSelected);
                  }}
                >
                  {availability[day.key].morning && availability[day.key].afternoon && availability[day.key].evening ? 'Clear' : 'All'}
                </Button>
              </div>
              
              {TIME_SLOTS.map(slot => (
                <div key={slot.key} className="flex items-center justify-center">
                  <Switch
                    checked={availability[day.key][slot.key]}
                    onCheckedChange={(checked) => updateAvailability(day.key, slot.key, checked)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Availability Summary</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {(() => {
              const totalSlots = 21; // 7 days × 3 time slots
              const availableSlots = DAYS.reduce((count, day) => {
                const dayAvailability = availability[day.key];
                return count + (dayAvailability.morning ? 1 : 0) + (dayAvailability.afternoon ? 1 : 0) + (dayAvailability.evening ? 1 : 0);
              }, 0);
              
              return `Available for ${availableSlots} out of ${totalSlots} time slots (${Math.round((availableSlots / totalSlots) * 100)}%)`;
            })()}
          </div>
        </div>

        {!hideSaveButton && (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Availability'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isSameDay, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { CalendarIcon, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  format: string;
  status: string;
  current_participants: number;
  max_participants: number;
  registration_open: boolean;
}

interface TournamentCalendarProps {
  tournaments: Tournament[];
  onTournamentSelect?: (tournament: Tournament) => void;
  className?: string;
}

export const TournamentCalendar = ({ tournaments, onTournamentSelect, className }: TournamentCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Get tournaments for the current month
  const monthTournaments = tournaments.filter(tournament => {
    const startDate = parseISO(tournament.start_date);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return startDate >= monthStart && startDate <= monthEnd;
  });

  // Get tournaments for selected date
  const selectedDateTournaments = selectedDate
    ? tournaments.filter(tournament => {
        const startDate = parseISO(tournament.start_date);
        const endDate = parseISO(tournament.end_date);
        return (
          isSameDay(selectedDate, startDate) ||
          isSameDay(selectedDate, endDate) ||
          (selectedDate >= startDate && selectedDate <= endDate)
        );
      })
    : monthTournaments;

  // Create date modifiers for tournament dates
  const tournamentDates = tournaments.map(tournament => parseISO(tournament.start_date));
  const modifiers = {
    tournament: tournamentDates,
  };

  const modifiersStyles = {
    tournament: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      fontWeight: 'bold',
    },
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CalendarIcon className="h-5 w-5" />
            Tournament Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar */}
            <div className="flex-shrink-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="pointer-events-auto border border-border/20 rounded-lg bg-background/50"
              />
            </div>

            {/* Tournament List */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedDate 
                    ? `Tournaments on ${format(selectedDate, "MMMM d, yyyy")}`
                    : `Tournaments in ${format(currentMonth, "MMMM yyyy")}`
                  }
                </h3>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  {selectedDateTournaments.length} tournaments
                </Badge>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedDateTournaments.length > 0 ? (
                  selectedDateTournaments.map((tournament) => (
                    <Card key={tournament.id} className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground line-clamp-1">
                                {tournament.name}
                              </h4>
                              <Badge 
                                variant={tournament.registration_open ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {tournament.status}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {tournament.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {tournament.current_participants}/{tournament.max_participants}
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              {format(parseISO(tournament.start_date), "MMM d")} - {format(parseISO(tournament.end_date), "MMM d, yyyy")}
                            </div>
                          </div>

                          {onTournamentSelect && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onTournamentSelect(tournament)}
                              className="ml-4 text-xs"
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No tournaments scheduled for this {selectedDate ? 'date' : 'month'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
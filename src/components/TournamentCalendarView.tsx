import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, Plus, ExternalLink } from 'lucide-react';
import { format, parseISO, isSameDay, addDays, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  venue_details?: string;
  description?: string;
  format: string;
  status: string;
}

interface TournamentCalendarViewProps {
  tournament: Tournament;
  className?: string;
}

export const TournamentCalendarView: React.FC<TournamentCalendarViewProps> = ({ 
  tournament, 
  className 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(parseISO(tournament.start_date));
  
  const startDate = parseISO(tournament.start_date);
  const endDate = parseISO(tournament.end_date);
  const duration = differenceInDays(endDate, startDate) + 1;
  
  // Generate all tournament dates
  const tournamentDates = [];
  for (let i = 0; i < duration; i++) {
    tournamentDates.push(addDays(startDate, i));
  }
  
  // Create modifiers for tournament dates
  const modifiers = {
    tournamentStart: [startDate],
    tournamentEnd: [endDate],
    tournamentDays: tournamentDates,
  };
  
  const modifiersStyles = {
    tournamentStart: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      fontWeight: 'bold',
      borderRadius: '8px 0 0 8px',
    },
    tournamentEnd: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      fontWeight: 'bold',
      borderRadius: '0 8px 8px 0',
    },
    tournamentDays: {
      backgroundColor: 'hsl(var(--primary) / 0.1)',
      border: '1px solid hsl(var(--primary) / 0.3)',
      color: 'hsl(var(--primary))',
    },
  };

  const exportToCalendar = () => {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tournament App//Tournament Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:tournament-${tournament.id}@tournamentapp.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(addDays(endDate, 1))}
SUMMARY:${tournament.name}
DESCRIPTION:${tournament.description || ''}${tournament.format ? '\\n\\nFormat: ' + tournament.format : ''}${tournament.status ? '\\n\\nStatus: ' + tournament.status : ''}
LOCATION:${tournament.venue_details || tournament.location}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tournament.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Calendar Exported",
      description: "Tournament dates added to your calendar app",
    });
  };

  const generateCalendarLinks = () => {
    const formatDateForUrl = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startFormatted = formatDateForUrl(startDate);
    const endFormatted = formatDateForUrl(addDays(endDate, 1));
    const title = encodeURIComponent(tournament.name);
    const details = encodeURIComponent(tournament.description || '');
    const location = encodeURIComponent(tournament.venue_details || tournament.location);

    return {
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startFormatted}/${endFormatted}&details=${details}&location=${location}`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startFormatted}&enddt=${endFormatted}&body=${details}&location=${location}`,
      yahoo: `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${startFormatted}&et=${endFormatted}&desc=${details}&in_loc=${location}`,
    };
  };

  const calendarLinks = generateCalendarLinks();

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
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
                month={startDate}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className={cn("pointer-events-auto border border-border/20 rounded-lg bg-background/50")}
                defaultMonth={startDate}
              />
            </div>

            {/* Tournament Details */}
            <div className="flex-1 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{tournament.name}</h3>
                  <Badge variant={tournament.status === 'Registration Open' ? 'default' : 'secondary'}>
                    {tournament.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {format(startDate, "EEEE, MMMM d, yyyy")} - {format(endDate, "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Duration: {duration} day{duration > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="bg-muted/20 p-4 rounded-lg border border-border/20">
                  <h4 className="font-medium mb-2 text-foreground">Tournament Dates</h4>
                  <div className="space-y-2">
                    {tournamentDates.map((date, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div 
                          className={cn(
                            "w-3 h-3 rounded-full",
                            isSameDay(date, startDate) && "bg-primary",
                            isSameDay(date, endDate) && "bg-primary",
                            !isSameDay(date, startDate) && !isSameDay(date, endDate) && "bg-primary/30"
                          )}
                        />
                        <span className="text-muted-foreground">
                          {format(date, "EEEE, MMM d")}
                          {isSameDay(date, startDate) && " (Start)"}
                          {isSameDay(date, endDate) && " (End)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="border-t border-border/20 pt-4 space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add to Your Calendar
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Download .ics file */}
              <Button
                onClick={exportToCalendar}
                variant="outline"
                className="flex items-center gap-2 justify-start h-auto p-3"
              >
                <Download className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Download</div>
                  <div className="text-xs text-muted-foreground">.ics file</div>
                </div>
              </Button>

              {/* Google Calendar */}
              <Button
                onClick={() => window.open(calendarLinks.google, '_blank')}
                variant="outline"
                className="flex items-center gap-2 justify-start h-auto p-3"
              >
                <ExternalLink className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Google</div>
                  <div className="text-xs text-muted-foreground">Calendar</div>
                </div>
              </Button>

              {/* Outlook */}
              <Button
                onClick={() => window.open(calendarLinks.outlook, '_blank')}
                variant="outline"
                className="flex items-center gap-2 justify-start h-auto p-3"
              >
                <ExternalLink className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Outlook</div>
                  <div className="text-xs text-muted-foreground">Calendar</div>
                </div>
              </Button>

              {/* Yahoo */}
              <Button
                onClick={() => window.open(calendarLinks.yahoo, '_blank')}
                variant="outline"
                className="flex items-center gap-2 justify-start h-auto p-3"
              >
                <ExternalLink className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Yahoo</div>
                  <div className="text-xs text-muted-foreground">Calendar</div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentCalendarView;
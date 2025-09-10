import { Calendar } from "@/components/ui/calendar";
import { parseISO, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface TournamentCardCalendarProps {
  startDate: string;
  endDate: string;
  className?: string;
  variant?: 'default' | 'mini';
}

export const TournamentCardCalendar = ({ startDate, endDate, className, variant = 'default' }: TournamentCardCalendarProps) => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  // Create date modifiers for tournament duration
  const tournamentDates = [];
  const current = new Date(start);
  
  while (current <= end) {
    tournamentDates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const modifiers = {
    tournament: tournamentDates,
    tournamentStart: [start],
    tournamentEnd: [end],
  };

  const modifiersStyles = {
    tournament: {
      backgroundColor: 'hsl(var(--primary)/0.2)',
      color: 'hsl(var(--foreground))',
    },
    tournamentStart: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      fontWeight: 'bold',
    },
    tournamentEnd: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      fontWeight: 'bold',
    },
  };

  const isMini = variant === 'mini';

  return (
    <div className={cn(
      "bg-muted/20 rounded-lg border border-border/20",
      isMini ? "p-2" : "p-3",
      className
    )}>
      {!isMini && <div className="text-xs text-muted-foreground mb-2">Tournament Schedule</div>}
      <Calendar
        mode="single"
        month={start}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className={cn(
          "pointer-events-auto w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-cell]:text-xs [&_.rdp-head_cell]:text-xs",
          isMini 
            ? "[&_.rdp-day]:h-4 [&_.rdp-day]:w-4 [&_.rdp-day]:text-[10px] [&_.rdp-caption_label]:text-xs [&_.rdp-nav]:hidden [&_.rdp-head_cell]:text-[9px] [&_.rdp-head_cell]:p-0"
            : "[&_.rdp-day]:h-6 [&_.rdp-day]:w-6 [&_.rdp-day]:text-xs [&_.rdp-caption_label]:text-sm"
        )}
        showOutsideDays={false}
        disabled={isMini ? { before: new Date(0) } : undefined}
      />
    </div>
  );
};
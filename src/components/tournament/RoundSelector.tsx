import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Round {
  id: string;
  name: string;
  round_number: number;
  status: string;
  scheduled_date: string | null;
}

interface RoundSelectorProps {
  rounds: Round[];
  selectedRoundId: string | null;
  onSelectRound: (roundId: string) => void;
}

export default function RoundSelector({ rounds, selectedRoundId, onSelectRound }: RoundSelectorProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <Circle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (rounds.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No rounds have been created yet.
      </div>
    );
  }

  // Sort rounds by round_number
  const sortedRounds = [...rounds].sort((a, b) => a.round_number - b.round_number);

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 p-1">
        {sortedRounds.map((round) => (
          <Button
            key={round.id}
            variant={selectedRoundId === round.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectRound(round.id)}
            className={cn(
              'shrink-0 gap-2',
              selectedRoundId === round.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
            )}
          >
            {getStatusIcon(round.status)}
            <span>{round.name}</span>
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

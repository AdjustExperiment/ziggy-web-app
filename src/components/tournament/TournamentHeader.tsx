import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Megaphone, Trophy, MessageCircle, ChevronDown, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { TournamentAnnouncements } from '@/components/TournamentAnnouncements';
import TournamentChat from './TournamentChat';

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  is_online: boolean;
  tournament_type: string | null;
}

interface Sponsor {
  id: string;
  company_name: string;
  logo_url: string | null;
  tier: string;
}

interface TournamentHeaderProps {
  tournament: Tournament;
  sponsors?: Sponsor[];
  formatName?: string;
}

export default function TournamentHeader({ tournament, sponsors = [], formatName }: TournamentHeaderProps) {
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [sponsorsOpen, setSponsorsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
      case 'planning': return 'Planning';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tournament Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{tournament.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
            {formatName && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {formatName}
              </Badge>
            )}
            <Badge className={getStatusColor(tournament.status)}>
              {getStatusLabel(tournament.status)}
            </Badge>
            {tournament.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {tournament.location}
              </span>
            )}
            {tournament.start_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(tournament.start_date), 'MMM d, yyyy')}
                {tournament.end_date && ` - ${format(new Date(tournament.end_date), 'MMM d, yyyy')}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={announcementsOpen ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setAnnouncementsOpen(!announcementsOpen)}
          className="gap-2"
        >
          <Megaphone className="h-4 w-4" />
          Announcements
          <ChevronDown className={`h-4 w-4 transition-transform ${announcementsOpen ? 'rotate-180' : ''}`} />
        </Button>
        
        {sponsors.length > 0 && (
          <Button
            variant={sponsorsOpen ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSponsorsOpen(!sponsorsOpen)}
            className="gap-2"
          >
            <Trophy className="h-4 w-4" />
            Sponsors
            <ChevronDown className={`h-4 w-4 transition-transform ${sponsorsOpen ? 'rotate-180' : ''}`} />
          </Button>
        )}
        
        <Button
          variant={chatOpen ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setChatOpen(!chatOpen)}
          className="gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Tournament Chat
          <ChevronDown className={`h-4 w-4 transition-transform ${chatOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Collapsible Panels */}
      <Collapsible open={announcementsOpen} onOpenChange={setAnnouncementsOpen}>
        <CollapsibleContent className="mt-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <TournamentAnnouncements tournamentId={tournament.id} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {sponsors.length > 0 && (
        <Collapsible open={sponsorsOpen} onOpenChange={setSponsorsOpen}>
          <CollapsibleContent className="mt-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold mb-3">Tournament Sponsors</h3>
              <div className="flex flex-wrap gap-4">
                {sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    {sponsor.logo_url && (
                      <img src={sponsor.logo_url} alt={sponsor.company_name} className="h-8 w-8 object-contain" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{sponsor.company_name}</p>
                      <Badge variant="outline" className="text-xs capitalize">{sponsor.tier}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Collapsible open={chatOpen} onOpenChange={setChatOpen}>
        <CollapsibleContent className="mt-2">
          <div className="rounded-lg border border-border bg-card">
            <TournamentChat tournamentId={tournament.id} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

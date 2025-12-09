import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PrintablePostingsProps {
  tournamentId: string;
  roundId: string;
  eventId?: string;
}

interface PostingData {
  id: string;
  room: string | null;
  scheduled_time: string | null;
  aff_registration: {
    participant_name: string;
    school_organization: string | null;
    partner_name: string | null;
  } | null;
  neg_registration: {
    participant_name: string;
    school_organization: string | null;
    partner_name: string | null;
  } | null;
  judge_profiles: {
    name: string;
  } | null;
  pairing_judge_assignments: {
    judge_profile: {
      name: string;
    } | null;
    role: string;
  }[];
}

interface TournamentData {
  name: string;
  location: string | null;
}

interface RoundData {
  name: string;
  scheduled_date: string | null;
  round_number: number;
}

interface EventData {
  name: string;
  short_code: string;
}

interface ResolutionData {
  resolution_text: string;
  is_released: boolean;
}

export function PrintablePostings({ tournamentId, roundId, eventId }: PrintablePostingsProps) {
  const [postings, setPostings] = useState<PostingData[]>([]);
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [round, setRound] = useState<RoundData | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [resolution, setResolution] = useState<ResolutionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [tournamentId, roundId, eventId]);

  const fetchData = async () => {
    try {
      // Fetch tournament
      const { data: tournamentData } = await supabase
        .from('tournaments')
        .select('name, location')
        .eq('id', tournamentId)
        .single();
      setTournament(tournamentData);

      // Fetch round
      const { data: roundData } = await supabase
        .from('rounds')
        .select('name, scheduled_date, round_number')
        .eq('id', roundId)
        .single();
      setRound(roundData);

      // Fetch event if specified
      if (eventId) {
        const { data: eventData } = await supabase
          .from('tournament_events')
          .select('name, short_code')
          .eq('id', eventId)
          .single();
        setEvent(eventData);
      }

      // Fetch resolution for this round
      const { data: resolutionData } = await supabase
        .from('resolutions')
        .select('resolution_text, is_released')
        .eq('round_id', roundId)
        .eq('is_released', true)
        .single();
      setResolution(resolutionData);

      // Build pairings query
      let query = supabase
        .from('pairings')
        .select(`
          id,
          room,
          scheduled_time,
          aff_registration:tournament_registrations!aff_registration_id(
            participant_name, 
            school_organization,
            partner_name
          ),
          neg_registration:tournament_registrations!neg_registration_id(
            participant_name,
            school_organization,
            partner_name
          ),
          judge_profiles(name),
          pairing_judge_assignments(
            judge_profile:judge_profiles(name),
            role
          )
        `)
        .eq('round_id', roundId)
        .eq('released', true)
        .order('room');

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data: pairingsData } = await query;
      setPostings((pairingsData as any) || []);
    } catch (error) {
      console.error('Error fetching print data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJudgeNames = (posting: PostingData): string => {
    const judges: string[] = [];
    
    // Add primary judge
    if (posting.judge_profiles?.name) {
      judges.push(posting.judge_profiles.name);
    }
    
    // Add panel judges
    if (posting.pairing_judge_assignments?.length > 0) {
      posting.pairing_judge_assignments.forEach(assignment => {
        if (assignment.judge_profile?.name && !judges.includes(assignment.judge_profile.name)) {
          const roleLabel = assignment.role === 'chair' ? ' (C)' : '';
          judges.push(assignment.judge_profile.name + roleLabel);
        }
      });
    }
    
    return judges.length > 0 ? judges.join(', ') : 'TBA';
  };

  const formatTime = (time: string | null): string => {
    if (!time) return '—';
    try {
      return format(new Date(time), 'h:mm a');
    } catch {
      return time;
    }
  };

  const formatParticipant = (reg: PostingData['aff_registration']): { name: string; school: string } => {
    if (!reg) return { name: 'TBA', school: '' };
    const name = reg.partner_name 
      ? `${reg.participant_name} & ${reg.partner_name}`
      : reg.participant_name;
    return { name, school: reg.school_organization || '' };
  };

  if (loading) {
    return (
      <div className="print-loading">
        <p>Loading postings...</p>
      </div>
    );
  }

  return (
    <div className="print-container">
      {/* Header */}
      <header className="print-header">
        <h1 className="print-tournament-name">{tournament?.name || 'Tournament'}</h1>
        {event && (
          <h2 className="print-event-name">{event.name}</h2>
        )}
        <h3 className="print-round-name">{round?.name || 'Round'} POSTINGS</h3>
        {round?.scheduled_date && (
          <p className="print-date">{format(new Date(round.scheduled_date), 'MMMM d, yyyy')}</p>
        )}
      </header>

      {/* Resolution */}
      {resolution && (
        <div className="print-resolution">
          <strong>Resolution:</strong> {resolution.resolution_text}
        </div>
      )}

      {/* Postings Table */}
      <table className="print-table">
        <thead>
          <tr>
            <th className="print-th-room">ROOM</th>
            <th className="print-th-team">AFFIRMATIVE</th>
            <th className="print-th-team">NEGATIVE</th>
            <th className="print-th-judge">JUDGE(S)</th>
            <th className="print-th-time">TIME</th>
          </tr>
        </thead>
        <tbody>
          {postings.map((posting, index) => {
            const aff = formatParticipant(posting.aff_registration);
            const neg = formatParticipant(posting.neg_registration);
            return (
              <tr key={posting.id} className={index % 2 === 0 ? 'print-row-even' : 'print-row-odd'}>
                <td className="print-td-room">{posting.room || 'TBA'}</td>
                <td className="print-td-team">
                  <div className="print-team-name">{aff.name}</div>
                  {aff.school && <div className="print-team-school">({aff.school})</div>}
                </td>
                <td className="print-td-team">
                  <div className="print-team-name">{neg.name}</div>
                  {neg.school && <div className="print-team-school">({neg.school})</div>}
                </td>
                <td className="print-td-judge">{getJudgeNames(posting)}</td>
                <td className="print-td-time">{formatTime(posting.scheduled_time)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {postings.length === 0 && (
        <div className="print-no-postings">
          <p>No released pairings found for this round.</p>
        </div>
      )}

      {/* Footer */}
      <footer className="print-footer">
        <p>Generated: {format(new Date(), 'MMM d, yyyy \'at\' h:mm a')}</p>
        {tournament?.location && <p>{tournament.location}</p>}
      </footer>

      {/* Print button - hidden when printing */}
      <div className="no-print print-actions">
        <button onClick={() => window.print()} className="print-button">
          Print Postings
        </button>
        <button onClick={() => window.close()} className="print-button-secondary">
          Close
        </button>
      </div>
    </div>
  );
}

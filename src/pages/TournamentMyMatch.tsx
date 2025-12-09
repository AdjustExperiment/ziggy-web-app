import React from 'react';
import { useParams } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import { EnhancedMyMatch } from '@/components/EnhancedMyMatch';
import { TournamentAnnouncements } from '@/components/TournamentAnnouncements';

export default function TournamentMyMatch() {
  const { tournamentId } = useParams<{ tournamentId: string }>();

  if (!tournamentId) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <BackButton fallbackRoute={`/tournaments/${tournamentId}`}>
        Back to Tournament
      </BackButton>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Match</h1>
          <p className="text-muted-foreground">
            Manage your match details, chat, and schedule proposals
          </p>
        </div>

        {/* Tournament Announcements */}
        <TournamentAnnouncements tournamentId={tournamentId} />

        <EnhancedMyMatch />
      </div>
    </div>
  );
}
import React from 'react';
import { useParams } from 'react-router-dom';
import { LiveDashboard } from '@/components/LiveDashboard';
import { BackButton } from '@/components/ui/back-button';

export default function TournamentDashboard() {
  const { tournamentId } = useParams<{ tournamentId: string }>();

  if (!tournamentId) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <BackButton fallbackRoute={`/tournaments/${tournamentId}`}>
        Back to Tournament
      </BackButton>
      <LiveDashboard tournamentId={tournamentId} />
    </div>
  );
}


import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PrintablePostings } from '@/components/admin/PrintablePostings';

export default function PrintPostings() {
  const { tournamentId, roundId } = useParams<{ tournamentId: string; roundId: string }>();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') || undefined;

  useEffect(() => {
    // Auto-trigger print dialog after content loads
    const timer = setTimeout(() => {
      // Only auto-print if explicitly requested
      if (searchParams.get('autoPrint') === 'true') {
        window.print();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  if (!tournamentId || !roundId) {
    return (
      <div className="print-error">
        <h1>Error</h1>
        <p>Missing tournament or round information.</p>
      </div>
    );
  }

  return (
    <PrintablePostings 
      tournamentId={tournamentId} 
      roundId={roundId} 
      eventId={eventId}
    />
  );
}

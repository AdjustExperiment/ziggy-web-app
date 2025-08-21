
import React from 'react';
import DOMPurify from 'dompurify';

interface TournamentInfoProps {
  tournamentInfo: string;
  className?: string;
}

const TournamentInfo: React.FC<TournamentInfoProps> = ({ 
  tournamentInfo, 
  className = "" 
}) => {
  if (!tournamentInfo) return null;

  const sanitizedContent = DOMPurify.sanitize(tournamentInfo);

  return (
    <div 
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default TournamentInfo;

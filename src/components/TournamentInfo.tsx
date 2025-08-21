
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
      className={`text-sm leading-relaxed [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mb-2 [&_h1]:mt-0 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-0 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mb-1 [&_h3]:mt-0 [&_p]:mb-2 [&_p]:mt-0 [&_ul]:mb-2 [&_ul]:mt-0 [&_ol]:mb-2 [&_ol]:mt-0 [&_li]:mb-1 [&_strong]:font-semibold [&_a]:underline [&_a]:underline-offset-2 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default TournamentInfo;

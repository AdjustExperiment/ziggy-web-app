import { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Trophy, Users } from 'lucide-react';

interface BracketTeam {
  id: string;
  name: string;
  seed?: number;
  school?: string;
  score?: number;
  isWinner?: boolean;
}

interface BracketMatch {
  id: string;
  roundNumber: number;
  matchNumber: number;
  team1: BracketTeam | null;
  team2: BracketTeam | null;
  winnerId?: string | null;
  room?: string | null;
  scheduledTime?: string | null;
  status: 'pending' | 'in_progress' | 'completed';
}

interface TournamentBracketProps {
  matches: BracketMatch[];
  totalRounds: number;
  onMatchClick?: (match: BracketMatch) => void;
  className?: string;
}

export default function TournamentBracket({
  matches,
  totalRounds,
  onMatchClick,
  className = ''
}: TournamentBracketProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Dimensions
  const matchWidth = 200;
  const matchHeight = 80;
  const roundGap = 80;
  const matchGap = 20;

  // Group matches by round
  const matchesByRound = useMemo(() => {
    const grouped: Record<number, BracketMatch[]> = {};
    matches.forEach(match => {
      if (!grouped[match.roundNumber]) {
        grouped[match.roundNumber] = [];
      }
      grouped[match.roundNumber].push(match);
    });
    // Sort each round by match number
    Object.values(grouped).forEach(roundMatches => {
      roundMatches.sort((a, b) => a.matchNumber - b.matchNumber);
    });
    return grouped;
  }, [matches]);

  // Calculate SVG dimensions
  const svgWidth = useMemo(() => {
    return totalRounds * (matchWidth + roundGap) + 100;
  }, [totalRounds]);

  const svgHeight = useMemo(() => {
    const firstRoundMatches = matchesByRound[1]?.length || 0;
    return Math.max(firstRoundMatches * (matchHeight + matchGap) + 100, 400);
  }, [matchesByRound]);

  // Get round name
  const getRoundName = (roundNumber: number) => {
    const remaining = totalRounds - roundNumber + 1;
    if (remaining === 1) return 'Finals';
    if (remaining === 2) return 'Semi-Finals';
    if (remaining === 3) return 'Quarter-Finals';
    return `Round of ${Math.pow(2, remaining)}`;
  };

  // Draw bracket using D3
  useEffect(() => {
    if (!svgRef.current || matches.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${pan.x}, ${pan.y}) scale(${zoom})`);

    // Draw connections first (behind matches)
    const connections = g.append('g').attr('class', 'connections');
    
    // Draw round labels
    for (let round = 1; round <= totalRounds; round++) {
      const x = 50 + (round - 1) * (matchWidth + roundGap);
      
      g.append('text')
        .attr('x', x + matchWidth / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('fill', 'hsl(var(--foreground))')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .text(getRoundName(round));
    }

    // Draw matches and connections for each round
    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = matchesByRound[round] || [];
      const x = 50 + (round - 1) * (matchWidth + roundGap);
      
      // Calculate vertical spacing to center matches
      const totalMatchesHeight = roundMatches.length * (matchHeight + matchGap);
      const startY = (svgHeight - totalMatchesHeight) / 2 + 30;

      roundMatches.forEach((match, index) => {
        const y = startY + index * (matchHeight + matchGap);

        // Draw match box
        const matchGroup = g.append('g')
          .attr('class', 'match')
          .attr('cursor', 'pointer')
          .on('click', () => onMatchClick?.(match));

        // Background
        matchGroup.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', matchWidth)
          .attr('height', matchHeight)
          .attr('rx', 8)
          .attr('ry', 8)
          .attr('fill', match.status === 'completed' 
            ? 'hsl(var(--muted))' 
            : match.status === 'in_progress'
            ? 'hsl(var(--primary) / 0.1)'
            : 'hsl(var(--card))')
          .attr('stroke', match.status === 'in_progress' 
            ? 'hsl(var(--primary))' 
            : 'hsl(var(--border))')
          .attr('stroke-width', 1);

        // Divider line
        matchGroup.append('line')
          .attr('x1', x)
          .attr('x2', x + matchWidth)
          .attr('y1', y + matchHeight / 2)
          .attr('y2', y + matchHeight / 2)
          .attr('stroke', 'hsl(var(--border))')
          .attr('stroke-width', 1);

        // Team 1
        if (match.team1) {
          const isWinner = match.winnerId === match.team1.id;
          
          matchGroup.append('text')
            .attr('x', x + 10)
            .attr('y', y + matchHeight / 4 + 5)
            .attr('fill', isWinner ? 'hsl(var(--primary))' : 'hsl(var(--foreground))')
            .attr('font-size', '12px')
            .attr('font-weight', isWinner ? '600' : '400')
            .text(match.team1.name.substring(0, 20) + (match.team1.name.length > 20 ? '...' : ''));
          
          if (match.team1.seed) {
            matchGroup.append('text')
              .attr('x', x + matchWidth - 10)
              .attr('y', y + matchHeight / 4 + 5)
              .attr('text-anchor', 'end')
              .attr('fill', 'hsl(var(--muted-foreground))')
              .attr('font-size', '10px')
              .text(`#${match.team1.seed}`);
          }
          
          if (isWinner) {
            matchGroup.append('circle')
              .attr('cx', x + matchWidth - 25)
              .attr('cy', y + matchHeight / 4)
              .attr('r', 6)
              .attr('fill', 'hsl(var(--primary))');
          }
        } else {
          matchGroup.append('text')
            .attr('x', x + 10)
            .attr('y', y + matchHeight / 4 + 5)
            .attr('fill', 'hsl(var(--muted-foreground))')
            .attr('font-size', '12px')
            .attr('font-style', 'italic')
            .text('TBD');
        }

        // Team 2
        if (match.team2) {
          const isWinner = match.winnerId === match.team2.id;
          
          matchGroup.append('text')
            .attr('x', x + 10)
            .attr('y', y + (matchHeight * 3) / 4 + 5)
            .attr('fill', isWinner ? 'hsl(var(--primary))' : 'hsl(var(--foreground))')
            .attr('font-size', '12px')
            .attr('font-weight', isWinner ? '600' : '400')
            .text(match.team2.name.substring(0, 20) + (match.team2.name.length > 20 ? '...' : ''));
          
          if (match.team2.seed) {
            matchGroup.append('text')
              .attr('x', x + matchWidth - 10)
              .attr('y', y + (matchHeight * 3) / 4 + 5)
              .attr('text-anchor', 'end')
              .attr('fill', 'hsl(var(--muted-foreground))')
              .attr('font-size', '10px')
              .text(`#${match.team2.seed}`);
          }
          
          if (isWinner) {
            matchGroup.append('circle')
              .attr('cx', x + matchWidth - 25)
              .attr('cy', y + (matchHeight * 3) / 4)
              .attr('r', 6)
              .attr('fill', 'hsl(var(--primary))');
          }
        } else {
          matchGroup.append('text')
            .attr('x', x + 10)
            .attr('y', y + (matchHeight * 3) / 4 + 5)
            .attr('fill', 'hsl(var(--muted-foreground))')
            .attr('font-size', '12px')
            .attr('font-style', 'italic')
            .text('TBD');
        }

        // Draw connection to next round
        if (round < totalRounds) {
          const nextRoundMatches = matchesByRound[round + 1] || [];
          const nextMatchIndex = Math.floor(index / 2);
          
          if (nextRoundMatches[nextMatchIndex]) {
            const nextX = x + matchWidth + roundGap;
            const nextTotalHeight = nextRoundMatches.length * (matchHeight + matchGap);
            const nextStartY = (svgHeight - nextTotalHeight) / 2 + 30;
            const nextY = nextStartY + nextMatchIndex * (matchHeight + matchGap);
            
            const isTopMatch = index % 2 === 0;
            const connectionY = nextY + (isTopMatch ? matchHeight / 4 : (matchHeight * 3) / 4);
            
            connections.append('path')
              .attr('d', `
                M ${x + matchWidth} ${y + matchHeight / 2}
                H ${x + matchWidth + roundGap / 2}
                V ${connectionY}
                H ${nextX}
              `)
              .attr('fill', 'none')
              .attr('stroke', 'hsl(var(--border))')
              .attr('stroke-width', 2);
          }
        }
      });
    }

    // Draw finals trophy
    const finalsMatch = matchesByRound[totalRounds]?.[0];
    if (finalsMatch && finalsMatch.winnerId) {
      const finalsX = 50 + (totalRounds - 1) * (matchWidth + roundGap);
      const winner = finalsMatch.winnerId === finalsMatch.team1?.id 
        ? finalsMatch.team1 
        : finalsMatch.team2;
      
      if (winner) {
        const trophyX = finalsX + matchWidth + 40;
        const trophyY = svgHeight / 2 - 20;
        
        g.append('text')
          .attr('x', trophyX)
          .attr('y', trophyY)
          .attr('font-size', '32px')
          .text('🏆');
        
        g.append('text')
          .attr('x', trophyX)
          .attr('y', trophyY + 40)
          .attr('fill', 'hsl(var(--primary))')
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .text(winner.name);
      }
    }
  }, [matches, matchesByRound, totalRounds, svgWidth, svgHeight, zoom, pan, onMatchClick]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.4));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (matches.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No elimination bracket data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Elimination Bracket
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted border border-border" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Winner</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef}
          className="overflow-auto border rounded-lg bg-background"
          style={{ maxHeight: '600px' }}
        >
          <svg
            ref={svgRef}
            width={svgWidth * zoom}
            height={svgHeight * zoom}
            style={{ minWidth: '100%' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

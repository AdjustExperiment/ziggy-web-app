import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, User } from 'lucide-react';
import { Ballot } from '@/types/database';

interface MatchResultsCardProps {
  ballot: Ballot | null;
  isPublished: boolean;
  affTeam: string;
  negTeam: string;
  isAff: boolean;
  showJudgeName?: boolean;
}

export function MatchResultsCard({ 
  ballot, 
  isPublished, 
  affTeam, 
  negTeam, 
  isAff,
  showJudgeName = true
}: MatchResultsCardProps) {
  // If no ballot or not published, show "Results Pending"
  if (!ballot || !isPublished) {
    return (
      <Card className="border-dashed border-muted-foreground/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Results Pending
          </CardTitle>
          <CardDescription>
            Results will be available after they are released by the tournament administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <p className="text-sm">Check back later for the decision and feedback</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const winner = ballot.payload?.winner;
  const isWinner = (winner === 'aff' && isAff) || (winner === 'neg' && !isAff);
  // Support both naming conventions: aff_speaks/neg_speaks and aff_points/neg_points
  const affSpeaks = ballot.payload?.aff_speaks ?? ballot.payload?.aff_points;
  const negSpeaks = ballot.payload?.neg_speaks ?? ballot.payload?.neg_points;
  const feedback = isAff 
    ? (ballot.payload?.aff_feedback ?? ballot.payload?.aff_comments) 
    : (ballot.payload?.neg_feedback ?? ballot.payload?.neg_comments);
  const comments = ballot.payload?.comments;

  return (
    <Card className={isWinner ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className={`h-5 w-5 ${isWinner ? 'text-green-600' : 'text-muted-foreground'}`} />
            {isWinner ? 'Victory!' : 'Decision'}
          </CardTitle>
          <Badge variant={isWinner ? 'default' : 'secondary'}>
            {isWinner ? 'Won' : 'Lost'}
          </Badge>
        </div>
        {showJudgeName && ballot.judge_profiles && (
          <CardDescription className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Judge: {ballot.judge_profiles.name}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Winner Display */}
        <div className="flex items-center justify-between p-3 bg-background rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Winner</p>
            <p className="font-semibold">
              {winner === 'aff' ? affTeam : negTeam}
            </p>
          </div>
          <Badge variant="outline" className="uppercase">
            {winner === 'aff' ? 'Affirmative' : 'Negative'}
          </Badge>
        </div>

        {/* Speaker Points */}
        {(affSpeaks || negSpeaks) && (
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${isAff ? 'bg-primary/10' : 'bg-muted'}`}>
              <p className="text-sm font-medium text-muted-foreground">Your Speaker Points</p>
              <p className="text-2xl font-bold">
                {isAff ? affSpeaks : negSpeaks}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Opponent Points</p>
              <p className="text-2xl font-bold">
                {isAff ? negSpeaks : affSpeaks}
              </p>
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Judge Feedback</p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{feedback}</p>
            </div>
          </div>
        )}

        {/* General Comments */}
        {comments && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">General Comments</p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{comments}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

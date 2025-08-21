
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Brain, Target, Clock, MapPin, Users, Award, AlertTriangle } from 'lucide-react';

interface JudgeProfile {
  id: string;
  name: string;
  email: string;
  experience_level: string;
  specializations: string[];
}

interface JudgeAvailability {
  id: string;
  judge_profile_id: string;
  tournament_id: string;
  available_dates: string[];
  time_preferences: any;
  max_rounds_per_day: number;
  special_requirements: string;
  created_at: string;
  updated_at: string;
}

interface JudgeScore {
  judge: JudgeProfile;
  availability: JudgeAvailability;
  score: number;
  factors: {
    experience: number;
    availability: number;
    specialization: number;
    workload: number;
    conflicts: number;
  };
  warnings: string[];
}

interface Pairing {
  id: string;
  tournament_id: string;
  round_id: string;
  scheduled_time: string;
  aff_registration: {
    participant_name: string;
    school_organization: string;
  };
  neg_registration: {
    participant_name: string;
    school_organization: string;
  };
}

interface JudgeSelectionHeuristicsProps {
  tournamentId: string;
}

export default function JudgeSelectionHeuristics({ tournamentId }: JudgeSelectionHeuristicsProps) {
  const { toast } = useToast();
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [availabilities, setAvailabilities] = useState<JudgeAvailability[]>([]);
  const [selectedPairing, setSelectedPairing] = useState<string>('');
  const [judgeScores, setJudgeScores] = useState<JudgeScore[]>([]);
  const [loading, setLoading] = useState(true);

  const [weights, setWeights] = useState({
    experience: 25,
    availability: 30,
    specialization: 20,
    workload: 15,
    conflicts: 10
  });

  const [filters, setFilters] = useState({
    minExperience: 'novice',
    maxRoundsPerDay: 6,
    requireSpecialization: false,
    avoidConflicts: true
  });

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch pairings without judges assigned
      const { data: pairingsData, error: pairingsError } = await supabase
        .from('pairings')
        .select(`
          *,
          aff_registration:tournament_registrations!aff_registration_id(participant_name, school_organization),
          neg_registration:tournament_registrations!neg_registration_id(participant_name, school_organization)
        `)
        .eq('tournament_id', tournamentId)
        .is('judge_id', null);

      if (pairingsError) throw pairingsError;

      // Fetch judges
      const { data: judgesData, error: judgesError } = await supabase
        .from('judge_profiles')
        .select('*');

      if (judgesError) throw judgesError;

      // Fetch judge availability for this tournament
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('judge_availability')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (availabilityError) throw availabilityError;

      setPairings(pairingsData || []);
      setJudges(judgesData || []);
      
      // Process availability data to match expected format
      const processedAvailabilities: JudgeAvailability[] = (availabilityData || []).map(item => ({
        ...item,
        available_dates: Array.isArray(item.available_dates) 
          ? item.available_dates as string[]
          : typeof item.available_dates === 'string'
          ? JSON.parse(item.available_dates) || []
          : []
      }));
      
      setAvailabilities(processedAvailabilities);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tournament data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateJudgeScores = async (pairingId: string) => {
    const pairing = pairings.find(p => p.id === pairingId);
    if (!pairing) return;

    const scores: JudgeScore[] = [];

    for (const judge of judges) {
      const availability = availabilities.find(a => a.judge_profile_id === judge.id);
      if (!availability) continue;

      const score = await calculateIndividualScore(judge, availability, pairing);
      scores.push(score);
    }

    // Sort by score (descending) and update state
    scores.sort((a, b) => b.score - a.score);
    setJudgeScores(scores);
  };

  const calculateIndividualScore = async (
    judge: JudgeProfile, 
    availability: JudgeAvailability, 
    pairing: Pairing
  ): Promise<JudgeScore> => {
    const factors = {
      experience: 0,
      availability: 0,
      specialization: 0,
      workload: 0,
      conflicts: 0
    };
    const warnings: string[] = [];

    // Experience scoring
    const experienceLevels = { 'novice': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    factors.experience = (experienceLevels[judge.experience_level as keyof typeof experienceLevels] || 1) * 25;

    // Availability scoring
    const pairingDate = new Date(pairing.scheduled_time).toISOString().split('T')[0];
    const isAvailable = availability.available_dates.includes(pairingDate);
    factors.availability = isAvailable ? 100 : 0;
    
    if (!isAvailable) {
      warnings.push('Not available on the scheduled date');
    }

    // Time preference scoring
    const pairingTime = new Date(pairing.scheduled_time);
    const hour = pairingTime.getHours();
    let timeScore = 0;
    
    if (availability.time_preferences?.morning && hour >= 8 && hour < 12) timeScore += 30;
    if (availability.time_preferences?.afternoon && hour >= 12 && hour < 17) timeScore += 30;
    if (availability.time_preferences?.evening && hour >= 17 && hour < 21) timeScore += 30;
    
    factors.availability = Math.min(factors.availability + timeScore, 100);

    // Specialization scoring (if tournament has specific format requirements)
    // This would need tournament format data to be fully implemented
    factors.specialization = 50; // Default middle score

    // Workload scoring - check how many rounds this judge already has
    const { data: existingAssignments } = await supabase
      .from('pairing_judge_assignments')
      .select('id')
      .eq('judge_profile_id', judge.id)
      .eq('pairing_id', pairing.id); // This would need to be expanded to check all pairings for this judge

    const currentLoad = existingAssignments?.length || 0;
    const maxLoad = availability.max_rounds_per_day;
    factors.workload = Math.max(0, ((maxLoad - currentLoad) / maxLoad) * 100);

    if (currentLoad >= maxLoad) {
      warnings.push('Already at maximum rounds per day');
    }

    // Conflict scoring
    let conflicts: string[] = [];
    try {
      if (availability.special_requirements) {
        const parsed = JSON.parse(availability.special_requirements);
        conflicts = parsed.additional_data?.conflicts || [];
      }
    } catch (e) {
      conflicts = [];
    }

    const affSchool = pairing.aff_registration.school_organization;
    const negSchool = pairing.neg_registration.school_organization;
    
    const hasConflict = conflicts.some((conflict: string) => 
      conflict.toLowerCase().includes(affSchool?.toLowerCase() || '') ||
      conflict.toLowerCase().includes(negSchool?.toLowerCase() || '') ||
      conflict.toLowerCase().includes(pairing.aff_registration.participant_name.toLowerCase()) ||
      conflict.toLowerCase().includes(pairing.neg_registration.participant_name.toLowerCase())
    );

    factors.conflicts = hasConflict ? 0 : 100;
    
    if (hasConflict) {
      warnings.push('Has conflict of interest with participants');
    }

    // Calculate weighted total score
    const totalScore = (
      (factors.experience * weights.experience / 100) +
      (factors.availability * weights.availability / 100) +
      (factors.specialization * weights.specialization / 100) +
      (factors.workload * weights.workload / 100) +
      (factors.conflicts * weights.conflicts / 100)
    );

    return {
      judge,
      availability,
      score: Math.round(totalScore),
      factors,
      warnings
    };
  };

  const assignJudgeToPairing = async (judgeScore: JudgeScore) => {
    if (!selectedPairing) return;

    try {
      // Create judge assignment
      const { error } = await supabase
        .from('pairing_judge_assignments')
        .insert({
          pairing_id: selectedPairing,
          judge_profile_id: judgeScore.judge.id,
          role: 'chair', // Default to chair for single judge assignment
          status: 'assigned',
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${judgeScore.judge.name} assigned successfully`,
      });

      // Refresh data
      fetchData();
      setSelectedPairing('');
      setJudgeScores([]);
    } catch (error: any) {
      console.error('Error assigning judge:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign judge',
        variant: 'destructive',
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Judge Selection Heuristics
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered judge assignment recommendations based on availability, experience, and conflicts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Scoring Weights
            </CardTitle>
            <CardDescription>
              Adjust the importance of different factors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="capitalize">{key}</Label>
                  <span className="text-sm text-muted-foreground">{value}%</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([newValue]) => setWeights(prev => ({ ...prev, [key]: newValue }))}
                  max={50}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
            ))}
            
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium">Filters</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs">Minimum Experience</Label>
                  <Select 
                    value={filters.minExperience}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, minExperience: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novice">Novice</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filters.avoidConflicts}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, avoidConflicts: checked }))}
                  />
                  <Label className="text-xs">Avoid conflicts</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pairing Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select Pairing
            </CardTitle>
            <CardDescription>
              Choose a pairing that needs judge assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedPairing} onValueChange={setSelectedPairing}>
              <SelectTrigger>
                <SelectValue placeholder="Select a pairing" />
              </SelectTrigger>
              <SelectContent>
                {pairings.map(pairing => (
                  <SelectItem key={pairing.id} value={pairing.id}>
                    {pairing.aff_registration.participant_name} vs {pairing.neg_registration.participant_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedPairing && (
              <div className="mt-4">
                <Button 
                  onClick={() => calculateJudgeScores(selectedPairing)}
                  className="w-full"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Calculate Recommendations
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tournament Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Pairings</span>
              <span className="font-medium">{pairings.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Available Judges</span>
              <span className="font-medium">{judges.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Judge Availabilities</span>
              <span className="font-medium">{availabilities.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Judge Recommendations */}
      {judgeScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Judge Recommendations
            </CardTitle>
            <CardDescription>
              Ranked recommendations based on your criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {judgeScores.map((judgeScore, index) => (
                <div key={judgeScore.judge.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-lg">#{index + 1}</span>
                        <div>
                          <h4 className="font-medium">{judgeScore.judge.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {judgeScore.judge.experience_level} • {judgeScore.judge.email}
                          </p>
                        </div>
                        <Badge className={getScoreColor(judgeScore.score)}>
                          {judgeScore.score}/100
                        </Badge>
                      </div>

                      {/* Factor Breakdown */}
                      <div className="grid grid-cols-5 gap-2 mb-3">
                        {Object.entries(judgeScore.factors).map(([factor, score]) => (
                          <div key={factor} className="text-center">
                            <div className="text-xs text-muted-foreground capitalize">{factor}</div>
                            <div className="text-sm font-medium">{Math.round(score)}</div>
                          </div>
                        ))}
                      </div>

                      {/* Warnings */}
                      {judgeScore.warnings.length > 0 && (
                        <div className="flex items-start gap-2 mb-3">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <div className="text-sm text-yellow-700">
                            {judgeScore.warnings.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={() => assignJudgeToPairing(judgeScore)}
                      disabled={judgeScore.warnings.length > 0 && filters.avoidConflicts}
                      size="sm"
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

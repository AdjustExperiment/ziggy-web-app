import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Gavel } from 'lucide-react';

interface JudgeRegistrationProps {
  tournamentId: string;
  tournamentName: string;
  userId: string;
  userEmail: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const DEBATE_FORMATS = [
  { id: 'IPD', label: 'Individual Parliamentary Debate' },
  { id: 'TPD', label: 'Team Parliamentary Debate' },
  { id: 'TP', label: 'Team Policy' },
  { id: 'LD', label: 'Lincoln Douglas' },
  { id: 'CD', label: 'Coolidge Debate' },
  { id: 'MC', label: 'Moot Court' },
  { id: 'PF', label: 'Public Forum' },
  { id: 'BP', label: 'British Parliamentary' },
];

export function JudgeRegistration({ 
  tournamentId, 
  tournamentName, 
  userId, 
  userEmail,
  onSuccess, 
  onCancel 
}: JudgeRegistrationProps) {
  const { toast } = useToast();
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    experience_level: 'novice',
    experience_years: 0,
    qualifications: '',
    bio: '',
    specializations: [] as string[],
    alumni: false,
    notes: ''
  });

  useEffect(() => {
    checkExistingProfile();
  }, [userId]);

  const checkExistingProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('judge_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setExistingProfile(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          experience_level: data.experience_level || 'novice',
          experience_years: data.experience_years || 0,
          qualifications: data.qualifications || '',
          bio: data.bio || '',
          specializations: data.specializations || [],
          alumni: data.alumni || false,
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error checking judge profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialization = (formatId: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(formatId)
        ? prev.specializations.filter(s => s !== formatId)
        : [...prev.specializations, formatId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let judgeProfileId = existingProfile?.id;

      // Create judge profile if it doesn't exist
      if (!existingProfile) {
        const { data: newProfile, error: profileError } = await supabase
          .from('judge_profiles')
          .insert({
            user_id: userId,
            email: userEmail,
            name: formData.name,
            phone: formData.phone || null,
            experience_level: formData.experience_level,
            experience_years: formData.experience_years,
            qualifications: formData.qualifications || null,
            bio: formData.bio || null,
            specializations: formData.specializations,
            alumni: formData.alumni,
            status: 'approved'
          })
          .select()
          .single();

        if (profileError) throw profileError;
        judgeProfileId = newProfile.id;
      }

      // Register for the tournament as a judge
      const { error: registrationError } = await supabase
        .from('tournament_judge_registrations')
        .insert({
          tournament_id: tournamentId,
          judge_profile_id: judgeProfileId,
          user_id: userId,
          status: 'confirmed',
          notes: formData.notes || null
        });

      if (registrationError) throw registrationError;

      toast({
        title: 'Judge Registration Successful',
        description: `You are now registered to judge ${tournamentName}`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error registering as judge:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register as a judge',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5" />
          Register as Judge
        </CardTitle>
        <CardDescription>
          Register to judge at {tournamentName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {existingProfile ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Using your existing judge profile: <strong>{existingProfile.name}</strong>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You don't have a judge profile yet. Fill out the form below to create one.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="For tournament coordination"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select
                    value={formData.experience_level}
                    onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novice">Novice</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="experienced">Experienced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experience_years">Years Experience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label>Debate Format Specializations</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {DEBATE_FORMATS.map((format) => (
                    <div key={format.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={format.id}
                        checked={formData.specializations.includes(format.id)}
                        onCheckedChange={() => toggleSpecialization(format.id)}
                      />
                      <Label htmlFor={format.id} className="text-sm font-normal cursor-pointer">
                        {format.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="qualifications">Qualifications</Label>
                <Input
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  placeholder="e.g., Former national competitor, Coach at..."
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell competitors about your judging philosophy..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alumni"
                  checked={formData.alumni}
                  onCheckedChange={(checked) => setFormData({ ...formData, alumni: !!checked })}
                />
                <Label htmlFor="alumni" className="text-sm font-normal cursor-pointer">
                  I am an alumni (former debate competitor)
                </Label>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="notes">Notes for Tournament Organizers</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any scheduling preferences or notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || (!existingProfile && !formData.name)}>
              {submitting ? 'Registering...' : 'Register as Judge'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
];

const EXPERIENCE_LEVELS = ['novice', 'intermediate', 'experienced', 'expert'];

interface ProfileSetupProps {
  isModal?: boolean;
  onComplete?: () => void;
}

export const ProfileSetup = ({ isModal = false, onComplete }: ProfileSetupProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    state: profile?.state || '',
    region: profile?.region || '',
    time_zone: profile?.time_zone || '',
    phone: profile?.phone || '',
    account_type: profile?.role === 'judge' ? 'judge' : 'debater', // Default based on existing role
    // Judge-specific fields
    experience_level: 'novice',
    bio: '',
    qualifications: '',
    email: user?.email || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update or create the profile
      const profileData = {
        user_id: user?.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        state: formData.state,
        region: formData.region || null,
        time_zone: formData.time_zone,
        phone: formData.phone,
        role: formData.account_type === 'judge' ? 'judge' : 'user'
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // If they chose judge, create a judge profile
      if (formData.account_type === 'judge') {
        const judgeProfileData = {
          user_id: user?.id,
          name: `${formData.first_name} ${formData.last_name}`,
          email: formData.email,
          phone: formData.phone,
          experience_level: formData.experience_level,
          bio: formData.bio || null,
          qualifications: formData.qualifications || null,
          specializations: [],
          availability: {}
        };

        const { error: judgeError } = await supabase
          .from('judge_profiles')
          .upsert(judgeProfileData, {
            onConflict: 'user_id'
          });

        if (judgeError) throw judgeError;
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.',
      });

      if (onComplete) {
        onComplete();
      } else if (!isModal) {
        navigate('/account');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isComplete = formData.first_name && formData.last_name && formData.state && formData.time_zone && formData.phone && formData.account_type;

  return (
    <Card className={!isModal ? 'max-w-2xl mx-auto' : ''}>
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type Selection */}
          <div className="space-y-3">
            <Label>Account Type *</Label>
            <RadioGroup
              value={formData.account_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, account_type: value }))}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="debater" id="debater" />
                <Label htmlFor="debater">Debater/Competitor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="judge" id="judge" />
                <Label htmlFor="judge">Judge</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="state">State *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="region">Region (Optional)</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                placeholder="e.g., Northeast, Southwest"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="time_zone">Time Zone *</Label>
              <Select
                value={formData.time_zone}
                onValueChange={(value) => setFormData(prev => ({ ...prev, time_zone: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your time zone" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_ZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Judge-specific fields */}
          {formData.account_type === 'judge' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold">Judge Information</h3>
              
              <div>
                <Label htmlFor="experience_level">Experience Level *</Label>
                <Select
                  value={formData.experience_level}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, experience_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="qualifications">Qualifications</Label>
                <Textarea
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                  placeholder="Your judging experience, certifications, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Brief biography that competitors will see"
                  rows={3}
                />
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading || !isComplete} className="w-full">
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

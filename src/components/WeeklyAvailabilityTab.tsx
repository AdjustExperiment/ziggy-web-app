import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import WeeklyAvailabilityEditor from '@/components/WeeklyAvailabilityEditor';

interface JudgeProfile {
  id: string;
  name: string;
  email: string;
  experience_level: string;
  qualifications: string;
  bio: string;
  availability?: any;
}

interface WeeklyAvailabilityTabProps {
  judgeProfile: JudgeProfile;
  onUpdate: () => void;
}

const DEFAULT_AVAILABILITY = {
  monday: { morning: false, afternoon: false, evening: false },
  tuesday: { morning: false, afternoon: false, evening: false },
  wednesday: { morning: false, afternoon: false, evening: false },
  thursday: { morning: false, afternoon: false, evening: false },
  friday: { morning: false, afternoon: false, evening: false },
  saturday: { morning: false, afternoon: false, evening: false },
  sunday: { morning: false, afternoon: false, evening: false }
};

export default function WeeklyAvailabilityTab({ judgeProfile, onUpdate }: WeeklyAvailabilityTabProps) {
  const { toast } = useToast();
  const [currentAvailability, setCurrentAvailability] = useState(DEFAULT_AVAILABILITY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentAvailability(judgeProfile.availability || DEFAULT_AVAILABILITY);
  }, [judgeProfile]);

  const saveAvailability = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('judge_profiles')
        .update({ availability: currentAvailability })
        .eq('id', judgeProfile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your weekly availability has been updated",
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <WeeklyAvailabilityEditor
      availability={currentAvailability}
      onAvailabilityChange={setCurrentAvailability}
      onSave={saveAvailability}
      loading={loading}
    />
  );
}
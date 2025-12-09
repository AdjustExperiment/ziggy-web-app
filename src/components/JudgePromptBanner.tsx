import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Gavel, X, Plus } from 'lucide-react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';
import { JudgeProfileCreator } from './JudgeProfileCreator';

interface JudgePromptBannerProps {
  onCreateProfile?: () => void;
}

export function JudgePromptBanner({ onCreateProfile }: JudgePromptBannerProps) {
  const { user } = useOptimizedAuth();
  const [hasJudgeProfile, setHasJudgeProfile] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    if (user) {
      checkJudgeProfile();
    }
  }, [user]);

  const checkJudgeProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('judge_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setHasJudgeProfile(!!data);
    } catch (error) {
      console.error('Error checking judge profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    if (onCreateProfile) {
      onCreateProfile();
    } else {
      setShowCreator(true);
    }
  };

  if (loading || hasJudgeProfile || isDismissed) {
    return null;
  }

  return (
    <>
      <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Gavel className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Become a Judge!</strong> Help the debate community by creating a judge profile. 
                Judges are essential for tournaments and earn recognition for their contributions.
              </AlertDescription>
              <div className="flex space-x-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300"
                  onClick={handleCreateClick}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Judge Profile
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-amber-600 hover:text-amber-700"
                  onClick={() => setIsDismissed(true)}
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-amber-600 hover:text-amber-700 p-1"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>

      <JudgeProfileCreator
        open={showCreator}
        onOpenChange={setShowCreator}
        onSuccess={() => {
          setHasJudgeProfile(true);
          setShowCreator(false);
        }}
      />
    </>
  );
}
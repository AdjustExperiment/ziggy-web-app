
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAutomatedEmails = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Listen for new registrations that are successfully paid
    const channel = supabase
      .channel('registration-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournament_registrations',
          filter: 'payment_status=eq.completed'
        },
        async (payload) => {
          console.log('Registration payment completed:', payload);
          
          // Check if success email hasn't been sent yet
          if (!payload.new.success_email_sent_at) {
            try {
              const { error } = await supabase.functions.invoke('send-registration-email', {
                body: {
                  registration_id: payload.new.id,
                  email_type: 'registration_success'
                }
              });

              if (error) {
                console.error('Failed to send success email:', error);
                toast({
                  title: "Email Error",
                  description: "Failed to send confirmation email",
                  variant: "destructive"
                });
              } else {
                console.log('Success email triggered for registration:', payload.new.id);
              }
            } catch (error) {
              console.error('Error triggering success email:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const triggerSuccessEmail = async (registrationId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-registration-email', {
        body: {
          registration_id: registrationId,
          email_type: 'registration_success'
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Confirmation email sent successfully"
      });
    } catch (error) {
      console.error('Error sending success email:', error);
      toast({
        title: "Error",
        description: "Failed to send confirmation email",
        variant: "destructive"
      });
    }
  };

  const triggerReminderEmail = async (registrationId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-registration-email', {
        body: {
          registration_id: registrationId,
          email_type: 'payment_pending'
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Reminder email sent successfully"
      });
    } catch (error) {
      console.error('Error sending reminder email:', error);
      toast({
        title: "Error",
        description: "Failed to send reminder email",
        variant: "destructive"
      });
    }
  };

  return {
    triggerSuccessEmail,
    triggerReminderEmail
  };
};

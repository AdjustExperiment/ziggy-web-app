-- Create notifications table for admin notifications
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tournament_completed', 'registration_closed', 'payment_received', 'new_user', 'financial_milestone', 'system_alert', 'general')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  action_text TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  tournament_id UUID,
  registration_id UUID
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage all notifications"
  ON public.admin_notifications
  FOR ALL
  USING (is_admin());

-- Create indexes for better performance
CREATE INDEX idx_admin_notifications_type ON public.admin_notifications(type);
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_priority ON public.admin_notifications(priority);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_notifications_updated_at
  BEFORE UPDATE ON public.admin_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate tournament completion notifications
CREATE OR REPLACE FUNCTION public.generate_tournament_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- When a tournament status changes to 'Completed' or 'Finished'
  IF NEW.status IS DISTINCT FROM OLD.status AND lower(NEW.status) IN ('completed', 'finished', 'ended') THEN
    INSERT INTO public.admin_notifications (
      title,
      message,
      type,
      priority,
      action_url,
      action_text,
      metadata,
      tournament_id
    ) VALUES (
      'Tournament Completed: ' || NEW.name,
      'Tournament "' || NEW.name || '" has completed. Please update the tournament results and winners.',
      'tournament_completed',
      'high',
      '/admin?tab=results',
      'Update Results',
      jsonb_build_object(
        'tournament_name', NEW.name,
        'tournament_id', NEW.id,
        'end_date', NEW.end_date
      ),
      NEW.id
    );
  END IF;

  -- When registration closes (registration_open changes from true to false)
  IF OLD.registration_open = true AND NEW.registration_open = false THEN
    INSERT INTO public.admin_notifications (
      title,
      message,
      type,
      priority,
      action_url,
      action_text,
      metadata,
      tournament_id
    ) VALUES (
      'Registration Closed: ' || NEW.name,
      'Registration for "' || NEW.name || '" has closed. Consider sending confirmation emails to registered participants.',
      'registration_closed',
      'medium',
      '/admin?tab=emails',
      'Send Emails',
      jsonb_build_object(
        'tournament_name', NEW.name,
        'tournament_id', NEW.id,
        'participant_count', NEW.current_participants
      ),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tournament status changes
CREATE TRIGGER tournament_notification_trigger
  AFTER UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tournament_notifications();

-- Create function to generate payment notifications
CREATE OR REPLACE FUNCTION public.generate_payment_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment status changes to 'paid'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    INSERT INTO public.admin_notifications (
      title,
      message,
      type,
      priority,
      metadata,
      registration_id
    ) VALUES (
      'Payment Received',
      'Payment of $' || COALESCE(NEW.amount_paid::text, 'N/A') || ' received from ' || NEW.participant_name || ' for tournament registration.',
      'payment_received',
      'low',
      jsonb_build_object(
        'participant_name', NEW.participant_name,
        'participant_email', NEW.participant_email,
        'amount', NEW.amount_paid,
        'tournament_id', NEW.tournament_id
      ),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment status changes
CREATE TRIGGER payment_notification_trigger
  AFTER UPDATE ON public.tournament_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_payment_notifications();

-- Create function to generate user registration notifications
CREATE OR REPLACE FUNCTION public.generate_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (
    title,
    message,
    type,
    priority,
    action_url,
    action_text,
    metadata
  ) VALUES (
    'New User Registration',
    'A new user has registered: ' || COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Unknown Name'),
    'new_user',
    'low',
    '/admin?tab=users',
    'View Users',
    jsonb_build_object(
      'user_name', COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Unknown'),
      'user_id', NEW.user_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registrations
CREATE TRIGGER user_registration_notification_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_user_notifications();

-- Insert some sample notifications for testing
INSERT INTO public.admin_notifications (title, message, type, priority, action_url, action_text, metadata) VALUES
  (
    'High Registration Volume',
    'Tournament "Spring Championship 2024" has reached 85% capacity with 85 of 100 spots filled.',
    'tournament_completed',
    'medium',
    '/admin?tab=tournaments',
    'View Tournament',
    '{"tournament_name": "Spring Championship 2024", "capacity_percentage": 85}'
  ),
  (
    'Payment Processing Alert',
    'Payment processor reported 3 failed transactions in the last hour. Check payment gateway status.',
    'system_alert',
    'high',
    '/admin?tab=payments',
    'Check Payments',
    '{"failed_transactions": 3}'
  ),
  (
    'Monthly Revenue Milestone',
    'Congratulations! Monthly revenue has exceeded $5,000 for the first time.',
    'financial_milestone',
    'medium',
    '/admin?tab=payments',
    'View Revenue',
    '{"milestone_amount": 5000, "period": "monthly"}'
  ),
  (
    'System Backup Complete',
    'Weekly automated backup completed successfully. All data is secure.',
    'system_alert',
    'low',
    null,
    null,
    '{"backup_type": "weekly", "status": "success"}'
  );
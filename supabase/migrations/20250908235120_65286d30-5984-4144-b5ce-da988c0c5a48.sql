-- Extend email_templates_enhanced for scheduling and tracking
ALTER TABLE public.email_templates_enhanced
  ADD COLUMN IF NOT EXISTS schedule_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS automation_trigger TEXT,
  ADD COLUMN IF NOT EXISTS open_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0;

-- Table to log email delivery events
CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.email_templates_enhanced(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_delivery_logs_template_idx
  ON public.email_delivery_logs(template_id);

ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage email delivery logs" ON public.email_delivery_logs;
CREATE POLICY "Admins can manage email delivery logs"
ON public.email_delivery_logs
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Trigger to update open/click counts on templates
CREATE OR REPLACE FUNCTION public.update_email_template_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'opened' THEN
    UPDATE public.email_templates_enhanced
    SET open_count = open_count + 1
    WHERE id = NEW.template_id;
  ELSIF NEW.event_type = 'clicked' THEN
    UPDATE public.email_templates_enhanced
    SET click_count = click_count + 1
    WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_email_template_metrics
AFTER INSERT ON public.email_delivery_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_email_template_metrics();

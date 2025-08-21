-- Create pairing_messages table for debater communication
CREATE TABLE public.pairing_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pairing_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pairing_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for pairing messages
CREATE POLICY "Users can view messages for their pairings"
ON public.pairing_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pairings p
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE p.id = pairing_id 
    AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their pairings"
ON public.pairing_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.pairings p
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE p.id = pairing_id 
    AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
);

-- Create pairing_evidence table for file uploads
CREATE TABLE public.pairing_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pairing_id UUID NOT NULL,
  uploader_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pairing_evidence ENABLE ROW LEVEL SECURITY;

-- Create policies for evidence files
CREATE POLICY "Users can view evidence for their pairings"
ON public.pairing_evidence
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pairings p
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE p.id = pairing_id 
    AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
);

CREATE POLICY "Users can upload evidence for their pairings"
ON public.pairing_evidence
FOR INSERT
WITH CHECK (
  auth.uid() = uploader_id AND
  EXISTS (
    SELECT 1 FROM public.pairings p
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE p.id = pairing_id 
    AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their own evidence"
ON public.pairing_evidence
FOR DELETE
USING (auth.uid() = uploader_id);

-- Add triggers for updated_at
CREATE TRIGGER update_pairing_messages_updated_at
BEFORE UPDATE ON public.pairing_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public) VALUES ('pairing-evidence', 'pairing-evidence', false);

-- Create storage policies for evidence bucket
CREATE POLICY "Users can view evidence files for their pairings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pairing-evidence' AND
  EXISTS (
    SELECT 1 FROM public.pairing_evidence pe
    JOIN public.pairings p ON p.id = pe.pairing_id
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE pe.file_url LIKE '%' || name || '%'
    AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
);

CREATE POLICY "Users can upload evidence files for their pairings"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pairing-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own evidence files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pairing-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
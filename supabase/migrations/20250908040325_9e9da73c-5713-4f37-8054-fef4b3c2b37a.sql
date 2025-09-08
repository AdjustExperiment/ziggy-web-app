-- Create trigger to sync approved sponsors to tournament content
CREATE OR REPLACE FUNCTION public.sync_approved_sponsor_to_content()
RETURNS TRIGGER AS $$
DECLARE
  v_tournament_content_id uuid;
  v_name text;
  v_logo text;
  v_website text;
  v_display_tier text;
BEGIN
  -- Only act when status transitions to approved or a new row is inserted as approved
  IF (TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved')
     OR (TG_OP = 'INSERT' AND NEW.status = 'approved') THEN

    -- Fetch sponsor profile info
    SELECT sp.name, sp.logo_url, sp.website
      INTO v_name, v_logo, v_website
    FROM public.sponsor_profiles sp
    WHERE sp.id = NEW.sponsor_profile_id;

    v_display_tier := public.map_sponsor_tier_for_display(NEW.tier);

    -- Ensure tournament_content exists
    SELECT id INTO v_tournament_content_id
    FROM public.tournament_content
    WHERE tournament_id = NEW.tournament_id
    LIMIT 1;

    IF v_tournament_content_id IS NULL THEN
      INSERT INTO public.tournament_content (tournament_id, sponsors)
      VALUES (NEW.tournament_id, JSONB_BUILD_ARRAY(JSONB_BUILD_OBJECT(
        'name', v_name,
        'logo_url', v_logo,
        'website', v_website,
        'tier', v_display_tier
      )));
    ELSE
      -- Replace any existing entry for the same sponsor name, then append current details
      UPDATE public.tournament_content tc
      SET sponsors = (
        COALESCE(
          (SELECT JSONB_AGG(e)
             FROM JSONB_ARRAY_ELEMENTS(COALESCE(tc.sponsors, '[]'::jsonb)) AS e
            WHERE e->>'name' IS DISTINCT FROM v_name),
          '[]'::jsonb
        ) || JSONB_BUILD_ARRAY(JSONB_BUILD_OBJECT(
          'name', v_name,
          'logo_url', v_logo,
          'website', v_website,
          'tier', v_display_tier
        ))
      ),
      updated_at = NOW()
      WHERE tc.id = v_tournament_content_id;
    END IF;
  END IF;

  -- If an approved application becomes rejected/withdrawn, remove from sponsors list
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status IN ('rejected','withdrawn') THEN
    SELECT id INTO v_tournament_content_id
    FROM public.tournament_content
    WHERE tournament_id = NEW.tournament_id
    LIMIT 1;

    IF v_tournament_content_id IS NOT NULL THEN
      SELECT sp.name INTO v_name
      FROM public.sponsor_profiles sp
      WHERE sp.id = NEW.sponsor_profile_id;

      UPDATE public.tournament_content tc
      SET sponsors = (
        COALESCE(
          (SELECT JSONB_AGG(e)
             FROM JSONB_ARRAY_ELEMENTS(COALESCE(tc.sponsors, '[]'::jsonb)) AS e
            WHERE e->>'name' IS DISTINCT FROM v_name),
          '[]'::jsonb
        )
      ),
      updated_at = NOW()
      WHERE tc.id = v_tournament_content_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on sponsor_applications
CREATE TRIGGER sync_sponsor_applications_to_content
  AFTER INSERT OR UPDATE ON public.sponsor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_approved_sponsor_to_content();
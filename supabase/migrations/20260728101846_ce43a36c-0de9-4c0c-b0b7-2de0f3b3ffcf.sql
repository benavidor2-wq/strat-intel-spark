-- Ingestion functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_upload(p_upload_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_upload json;
BEGIN
  SELECT to_json(u.*) INTO v_upload
  FROM public.uploads u
  WHERE u.id = p_upload_id
    AND u.status IN ('queued', 'processing')
    AND u.attempts < 3
    AND (
      u.processing_started_at IS NULL
      OR u.processing_started_at < now() - interval '10 minutes'
    )
  FOR UPDATE SKIP LOCKED;

  IF v_upload IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.uploads
  SET status = 'processing',
      attempts = attempts + 1,
      processing_started_at = now(),
      error_message = NULL
  WHERE id = p_upload_id;

  RETURN v_upload;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_next_uploads(p_limit int DEFAULT 5)
RETURNS json[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids uuid[];
  v_result json[] := ARRAY[]::json[];
BEGIN
  SELECT array_agg(id) INTO v_ids
  FROM (
    SELECT id
    FROM public.uploads
    WHERE status = 'queued'
       OR (status = 'processing' AND attempts < 3 AND processing_started_at < now() - interval '10 minutes')
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  ) t;

  IF v_ids IS NULL OR array_length(v_ids, 1) IS NULL THEN
    RETURN v_result;
  END IF;

  UPDATE public.uploads
  SET status = 'processing',
      attempts = attempts + 1,
      processing_started_at = now(),
      error_message = NULL
  WHERE id = ANY(v_ids);

  SELECT array_agg(to_json(u.*)) INTO v_result
  FROM public.uploads u
  WHERE u.id = ANY(v_ids);

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_upload(p_upload_id uuid, p_error text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.uploads
  SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'queued' END,
      error_message = p_error,
      processed_at = now()
  WHERE id = p_upload_id;
END;
$$;
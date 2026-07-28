-- Merge helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.suggest_vendor_merges()
RETURNS TABLE(keep uuid, merge uuid, keep_name text, merge_name text, score numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v1.id AS keep,
    v2.id AS merge,
    v1.display_name AS keep_name,
    v2.display_name AS merge_name,
    similarity(v1.normalized_name, v2.normalized_name)::numeric AS score
  FROM public.vendors v1
  JOIN public.vendors v2
    ON v1.user_id = v2.user_id
    AND v1.id < v2.id
    AND v1.normalized_name <> v2.normalized_name
  WHERE v1.user_id = auth.uid()
    AND similarity(v1.normalized_name, v2.normalized_name) > 0.5;
END;
$$;

CREATE OR REPLACE FUNCTION public.merge_vendors(p_keep uuid, p_merge uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.vendors WHERE id = p_keep;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'keep vendor not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.vendors WHERE id = p_merge AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'merge vendor not found or belongs to a different user';
  END IF;

  UPDATE public.vendor_aliases SET vendor_id = p_keep WHERE vendor_id = p_merge;

  INSERT INTO public.vendor_aliases (user_id, vendor_id, alias, normalized_alias)
  SELECT v_user_id, p_keep, display_name, normalized_name
  FROM public.vendors
  WHERE id = p_merge
  ON CONFLICT (user_id, normalized_alias) DO NOTHING;

  UPDATE public.receipts SET vendor_id = p_keep WHERE vendor_id = p_merge;
  UPDATE public.line_items SET vendor_id = p_keep WHERE vendor_id = p_merge;
  DELETE FROM public.vendors WHERE id = p_merge;
END;
$$;

CREATE OR REPLACE FUNCTION public.suggest_item_merges()
RETURNS TABLE(keep uuid, merge uuid, keep_name text, merge_name text, score numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c1.id AS keep,
    c2.id AS merge,
    c1.display_name AS keep_name,
    c2.display_name AS merge_name,
    similarity(c1.normalized_name, c2.normalized_name)::numeric AS score
  FROM public.canonical_items c1
  JOIN public.canonical_items c2
    ON c1.user_id = c2.user_id
    AND c1.id < c2.id
    AND c1.normalized_name <> c2.normalized_name
  WHERE c1.user_id = auth.uid()
    AND similarity(c1.normalized_name, c2.normalized_name) > 0.5;
END;
$$;

CREATE OR REPLACE FUNCTION public.merge_canonical_items(p_keep uuid, p_merge uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.canonical_items WHERE id = p_keep;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'keep item not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.canonical_items WHERE id = p_merge AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'merge item not found or belongs to a different user';
  END IF;

  UPDATE public.item_aliases SET canonical_item_id = p_keep WHERE canonical_item_id = p_merge;

  INSERT INTO public.item_aliases (user_id, canonical_item_id, alias, normalized_alias)
  SELECT v_user_id, p_keep, display_name, normalized_name
  FROM public.canonical_items
  WHERE id = p_merge
  ON CONFLICT (user_id, normalized_alias) DO NOTHING;

  UPDATE public.line_items SET canonical_item_id = p_keep WHERE canonical_item_id = p_merge;
  DELETE FROM public.canonical_items WHERE id = p_merge;
END;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security + Grants
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('vendors', 'vendor_aliases', 'canonical_items', 'item_aliases', 'uploads', 'receipts', 'line_items') LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%s', t || '_owner', t);
    EXECUTE format(
      'CREATE POLICY "%s" ON public.%s FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      t || '_owner', t
    );
  END LOOP;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_aliases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canonical_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_aliases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.uploads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.line_items TO authenticated;

GRANT ALL ON public.vendors TO service_role;
GRANT ALL ON public.vendor_aliases TO service_role;
GRANT ALL ON public.canonical_items TO service_role;
GRANT ALL ON public.item_aliases TO service_role;
GRANT ALL ON public.uploads TO service_role;
GRANT ALL ON public.receipts TO service_role;
GRANT ALL ON public.line_items TO service_role;

GRANT SELECT ON public.receipts_full TO authenticated;
GRANT SELECT ON public.receipts_full TO service_role;

REVOKE ALL ON FUNCTION public.claim_upload(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_next_uploads(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_upload(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ingest_receipts(uuid, jsonb, text, numeric, jsonb, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dataset_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.suggest_vendor_merges() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.merge_vendors(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.suggest_item_merges() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.merge_canonical_items(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_upload(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_uploads(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fail_upload(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_receipts(uuid, jsonb, text, numeric, jsonb, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dataset_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.suggest_vendor_merges() TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_vendors(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.suggest_item_merges() TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_canonical_items(uuid, uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.claim_upload(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_next_uploads(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_upload(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ingest_receipts(uuid, jsonb, text, numeric, jsonb, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.dataset_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.suggest_vendor_merges() TO service_role;
GRANT EXECUTE ON FUNCTION public.merge_vendors(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.suggest_item_merges() TO service_role;
GRANT EXECUTE ON FUNCTION public.merge_canonical_items(uuid, uuid) TO service_role;
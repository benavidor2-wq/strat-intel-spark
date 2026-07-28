DROP INDEX IF EXISTS public.idx_vendors_trgm;
DROP INDEX IF EXISTS public.idx_canonical_items_trgm;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
CREATE INDEX idx_vendors_trgm ON public.vendors USING gin (normalized_name extensions.gin_trgm_ops);
CREATE INDEX idx_canonical_items_trgm ON public.canonical_items USING gin (normalized_name extensions.gin_trgm_ops);

REVOKE EXECUTE ON FUNCTION public.claim_upload(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_next_uploads(int) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fail_upload(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.ingest_receipts(uuid, jsonb, text, numeric, jsonb, int) FROM authenticated;
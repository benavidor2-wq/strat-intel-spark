-- ---------------------------------------------------------------------------
-- Read helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.receipts_full
WITH (security_invoker = true)
AS
SELECT
  r.id,
  r.user_id,
  r.upload_id,
  r.vendor_id,
  coalesce(v.display_name, r.merchant) AS merchant,
  r.merchant AS merchant_raw,
  r.invoice_no,
  r.date,
  r.subtotal,
  r.tax,
  r.total,
  r.currency,
  r.category,
  r.filename,
  r.custom_fields,
  r.dedupe_key,
  r.duplicate_of,
  r.total_variance,
  r.confidence,
  r.needs_review,
  r.review_reason,
  r.bill_to,
  r.bill_to_is_self,
  r.created_at,
  r.updated_at,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', li.name,
        'quantity', li.quantity,
        'unit_price', li.unit_price,
        'total_price', li.total_price,
        'sku', li.sku,
        'uom', li.uom,
        'line_kind', li.line_kind,
        'canonical_item_id', li.canonical_item_id
      ) ORDER BY li.line_no
    ) FILTER (WHERE li.id IS NOT NULL),
    '[]'::jsonb
  ) AS line_items
FROM public.receipts r
LEFT JOIN public.vendors v ON v.id = r.vendor_id
LEFT JOIN public.line_items li ON li.receipt_id = r.id
GROUP BY r.id, v.display_name;

CREATE OR REPLACE FUNCTION public.dataset_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'receipt_count', COUNT(*),
    'total_spend', COALESCE(SUM(total), 0),
    'vendor_count', COUNT(DISTINCT vendor_id),
    'earliest_date', MIN(date),
    'latest_date', MAX(date),
    'last_updated', MAX(updated_at),
    'needs_review', COUNT(*) FILTER (WHERE needs_review),
    'duplicates', COUNT(*) FILTER (WHERE duplicate_of IS NOT NULL)
  ) INTO v_result
  FROM public.receipts
  WHERE user_id = auth.uid()
    AND duplicate_of IS NULL
    AND date IS NOT NULL;

  RETURN v_result;
END;
$$;
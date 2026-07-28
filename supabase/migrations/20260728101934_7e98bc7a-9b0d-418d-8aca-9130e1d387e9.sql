CREATE OR REPLACE FUNCTION public.ingest_receipts(
  p_upload_id uuid,
  p_receipts jsonb,
  p_parser text,
  p_confidence numeric,
  p_extracted jsonb,
  p_page_count int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_upload public.uploads%ROWTYPE;
  v_receipt jsonb;
  v_merchant text;
  v_normalized_merchant text;
  v_vendor_id uuid;
  v_receipt_id uuid;
  v_dedupe_key text;
  v_duplicate_id uuid;
  v_total numeric;
  v_subtotal numeric;
  v_tax numeric;
  v_date date;
  v_status public.upload_status;
  v_receipt_count int := 0;
  v_total_variance numeric;
  v_needs_review boolean;
  v_review_reason text;
  v_line jsonb;
  v_line_total numeric;
  v_sum_line_totals numeric;
  v_item_name text;
  v_normalized_item text;
  v_canonical_item_id uuid;
  v_qty numeric;
  v_unit numeric;
  v_line_total_raw numeric;
  v_seen_dedupe_keys jsonb := '{}'::jsonb;
BEGIN
  SELECT * INTO v_upload FROM public.uploads WHERE id = p_upload_id;
  IF v_upload IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'upload not found')::json;
  END IF;

  IF p_receipts IS NULL OR jsonb_typeof(p_receipts) <> 'array' OR jsonb_array_length(p_receipts) = 0 THEN
    UPDATE public.uploads
    SET status = 'needs_review',
        error_message = 'No receipts extracted',
        parser = p_parser,
        page_count = p_page_count,
        confidence = p_confidence,
        extracted = p_extracted,
        receipt_count = 0,
        processed_at = now()
    WHERE id = p_upload_id;
    RETURN jsonb_build_object('ok', true, 'receipt_count', 0, 'status', 'needs_review')::json;
  END IF;

  FOR v_receipt IN SELECT jsonb_array_elements FROM jsonb_array_elements(p_receipts) LOOP
    v_receipt_count := v_receipt_count + 1;
    v_needs_review := false;
    v_review_reason := '';

    v_merchant := NULLIF(trim(both '"' from v_receipt->>'merchant'), '');
    v_normalized_merchant := lower(regexp_replace(coalesce(v_merchant, ''), '[^a-z0-9]', '', 'g'));
    v_vendor_id := NULL;

    IF v_normalized_merchant <> '' THEN
      SELECT va.vendor_id INTO v_vendor_id
      FROM public.vendor_aliases va
      WHERE va.user_id = v_upload.user_id
        AND va.normalized_alias = v_normalized_merchant;

      IF v_vendor_id IS NULL THEN
        SELECT id INTO v_vendor_id
        FROM public.vendors
        WHERE user_id = v_upload.user_id
          AND normalized_name = v_normalized_merchant;
      END IF;

      IF v_vendor_id IS NULL THEN
        INSERT INTO public.vendors (user_id, display_name, normalized_name, category)
        VALUES (v_upload.user_id, v_merchant, v_normalized_merchant, v_receipt->>'category')
        RETURNING id INTO v_vendor_id;
      END IF;
    END IF;

    v_date := NULLIF(v_receipt->>'date', '')::date;
    v_subtotal := (v_receipt->>'subtotal')::numeric;
    v_tax := (v_receipt->>'tax')::numeric;
    v_total := (v_receipt->>'total')::numeric;

    v_subtotal := NULLIF(regexp_replace(v_subtotal::text, '[^0-9.-]', '', 'g'), '')::numeric;
    v_tax := NULLIF(regexp_replace(v_tax::text, '[^0-9.-]', '', 'g'), '')::numeric;
    v_total := NULLIF(regexp_replace(v_total::text, '[^0-9.-]', '', 'g'), '')::numeric;

    v_dedupe_key := coalesce(v_normalized_merchant, '') || '|' || coalesce(v_receipt->>'invoice_no', '') || '|' || coalesce(v_total::text, '');

    v_duplicate_id := NULL;
    IF v_dedupe_key <> '' THEN
      IF v_seen_dedupe_keys ? v_dedupe_key THEN
        v_duplicate_id := (v_seen_dedupe_keys->>v_dedupe_key)::uuid;
      ELSE
        SELECT id INTO v_duplicate_id
        FROM public.receipts
        WHERE user_id = v_upload.user_id
          AND dedupe_key = v_dedupe_key
        LIMIT 1;
      END IF;
    END IF;

    IF v_duplicate_id IS NOT NULL THEN
      v_needs_review := true;
      v_review_reason := 'Duplicate of ' || v_duplicate_id;
    ELSIF v_merchant IS NULL THEN
      v_needs_review := true;
      v_review_reason := 'Missing vendor';
    ELSIF v_total IS NULL AND v_subtotal IS NULL THEN
      v_needs_review := true;
      v_review_reason := 'Missing amounts';
    END IF;

    INSERT INTO public.receipts (
      user_id, upload_id, vendor_id, merchant, normalized_merchant,
      invoice_no, date, subtotal, tax, total, currency, category,
      filename, custom_fields, dedupe_key, duplicate_of, total_variance,
      confidence, needs_review, review_reason, bill_to, bill_to_is_self
    ) VALUES (
      v_upload.user_id, p_upload_id, v_vendor_id, v_merchant, v_normalized_merchant,
      NULLIF(v_receipt->>'invoice_no', ''), v_date, v_subtotal, v_tax, v_total,
      v_receipt->>'currency', v_receipt->>'category', v_upload.filename,
      coalesce(v_receipt->'custom_fields', '{}'::jsonb), v_dedupe_key,
      v_duplicate_id, v_total_variance, p_confidence, v_needs_review, v_review_reason,
      v_receipt->>'bill_to', (v_receipt->>'bill_to_is_self')::boolean
    ) RETURNING id INTO v_receipt_id;

    IF v_duplicate_id IS NULL AND v_dedupe_key <> '' THEN
      v_seen_dedupe_keys := v_seen_dedupe_keys || jsonb_build_object(v_dedupe_key, v_receipt_id);
    END IF;

    IF v_duplicate_id IS NOT NULL THEN
      CONTINUE;
    END IF;

    v_sum_line_totals := 0;
    FOR v_line IN SELECT jsonb_array_elements FROM jsonb_array_elements(v_receipt->'line_items') LOOP
      v_item_name := NULLIF(trim(both '"' from v_line->>'name'), '');
      IF v_item_name IS NULL THEN CONTINUE; END IF;

      v_normalized_item := lower(regexp_replace(v_item_name, '[^a-z0-9]', '', 'g'));
      v_canonical_item_id := NULL;

      SELECT ia.canonical_item_id INTO v_canonical_item_id
      FROM public.item_aliases ia
      WHERE ia.user_id = v_upload.user_id
        AND ia.normalized_alias = v_normalized_item;

      IF v_canonical_item_id IS NULL THEN
        SELECT id INTO v_canonical_item_id
        FROM public.canonical_items
        WHERE user_id = v_upload.user_id
          AND normalized_name = v_normalized_item;
      END IF;

      IF v_canonical_item_id IS NULL THEN
        INSERT INTO public.canonical_items (user_id, display_name, normalized_name, uom, category)
        VALUES (v_upload.user_id, v_item_name, v_normalized_item, v_line->>'uom', v_receipt->>'category')
        RETURNING id INTO v_canonical_item_id;
      END IF;

      v_qty := (v_line->>'quantity')::numeric;
      v_unit := (v_line->>'unit_price')::numeric;
      v_line_total_raw := (v_line->>'total_price')::numeric;
      IF v_line_total_raw IS NULL AND v_qty IS NOT NULL AND v_unit IS NOT NULL THEN
        v_line_total := v_qty * v_unit;
      ELSE
        v_line_total := v_line_total_raw;
      END IF;
      v_sum_line_totals := v_sum_line_totals + coalesce(v_line_total, 0);

      INSERT INTO public.line_items (
        user_id, receipt_id, vendor_id, canonical_item_id, receipt_date,
        line_no, name, normalized_name, sku, uom, quantity,
        unit_price, total_price, line_kind
      ) VALUES (
        v_upload.user_id, v_receipt_id, v_vendor_id, v_canonical_item_id, v_date,
        (v_line->>'line_no')::int, v_item_name, v_normalized_item,
        v_line->>'sku', v_line->>'uom', v_qty,
        v_unit, v_line_total,
        coalesce(v_line->>'line_kind', 'product')::public.line_kind
      );
    END LOOP;

    v_total_variance := coalesce(v_total, 0) - coalesce(v_subtotal, v_sum_line_totals, 0) - coalesce(v_tax, 0);
    UPDATE public.receipts SET total_variance = v_total_variance WHERE id = v_receipt_id;
  END LOOP;

  v_status := 'complete';

  UPDATE public.uploads
  SET status = v_status,
      parser = p_parser,
      page_count = p_page_count,
      confidence = p_confidence,
      extracted = p_extracted,
      receipt_count = v_receipt_count,
      receipt_id = CASE WHEN v_receipt_count = 1 THEN v_receipt_id ELSE NULL END,
      processed_at = now()
  WHERE id = p_upload_id;

  RETURN jsonb_build_object('ok', true, 'receipt_count', v_receipt_count, 'status', v_status)::json;
END;
$$;
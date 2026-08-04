-- =====================================================================
-- Invoiciify — Supabase backend snapshot (functions, RLS, triggers)
-- Exported for GitHub backup. Live source of truth is the Supabase project;
-- table DATA is backed up separately by Supabase.
-- =====================================================================

-- ---------- TABLES (public) ----------
--   canonical_items
--   drive_config
--   item_aliases
--   line_items
--   receipts
--   saved_models
--   self_identities
--   uploads
--   vendor_aliases
--   vendors

-- ---------- FUNCTIONS ----------

CREATE OR REPLACE FUNCTION public.ace_alias_receipt()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare ace_id uuid;
begin
  if (new.custom_fields->>'Customer Number') = '2636'
     or public.normalize_vendor(new.merchant) in ('herson','gerson','ferson','rohereo','elger') then
    select id into ace_id from public.vendors
      where public.normalize_vendor(display_name)=public.normalize_vendor('Ace Building Materials') limit 1;
    if ace_id is not null then
      new.merchant := 'Ace Building Materials';
      new.normalized_merchant := public.normalize_vendor('Ace Building Materials');
      new.vendor_id := ace_id;
    end if;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.canonical_uom(u text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  select case
    when v = '' then null
    when v in ('EA','EACH','EACHES','EAC','E','UNIT','UNITS') then 'EA'
    when v in ('LD','LOAD','LOADS') then 'LD'
    when v in ('LB','LBS','POUND','POUNDS','#') then 'LB'
    when v in ('CY','CUYD','CU YD','C/Y','CUBIC YARD','CUBIC YARDS') then 'CY'
    when v in ('CF','CUFT','CU FT','CUBIC FOOT','CUBIC FEET') then 'CF'
    when v in ('FT','FEET','FOOT','LF','LNFT','L/F','LIN FT','LINEAL FT','LINEAR FT') then 'FT'
    when v in ('SF','SQFT','SQ FT','S/F','SQUARE FOOT','SQUARE FEET') then 'SF'
    when v in ('HR','HRS','HOUR','HOURS','H') then 'HR'
    when v in ('MIN','MINS','MINUTE','MINUTES') then 'MIN'
    when v in ('OZ','OUNCE','OUNCES') then 'OZ'
    when v in ('GAL','GALLON','GALLONS') then 'GAL'
    when v in ('TON','TONS','TN') then 'TON'
    when v in ('RL','ROLL','ROLLS') then 'RL'
    when v in ('BOX','BOXES','BX') then 'BOX'
    when v in ('CASE','CASES','CS') then 'CASE'
    when v in ('BAG','BAGS','BG') then 'BAG'
    when v in ('SK','SACK','SACKS') then 'SK'
    when v in ('PC','PCS','PIECE','PIECES') then 'PC'
    when v in ('SHEET','SHEETS','SHT','SHTS') then 'SHEET'
    when v in ('YD','YARD','YARDS') then 'YD'
    else v
  end
  from (select upper(btrim(regexp_replace(coalesce(u,''),'[.\s]+$',''))) as v) c;
$function$
;

CREATE OR REPLACE FUNCTION public.canonicalize_custom_fields(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
declare k text; v text; n text; canon text; key_out text; v_out jsonb := '{}'::jsonb;
        v_addr text; v_canon text;
begin
  if p is null or jsonb_typeof(p) <> 'object' then return '{}'::jsonb; end if;
  for k, v in select key, value #>> '{}' from jsonb_each(p) loop
    if v is null or btrim(v)='' then continue; end if;
    n := public.normalize_item(k);
    canon := case
      when n in ('po','po number','po no','po num','ponumber','po nbr','p o','p o number',
                 'p o no','p o num','customer po','customer po number','customer po no',
                 'purchase order','purchase order number','purchase order no') then 'PO Number'
      when n in ('job site','jobsite','job name','po job name','customer job no','customer job number',
                 'cust job no','site','site name','project site','job location') then 'Job Site'
      when n in ('acct job no','acct job number','account job no','account job number') then 'Acct Job No'
      when n in ('ship to','ship to address','delivery address','deliver to','shipping address') then 'Ship To'
      when n in ('job','job code','job no','job num','job number','job id','job nbr','cost code','wo job') then 'Job Code'
      when n in ('project','project name','project code','project id','project no') then 'Project'
      when n in ('work order','wo','work order number','work order no') then 'Work Order'
      when n in ('department','dept','cost center','cost centre','costcenter','division') then 'Department'
      when n in ('payment terms','terms','payment term','terms of payment') then 'Payment Terms'
      when n in ('contract number','contract','contract no','contract id') then 'Contract Number'
      when n in ('order no','order number','order','sales order','so number') then 'Order Number'
      when n in ('account','account no','account number','account nbr') then 'Account Number'
      when n in ('site address') then 'Site Address'
      else null end;
    key_out := coalesce(canon, btrim(k));
    if v_out ? key_out then continue; end if;
    v_out := v_out || jsonb_build_object(key_out, btrim(v));
  end loop;

  -- Canonical Job Site: prefer an existing raw Site Address (idempotent re-runs),
  -- else the first address-looking value among Job Site / Project / Ship To / PO Number.
  v_addr := coalesce(
    nullif(v_out->>'Site Address',''),
    case when public.normalize_property(v_out->>'Job Site')  is not null then v_out->>'Job Site'  end,
    case when public.normalize_property(v_out->>'Project')   is not null then v_out->>'Project'   end,
    case when public.normalize_property(v_out->>'Ship To')   is not null then v_out->>'Ship To'   end,
    case when public.normalize_property(v_out->>'PO Number') is not null then v_out->>'PO Number' end);
  v_canon := public.normalize_property(v_addr);
  if v_canon is not null then
    v_out := v_out || jsonb_build_object('Job Site', initcap(v_canon), 'Site Address', v_addr);
  end if;
  return v_out;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_next_uploads(p_limit integer DEFAULT 5)
 RETURNS json[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.claim_upload(p_upload_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.classify_line(p_name text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case
    when n is null then 'product'
    when n ~ '\y(assessment|levy|enviro|environmental|eco fee|recycling fee|core charge)\y' then 'tax'
    when n ~ '\y(sales tax|use tax|vat|gst|hst|pst|lumber tax)\y' then 'tax'
    when n ~ '\y(fee|fees|surcharge|service charge|processing|convenience)\y' then 'fee'
    when n ~ '\y(discount|rebate|promo|promotion|coupon|credit memo|credit note)\y' then 'discount'
    when n ~ '\y(shipping|freight|delivery|handling|postage|carriage|fuel surcharge)\y' then 'shipping'
    when n ~ '\y(labor|labour|installation|service call|travel time)\y' then 'labor'
    when n ~ '\y(adjustment|rounding|balance forward|previous balance)\y' then 'adjustment'
    else 'product' end
  from (select public.normalize_item(p_name) as n) s
$function$
;

CREATE OR REPLACE FUNCTION public.dataset_stats()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.fail_upload(p_upload_id uuid, p_error text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.uploads
  SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'queued' END,
      error_message = p_error,
      processed_at = now()
  WHERE id = p_upload_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ingest_receipts(p_upload_id uuid, p_receipts jsonb, p_parser text DEFAULT NULL::text, p_confidence numeric DEFAULT NULL::numeric, p_extracted jsonb DEFAULT NULL::jsonb, p_page_count integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_up public.uploads%rowtype;
  v_rec jsonb; v_li jsonb;
  v_rid uuid; v_vid uuid; v_iid uuid;
  v_ids uuid[] := '{}'; v_reasons text[];
  v_merchant text; v_norm text; v_billto text; v_billto_self boolean;
  v_date date; v_sub numeric; v_tax numeric; v_total numeric; v_linesum numeric;
  v_qty numeric; v_unit numeric; v_lt numeric; v_dedupe text; v_dup uuid;
  v_lineno int; v_needs int := 0; v_seen jsonb := '{}'::jsonb;
  v_invno text;
begin
  select * into v_up from public.uploads where id=p_upload_id for update;
  if not found then raise exception 'upload % not found', p_upload_id; end if;

  delete from public.receipts where upload_id=p_upload_id;

  if p_receipts is null or jsonb_typeof(p_receipts)<>'array' or jsonb_array_length(p_receipts)=0 then
    update public.uploads set status='failed', error_message='parser returned no receipts',
      parser=coalesce(p_parser,parser), extracted=coalesce(p_extracted,extracted),
      processed_at=now(), attempts=attempts+1 where id=p_upload_id;
    return jsonb_build_object('receipt_count',0,'status','failed');
  end if;

  for v_rec in select value from jsonb_array_elements(p_receipts) loop
    v_reasons := '{}';
    v_date  := public.safe_date(v_rec->>'date');
    v_sub   := coalesce(public.safe_num(v_rec,'subtotal'),0);
    v_tax   := coalesce(public.safe_num(v_rec,'tax'),0);
    v_total := coalesce(public.safe_num(v_rec,'total'),0);

    select coalesce(sum(coalesce(public.safe_num(value,'total_price'),
             coalesce(public.safe_num(value,'quantity'),0)*coalesce(public.safe_num(value,'unit_price'),0))),0)
      into v_linesum from jsonb_array_elements(coalesce(v_rec->'line_items','[]'::jsonb));

    if v_total=0 and (v_sub<>0 or v_tax<>0) then v_total := v_sub+v_tax; end if;
    if v_sub=0 and v_linesum<>0 then v_sub := round(v_linesum,2); end if;
    if v_total=0 and v_sub<>0 then v_total := v_sub+v_tax; end if;

    if v_date is not null and (v_date > (current_date+interval '31 days')::date or v_date < date '2000-01-01') then
      v_reasons := array_append(v_reasons,'implausible invoice date ('||v_date||') discarded'); v_date := null;
    end if;
    if v_date is null then v_reasons := array_append(v_reasons,'missing invoice date'); end if;
    if v_total=0 then v_reasons := array_append(v_reasons,'zero total'); end if;
    if abs(v_total-v_sub-v_tax) > greatest(0.02, abs(v_total)*0.01) then
      v_reasons := array_append(v_reasons,'subtotal + tax does not reconcile to total'); end if;
    if v_linesum<>0 and abs(v_linesum-v_sub) > greatest(0.02, abs(v_sub)*0.02) then
      v_reasons := array_append(v_reasons,'line items do not sum to subtotal'); end if;
    if p_confidence is not null and p_confidence < 0.70 then
      v_reasons := array_append(v_reasons,'low extraction confidence'); end if;

    v_merchant := nullif(btrim(v_rec->>'merchant'),'');
    if v_merchant is null or public.is_self_identity(v_merchant) then
      v_reasons := array_append(v_reasons,'vendor could not be identified (own name or blank was extracted as merchant)');
      v_merchant := 'Unknown Vendor';
    end if;
    v_billto := nullif(btrim(v_rec->>'bill_to'),'');
    v_billto_self := case when v_billto is null then null else public.is_self_identity(v_billto) end;
    if v_billto is not null and v_billto_self is false then
      v_reasons := array_append(v_reasons,'invoice billed to a third party ('||v_billto||') - possible misfile or fraud');
    end if;

    v_norm := public.normalize_vendor(v_merchant);
    v_vid  := public.resolve_vendor(v_up.user_id, v_merchant, nullif(btrim(v_rec->>'category'),''));

    -- ---- Duplicate detection (invoice-identity) --------------------------------
    -- Primary key: same vendor + same invoice number, corroborated by a matching
    -- date OR a matching total. The corroborator lets us catch the same invoice
    -- re-imported from another source (e.g. Google Drive vs manual) even when one
    -- field parsed slightly differently, while NOT merging distinct invoices that
    -- merely reuse an invoice number (small vendors numbering 488, 489, ...).
    -- Fallback (no invoice number): vendor + date + total.
    v_invno := nullif(btrim(v_rec->>'invoice_no'),'');
    v_dup := null;
    if v_invno is not null then
      v_dedupe := coalesce(v_norm,'?')||'|'||lower(v_invno)||'|'||v_total::text;
      if v_seen ? v_dedupe then
        v_dup := (v_seen->>v_dedupe)::uuid;
      else
        select id into v_dup from public.receipts
          where user_id=v_up.user_id and duplicate_of is null
            and normalized_merchant = v_norm
            and lower(coalesce(invoice_no,'')) = lower(v_invno)
            and ( (v_date is not null and date is not distinct from v_date)
                  or total = round(v_total,2) )
          limit 1;
      end if;
    else
      v_dedupe := coalesce(v_norm,'?')||'||'||coalesce(v_date::text,'?')||'|'||v_total::text;
      if v_seen ? v_dedupe then
        v_dup := (v_seen->>v_dedupe)::uuid;
      elsif v_date is not null then
        select id into v_dup from public.receipts
          where user_id=v_up.user_id and duplicate_of is null
            and normalized_merchant = v_norm
            and date is not distinct from v_date
            and total = round(v_total,2)
            and coalesce(invoice_no,'')=''
          limit 1;
      end if;
    end if;
    if v_dup is not null then
      v_reasons := array_append(v_reasons,'duplicate of an already-ingested invoice');
    end if;

    insert into public.receipts (
      user_id, upload_id, vendor_id, merchant, normalized_merchant, invoice_no, date,
      subtotal, tax, total, currency, category, filename, custom_fields,
      dedupe_key, duplicate_of, total_variance, confidence, needs_review, review_reason,
      bill_to, bill_to_is_self)
    values (
      v_up.user_id, p_upload_id, v_vid, v_merchant, v_norm,
      v_invno, v_date,
      round(v_sub,2), round(v_tax,2), round(v_total,2),
      upper(coalesce(nullif(btrim(v_rec->>'currency'),''),'USD')),
      nullif(btrim(v_rec->>'category'),''),
      coalesce(nullif(btrim(v_rec->>'filename'),''), v_up.filename),
      public.canonicalize_custom_fields(v_rec->'custom_fields'),
      v_dedupe, v_dup, round(v_total-v_sub-v_tax,2), p_confidence,
      array_length(v_reasons,1) is not null, nullif(array_to_string(v_reasons,'; '),''),
      v_billto, v_billto_self)
    returning id into v_rid;

    if v_dup is null then
      v_seen := v_seen || jsonb_build_object(v_dedupe, v_rid);
    end if;
    v_ids := v_ids || v_rid;
    if array_length(v_reasons,1) is not null then v_needs := v_needs+1; end if;

    if v_dup is null then
      v_lineno := 0;
      for v_li in select value from jsonb_array_elements(coalesce(v_rec->'line_items','[]'::jsonb)) loop
        if nullif(btrim(coalesce(v_li->>'name','')),'') is null then continue; end if;
        v_lineno := v_lineno+1;
        v_qty  := coalesce(public.safe_num(v_li,'quantity'),1);
        v_unit := public.safe_num(v_li,'unit_price');
        v_lt   := public.safe_num(v_li,'total_price');
        if v_unit is null and v_lt is not null and v_qty<>0 then v_unit := v_lt/v_qty; end if;
        if v_lt is null then v_lt := v_qty*coalesce(v_unit,0); end if;
        v_iid := public.resolve_canonical_item(v_up.user_id, v_li->>'name',
                   nullif(btrim(v_li->>'uom'),''), nullif(btrim(v_rec->>'category'),''));
        insert into public.line_items (
          user_id, receipt_id, canonical_item_id, vendor_id, receipt_date,
          line_no, name, sku, uom, quantity, unit_price, total_price)
        values (
          v_up.user_id, v_rid, v_iid, v_vid, v_date, v_lineno, btrim(v_li->>'name'),
          nullif(btrim(v_li->>'sku'),''), nullif(btrim(v_li->>'uom'),''),
          v_qty, round(coalesce(v_unit,0),4), round(v_lt,2));
      end loop;
    end if;
  end loop;

  update public.uploads set
    status = case when v_needs>0 then 'needs_review'::public.upload_status else 'complete'::public.upload_status end,
    receipt_id = case when array_length(v_ids,1)=1 then v_ids[1] else null end,
    receipt_count = coalesce(array_length(v_ids,1),0),
    parser = coalesce(p_parser,parser), confidence = coalesce(p_confidence,confidence),
    extracted = coalesce(p_extracted,extracted), page_count = coalesce(p_page_count,page_count),
    error_message = null, processed_at = now(), attempts = attempts+1
  where id=p_upload_id;

  return jsonb_build_object('receipt_ids',to_jsonb(v_ids),
    'receipt_count',coalesce(array_length(v_ids,1),0),'needs_review_count',v_needs);
end; $function$
;

CREATE OR REPLACE FUNCTION public.is_self_identity(t text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case when public.normalize_vendor(t) is null then false else exists (
    select 1 from public.self_identities si
    where case si.match_type
      when 'exact'  then public.normalize_vendor(t) = si.pattern
      when 'prefix' then public.normalize_vendor(t) like si.pattern || '%'
      when 'word'   then public.normalize_vendor(t) ~ ('\y' || si.pattern || '\y')
      else false end
  ) end
$function$
;

CREATE OR REPLACE FUNCTION public.line_item_inherit_vendor()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  select r.vendor_id into new.vendor_id from public.receipts r where r.id = new.receipt_id;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.line_items_classify()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.normalized_name := public.normalize_item(new.name);
  new.line_kind := public.classify_line(new.name)::public.line_kind;
  if new.line_kind not in ('product','labor') then new.canonical_item_id := null; end if;
  return new;
end; $function$
;

CREATE OR REPLACE FUNCTION public.merge_canonical_items(p_keep uuid, p_merge uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.merge_vendors(p_keep uuid, p_merge uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.normalize_item(t text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare x text := lower(coalesce(t,''));
begin
  x := regexp_replace(x, '([0-9])\s*"', '\1 in ', 'g');
  x := regexp_replace(x, '([0-9])\s*''', '\1 ft ', 'g');
  x := regexp_replace(x, '([0-9])\s*(inches|inch|in)\y', '\1 in ', 'g');
  x := regexp_replace(x, '([0-9])\s*(feet|foot|ft)\y', '\1 ft ', 'g');
  x := regexp_replace(x, '([0-9])\s*x\s*([0-9])', '\1 x \2', 'g');
  x := regexp_replace(x, '[^a-z0-9 ]+', ' ', 'g');
  x := btrim(regexp_replace(x, '\s+', ' ', 'g'));
  return nullif(x, '');
end $function$
;

CREATE OR REPLACE FUNCTION public.normalize_property(t text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
declare s text; m text[]; house text; rest text; w text; out_words text[] := '{}';
begin
  s := lower(coalesce(t,''));
  s := split_part(s, ',', 1);
  s := btrim(regexp_replace(regexp_replace(s,'[^a-z0-9 ]',' ','g'), '\s+',' ','g'));
  -- first 1-6 digit number that is immediately followed by an alphabetic word
  m := regexp_match(s, '(\y\d{1,6}\y)\s+([a-z])');
  if m is null then return null; end if;
  house := m[1];
  -- everything from that house number onward
  rest := btrim(substring(s from position(house||' ' in s) + length(house) + 1));
  if rest = '' then return null; end if;
  foreach w in array regexp_split_to_array(rest,' ') loop
    if w in ('n','s','e','w','north','south','east','west','no','so') then continue; end if;
    if w in ('st','street','ave','av','avenue','blvd','boulevard','dr','drive','rd','road',
             'ln','lane','way','ct','court','pl','place','ste','suite','unit','apt','cir',
             'circle','ter','terrace','pkwy','parkway','hwy') then exit; end if;
    if w ~ '^\d' then exit; end if;
    out_words := out_words || w;
    exit when array_length(out_words,1) >= 2;
  end loop;
  if array_length(out_words,1) is null then return null; end if;
  return house || ' ' || array_to_string(out_words,' ');
end;
$function$
;

CREATE OR REPLACE FUNCTION public.normalize_vendor(t text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  select nullif(btrim(regexp_replace(
    regexp_replace(
      lower(coalesce(t,'')),
      '\y(inc|llc|ltd|limited|corp|corporation|co|company|gmbh|ag|bv|nv|plc|lp|llp|pty|pte|holdings|group|www|com|net|org)\y',
      ' ', 'g'),
    '[^a-z0-9]+',' ','g')), '')
$function$
;

CREATE OR REPLACE FUNCTION public.pillar_arbitrage()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
with lines as (
  select l.canonical_item_id item_id, ci.display_name product,
         public.canonical_uom(l.uom) as cuom,
         l.vendor_id, coalesce(v.display_name,'—') vendor,
         l.unit_price, l.quantity, l.total_price, l.receipt_date dt, r.invoice_no
  from public.line_items l
  join public.canonical_items ci on ci.id = l.canonical_item_id
  left join public.vendors v on v.id = l.vendor_id
  join public.receipts r on r.id = l.receipt_id
  where l.canonical_item_id is not null
    and l.line_kind = 'product'
    and l.receipt_date is not null and l.unit_price > 0 and r.duplicate_of is null
    and ci.display_name ~ '[A-Za-z]'
    and length(btrim(ci.display_name)) >= 3
    -- must be a SPECIFIC product: drop invoice refs, pure numbers, and generic
    -- service/category/catch-all line descriptions (not "exactly the same" items)
    and ci.display_name !~* '#\s*[0-9]'
    and ci.display_name !~* '^\s*[#0-9 .,\-]+$'
    and ci.display_name !~* '\y(invoice|inv|receipt|ticket|statement|sale|sales|misc|miscellaneous|adjustment|credit|balance|deposit|payment|total|subtotal|tax|fee|fees|freight|shipping|delivery|handling|consumable|consumables|labor|labour|material|materials|service|services|rental|rentals|pump|pumped|pumping|fuel|surcharge|standby|supply|supplies|charge|charges|equipment|red?i?mix|other)\y'
),
per_vendor as (
  select distinct on (item_id, cuom, vendor_id) item_id, product, cuom, vendor_id, vendor,
         unit_price, quantity, total_price, dt, invoice_no
  from lines order by item_id, cuom, vendor_id, dt desc
),
multi as (  -- exact same item + same unit, from 2+ DIFFERENT vendors
  select item_id, cuom from per_vendor group by item_id, cuom having count(distinct vendor_id) >= 2
),
latest as (
  select distinct on (l.item_id, l.cuom) l.item_id, l.cuom, l.unit_price cur_price, l.dt cur_dt
  from lines l join multi m on m.item_id=l.item_id and m.cuom is not distinct from l.cuom
  order by l.item_id, l.cuom, l.dt desc
),
mqty as (
  select l.item_id, l.cuom, sum(l.quantity) monthly_qty
  from lines l join latest la on la.item_id=l.item_id and la.cuom is not distinct from l.cuom
  where l.dt > la.cur_dt - interval '30 days' and l.dt <= la.cur_dt
  group by l.item_id, l.cuom
)
select coalesce(jsonb_agg(x order by (x->>'annualSavings')::numeric desc), '[]'::jsonb) from (
  select jsonb_build_object(
    'id', la.item_id, 'product', pv.product, 'unit', coalesce(pv.cuom,'ea'),
    'currentPrice', round(la.cur_price,4), 'bestPrice', round(min(pv.unit_price),4),
    'lazyTax', round(la.cur_price - min(pv.unit_price),4),
    'savingsPerUnit', round(la.cur_price - min(pv.unit_price),4),
    'monthlyQty', coalesce(mq.monthly_qty,0),
    'monthlySavings', round((la.cur_price - min(pv.unit_price)) * coalesce(mq.monthly_qty,0),2),
    'annualSavings', round((la.cur_price - min(pv.unit_price)) * coalesce(mq.monthly_qty,0) * 12,2),
    'contractEnd', '',
    'vendors', jsonb_agg(jsonb_build_object('name', pv.vendor, 'price', round(pv.unit_price,4),
        'invoiceNo', pv.invoice_no, 'invoiceDate', pv.dt, 'qty', pv.quantity, 'total', pv.total_price) order by pv.unit_price)
  ) as x
  from per_vendor pv
  join multi m   on m.item_id = pv.item_id and m.cuom is not distinct from pv.cuom
  join latest la on la.item_id = pv.item_id and la.cuom is not distinct from pv.cuom
  left join mqty mq on mq.item_id = pv.item_id and mq.cuom is not distinct from pv.cuom
  group by la.item_id, pv.product, pv.cuom, la.cur_price, mq.monthly_qty
  having la.cur_price - min(pv.unit_price) > 0
) s;
$function$
;

CREATE OR REPLACE FUNCTION public.pillar_integrity()
 RETURNS TABLE(id text, type text, severity text, vendor text, amount numeric, description text, date date, receipt_id uuid)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  -- Duplicate invoices (same vendor + invoice_no + total already ingested).
  select 'dup:'||r.id::text, 'duplicate_invoice', 'high',
         coalesce(v.display_name, r.merchant), r.total,
         'Possible duplicate of an already-recorded invoice'||
           coalesce(' ('||r.invoice_no||')',''), r.date, r.id
    from public.receipts r left join public.vendors v on v.id=r.vendor_id
   where r.duplicate_of is not null
  union all
  -- Billed to a third party (not the account holder) — misfile or fraud.
  select 'mandate:'||r.id::text, 'mandate_fraud', 'critical',
         coalesce(v.display_name, r.merchant), r.total,
         'Invoice is billed to '||coalesce(r.bill_to,'a third party')||
           ', not the account holder', r.date, r.id
    from public.receipts r left join public.vendors v on v.id=r.vendor_id
   where r.bill_to_is_self is false
  union all
  -- Vendor could not be identified (logo-only / own name extracted as merchant).
  select 'phantom:'||r.id::text, 'phantom_vendor', 'high',
         coalesce(v.display_name, r.merchant), r.total,
         'Vendor could not be identified on this invoice — needs review',
         r.date, r.id
    from public.receipts r left join public.vendors v on v.id=r.vendor_id
   where public.is_self_identity(r.merchant) or r.merchant = 'Unknown Vendor'
  order by 3, 5 desc;  -- severity, then amount
$function$
;

CREATE OR REPLACE FUNCTION public.pillar_price_drift()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
with lines as (
  select l.canonical_item_id item_id, ci.display_name product, l.vendor_id,
         v.display_name vendor, l.unit_price, l.quantity, l.total_price,
         l.receipt_date dt, r.invoice_no
  from public.line_items l
  join public.canonical_items ci on ci.id = l.canonical_item_id
  left join public.vendors v on v.id = l.vendor_id
  join public.receipts r on r.id = l.receipt_id
  where l.canonical_item_id is not null and l.line_kind in ('product','labor')
    and l.receipt_date is not null and l.unit_price > 0 and r.duplicate_of is null
),
latest as (
  select distinct on (item_id) item_id, product, vendor,
         unit_price cur_price, quantity cur_qty, total_price cur_total, dt cur_dt, invoice_no cur_inv
  from lines order by item_id, dt desc, unit_price desc
),
hist as (
  select l.item_id, avg(l.unit_price) avg90,
         jsonb_agg(jsonb_build_object('invoiceNo', l.invoice_no, 'date', l.dt,
           'unitPrice', round(l.unit_price,4), 'qty', l.quantity, 'total', l.total_price)
           order by l.dt desc) hist
  from lines l join latest la on la.item_id = l.item_id
  where l.dt < la.cur_dt and l.dt >= la.cur_dt - interval '90 days'
  group by l.item_id
)
select coalesce(jsonb_agg(x order by x->>'driftPercent' desc), '[]'::jsonb) from (
  select jsonb_build_object(
    'id', la.item_id, 'product', la.product, 'vendor', coalesce(la.vendor,'—'),
    'currentPrice', round(la.cur_price,4), 'avg90Day', round(h.avg90,4),
    'driftPercent', round(((la.cur_price - h.avg90) / nullif(h.avg90,0)) * 100, 2),
    'status', case
       when ((la.cur_price - h.avg90)/nullif(h.avg90,0))*100 > 5 then 'alert'
       when ((la.cur_price - h.avg90)/nullif(h.avg90,0))*100 >= 2 then 'warning'
       else 'stable' end,
    'recentInvoice', jsonb_build_object('invoiceNo', la.cur_inv, 'date', la.cur_dt,
       'unitPrice', round(la.cur_price,4), 'qty', la.cur_qty, 'total', la.cur_total),
    'historicalInvoices', h.hist) as x
  from latest la join hist h on h.item_id = la.item_id
) s;
$function$
;

CREATE OR REPLACE FUNCTION public.pillar_recurring_items()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', item_id, 'product', product,
    'burnRate', round(total_qty / nullif(months,0), 2),   -- units/month
    'currentStock', null, 'daysRemaining', null, 'bulkDiscount', 0,
    'buys', buys, 'totalSpend', round(spend,2),
    'suggestedAction', 'Bought '||buys||'x across '||round(months,1)||' months — consolidate orders or negotiate bulk pricing'
  ) order by spend desc), '[]'::jsonb)
  from (
    select l.canonical_item_id item_id, ci.display_name product,
           count(*) buys, sum(l.quantity) total_qty, sum(l.total_price) spend,
           greatest(1, (max(l.receipt_date)-min(l.receipt_date))/30.0) months
    from public.line_items l join public.canonical_items ci on ci.id=l.canonical_item_id
    join public.receipts r on r.id=l.receipt_id
    where l.canonical_item_id is not null and l.line_kind in ('product','labor')
      and l.receipt_date is not null and r.duplicate_of is null
    group by l.canonical_item_id, ci.display_name
    having count(distinct l.receipt_date) >= 3   -- recurring = bought on 3+ dates
  ) t;
$function$
;

CREATE OR REPLACE FUNCTION public.pillar_spending_trends()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'period', period, 'costs', costs, 'revenue', 0, 'margin', 0) order by period), '[]'::jsonb)
  from (
    select to_char(date_trunc('month', date),'YYYY-MM') period, round(sum(total),2) costs
    from public.receipts where duplicate_of is null and date is not null
    group by date_trunc('month', date)
  ) t;
$function$
;

CREATE OR REPLACE FUNCTION public.pillar_vendor_bloat()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
with lines as (
  select coalesce(r.category,'Uncategorized') category, l.canonical_item_id item_id,
         l.vendor_id, l.unit_price, l.quantity, l.receipt_date dt
  from public.line_items l join public.receipts r on r.id=l.receipt_id
  where l.canonical_item_id is not null and l.line_kind in ('product','labor')
    and l.unit_price>0 and l.receipt_date is not null and r.duplicate_of is null
),
pv as (select distinct on (item_id,vendor_id) category,item_id,vendor_id,unit_price,dt
       from lines order by item_id,vendor_id,dt desc),
latest as (select distinct on (item_id) item_id, unit_price cur, dt cur_dt from lines order by item_id, dt desc),
q30 as (select l.item_id, sum(l.quantity) q from lines l join latest la on la.item_id=l.item_id
        where l.dt> la.cur_dt - interval '30 days' and l.dt<=la.cur_dt group by l.item_id),
item_sav as (  -- annual consolidation saving per item (if 2+ vendors and a cheaper one)
  select pv.category, la.item_id,
         greatest(0, la.cur - min(pv.unit_price)) * coalesce(q.q,0) * 12 as annual_sav
  from pv join latest la on la.item_id=pv.item_id left join q30 q on q.item_id=pv.item_id
  group by pv.category, la.item_id, la.cur, q.q having count(*)>=2
),
cat as (
  select coalesce(category,'Uncategorized') category,
         count(distinct vendor_id) vc, sum(total) spend
  from public.receipts where duplicate_of is null and date is not null group by 1
)
select coalesce(jsonb_agg(jsonb_build_object(
  'category', c.category, 'vendorCount', c.vc, 'industryAvg', 2,
  'redundancyScore', round(greatest(0,(c.vc-2))::numeric/nullif(c.vc,0),2),
  'potentialSavings', round(coalesce((select sum(annual_sav) from item_sav s where s.category=c.category),0),2)
) order by c.vc desc), '[]'::jsonb)
from cat c where c.vc >= 1;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_canonical_item(p_user_id uuid, p_name text, p_uom text DEFAULT NULL::text, p_category text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_norm text; v_id uuid;
begin
  if public.classify_line(p_name) not in ('product','labor') then return null; end if;
  v_norm := public.normalize_item(p_name);
  if v_norm is null then return null; end if;
  select canonical_item_id into v_id from public.item_aliases
    where user_id=p_user_id and normalized_alias=v_norm;
  if v_id is not null then return v_id; end if;
  select id into v_id from public.canonical_items where user_id=p_user_id and normalized_name=v_norm;
  if v_id is not null then return v_id; end if;
  insert into public.canonical_items (user_id, display_name, normalized_name, uom, category)
  values (p_user_id, btrim(p_name), v_norm, p_uom, p_category)
  on conflict (user_id, normalized_name) do update set display_name=public.canonical_items.display_name
  returning id into v_id;
  return v_id;
end; $function$
;

CREATE OR REPLACE FUNCTION public.resolve_vendor(p_user_id uuid, p_name text, p_category text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_norm text; v_id uuid;
begin
  if public.is_self_identity(p_name) then p_name := 'Unknown Vendor'; end if;
  v_norm := public.normalize_vendor(p_name);
  if v_norm is null then v_norm := 'unknown vendor'; p_name := 'Unknown Vendor'; end if;
  select vendor_id into v_id from public.vendor_aliases
    where user_id=p_user_id and normalized_alias=v_norm;
  if v_id is not null then return v_id; end if;
  select id into v_id from public.vendors where user_id=p_user_id and normalized_name=v_norm;
  if v_id is not null then
    if p_category is not null then
      update public.vendors set category=coalesce(category,p_category) where id=v_id;
    end if;
    return v_id;
  end if;
  insert into public.vendors (user_id, display_name, normalized_name, category)
  values (p_user_id, btrim(p_name), v_norm, p_category)
  on conflict (user_id, normalized_name) do update set display_name=public.vendors.display_name
  returning id into v_id;
  return v_id;
end; $function$
;

CREATE OR REPLACE FUNCTION public.review_queue()
 RETURNS TABLE(receipt_id uuid, merchant text, invoice_no text, receipt_date date, subtotal numeric, tax numeric, total numeric, currency text, category text, review_reason text, is_duplicate boolean, bill_to text, filename text, source text, storage_path text, mime_type text, created_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select r.id, r.merchant, r.invoice_no, r.date, r.subtotal, r.tax, r.total, r.currency, r.category,
         r.review_reason, (r.duplicate_of is not null), r.bill_to,
         u.filename, u.source::text, u.storage_path, u.mime_type, r.created_at
  from public.receipts r
  left join public.uploads u on u.id=r.upload_id
  where r.user_id=auth.uid() and r.needs_review=true
  order by (r.duplicate_of is not null), r.total desc nulls last, r.created_at desc;
$function$
;

CREATE OR REPLACE FUNCTION public.review_resolve(p_receipt_id uuid, p_action text, p_patch jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_r public.receipts%rowtype;
  v_merchant text; v_norm text; v_vid uuid; v_sub numeric; v_tax numeric; v_total numeric;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_r from public.receipts where id=p_receipt_id and user_id=v_uid;
  if not found then raise exception 'receipt not found'; end if;

  if p_action='delete' then
    delete from public.receipts where id=p_receipt_id and user_id=v_uid;
    return jsonb_build_object('ok',true,'action','delete');

  elsif p_action='not_duplicate' then
    update public.receipts set duplicate_of=null, needs_review=false,
      review_reason = nullif(btrim(regexp_replace(coalesce(review_reason,''),
        '(^|; )duplicate of an already-ingested invoice',''), '; '), '')
     where id=p_receipt_id and user_id=v_uid;
    return jsonb_build_object('ok',true,'action','not_duplicate');

  elsif p_action='confirm_duplicate' then
    update public.receipts set needs_review=false where id=p_receipt_id and user_id=v_uid;
    return jsonb_build_object('ok',true,'action','confirm_duplicate');

  elsif p_action='save' and p_patch is not null and p_patch<>'{}'::jsonb then
    v_merchant := coalesce(nullif(btrim(p_patch->>'merchant'),''), v_r.merchant);
    v_norm := public.normalize_vendor(v_merchant);
    v_vid  := public.resolve_vendor(v_uid, v_merchant, coalesce(nullif(btrim(p_patch->>'category'),''), v_r.category));
    v_sub  := coalesce(public.safe_num(p_patch,'subtotal'), v_r.subtotal);
    v_tax  := coalesce(public.safe_num(p_patch,'tax'), v_r.tax);
    v_total:= coalesce(public.safe_num(p_patch,'total'), v_r.total);
    update public.receipts set
      merchant=v_merchant, normalized_merchant=v_norm, vendor_id=v_vid,
      invoice_no=coalesce(nullif(btrim(p_patch->>'invoice_no'),''), invoice_no),
      date=coalesce(public.safe_date(p_patch->>'date'), date),
      subtotal=round(v_sub,2), tax=round(v_tax,2), total=round(v_total,2),
      total_variance=round(v_total-coalesce(v_sub,0)-coalesce(v_tax,0),2),
      category=coalesce(nullif(btrim(p_patch->>'category'),''), category),
      needs_review=false, review_reason=null
     where id=p_receipt_id and user_id=v_uid;
    update public.line_items set vendor_id=v_vid where receipt_id=p_receipt_id;
    return jsonb_build_object('ok',true,'action','save');

  else
    update public.receipts set needs_review=false, review_reason=null
     where id=p_receipt_id and user_id=v_uid;
    return jsonb_build_object('ok',true,'action','approve');
  end if;
end; $function$
;

CREATE OR REPLACE FUNCTION public.safe_date(t text)
 RETURNS date
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
begin
  return nullif(btrim(coalesce(t,'')),'')::date;
exception when others then return null; end;
$function$
;

CREATE OR REPLACE FUNCTION public.safe_num(j jsonb, k text)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare raw text := coalesce(j->>k,''); sgn int := 1; digits text;
begin
  if raw ~ '^\s*[\(\-]' then sgn := -1; end if;
  digits := nullif(regexp_replace(raw,'[^0-9.]','','g'),'');
  if digits is null then return null; end if;
  return sgn * digits::numeric;
exception when others then return null; end;
$function$
;

CREATE OR REPLACE FUNCTION public.skip_upload(p_upload_id uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.uploads
     set status = 'skipped', error_message = left(coalesce(p_reason,'skipped'),2000),
         processed_at = now()
   where id = p_upload_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.suggest_item_merges()
 RETURNS TABLE(keep uuid, merge uuid, keep_name text, merge_name text, score numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.suggest_vendor_merges()
 RETURNS TABLE(keep uuid, merge uuid, keep_name text, merge_name text, score numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.sync_line_items_from_receipt()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.line_items
  SET vendor_id = NEW.vendor_id,
      receipt_date = NEW.date
  WHERE receipt_id = NEW.id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;


-- ---------- RLS POLICIES ----------

CREATE POLICY canonical_items_owner ON public.canonical_items AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY owner_all_drive_config ON public.drive_config AS PERMISSIVE FOR ALL TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY item_aliases_owner ON public.item_aliases AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY line_items_owner ON public.line_items AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY receipts_owner ON public.receipts AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY owner_all_saved_models ON public.saved_models AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY owner_all_self_identities ON public.self_identities AS PERMISSIVE FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY uploads_owner ON public.uploads AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY vendor_aliases_owner ON public.vendor_aliases AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY vendors_owner ON public.vendors AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

-- ---------- TRIGGERS ----------

CREATE TRIGGER update_canonical_items_updated_at BEFORE UPDATE ON public.canonical_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER drive_config_touch BEFORE UPDATE ON public.drive_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER line_items_classify_trg BEFORE INSERT OR UPDATE OF name ON public.line_items FOR EACH ROW EXECUTE FUNCTION line_items_classify();
CREATE TRIGGER trg_line_item_inherit_vendor BEFORE INSERT ON public.line_items FOR EACH ROW EXECUTE FUNCTION line_item_inherit_vendor();
CREATE TRIGGER sync_line_items_from_receipt AFTER INSERT OR UPDATE OF vendor_id, date ON public.receipts FOR EACH ROW EXECUTE FUNCTION sync_line_items_from_receipt();
CREATE TRIGGER trg_ace_alias_receipt BEFORE INSERT OR UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION ace_alias_receipt();
CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_uploads_updated_at BEFORE UPDATE ON public.uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
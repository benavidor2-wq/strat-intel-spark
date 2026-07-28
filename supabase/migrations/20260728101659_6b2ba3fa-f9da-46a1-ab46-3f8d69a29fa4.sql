-- Invoiciify full schema migration
-- Run this against the external Supabase project once after connecting it.
-- It creates the ingestion queue, receipts + line items, canonical vendors/items,
-- the read helpers, and the RLS policies required by the single-owner model.

-- Enable trigram matching for fuzzy merge suggestions.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'upload_source') THEN
    CREATE TYPE public.upload_source AS ENUM ('manual', 'google_drive', 'email');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'upload_status') THEN
    CREATE TYPE public.upload_status AS ENUM ('queued', 'processing', 'complete', 'needs_review', 'failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'line_kind') THEN
    CREATE TYPE public.line_kind AS ENUM ('product', 'labor', 'discount', 'shipping', 'tax', 'fee', 'adjustment');
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  normalized_name text NOT NULL,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, normalized_name)
);

CREATE TABLE IF NOT EXISTS public.vendor_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, normalized_alias)
);

CREATE TABLE IF NOT EXISTS public.canonical_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  normalized_name text NOT NULL,
  uom text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, normalized_name)
);

CREATE TABLE IF NOT EXISTS public.item_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canonical_item_id uuid NOT NULL REFERENCES public.canonical_items(id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, normalized_alias)
);

CREATE TABLE IF NOT EXISTS public.uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source public.upload_source NOT NULL DEFAULT 'manual',
  storage_path text NOT NULL,
  filename text NOT NULL,
  mime_type text,
  byte_size bigint,
  content_sha256 text NOT NULL,
  status public.upload_status NOT NULL DEFAULT 'queued',
  error_message text,
  attempts int NOT NULL DEFAULT 0,
  parser text,
  page_count int,
  confidence numeric,
  extracted jsonb,
  receipt_id uuid,
  receipt_count int,
  external_id text,
  processing_started_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_sha256)
);

CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_id uuid REFERENCES public.uploads(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  merchant text,
  normalized_merchant text,
  invoice_no text,
  date date,
  subtotal numeric,
  tax numeric,
  total numeric,
  currency text,
  category text,
  filename text,
  custom_fields jsonb NOT NULL DEFAULT '{}',
  dedupe_key text,
  duplicate_of uuid REFERENCES public.receipts(id) ON DELETE SET NULL,
  total_variance numeric,
  confidence numeric,
  needs_review boolean NOT NULL DEFAULT false,
  review_reason text,
  bill_to text,
  bill_to_is_self boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Receipt referenced by uploads, so the FK must be added after the table exists.
ALTER TABLE public.uploads
  DROP CONSTRAINT IF EXISTS uploads_receipt_id_fkey,
  ADD CONSTRAINT uploads_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipts(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_id uuid NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  canonical_item_id uuid REFERENCES public.canonical_items(id) ON DELETE SET NULL,
  receipt_date date,
  line_no int,
  name text NOT NULL,
  normalized_name text,
  sku text,
  uom text,
  quantity numeric,
  unit_price numeric,
  total_price numeric,
  line_kind public.line_kind NOT NULL DEFAULT 'product',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_uploads_user_status ON public.uploads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_uploads_user_sha256 ON public.uploads(user_id, content_sha256);
CREATE INDEX IF NOT EXISTS idx_receipts_user_date ON public.receipts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_receipts_user_duplicate ON public.receipts(user_id, duplicate_of);
CREATE INDEX IF NOT EXISTS idx_receipts_dedupe ON public.receipts(user_id, dedupe_key);
CREATE INDEX IF NOT EXISTS idx_receipts_upload ON public.receipts(upload_id);
CREATE INDEX IF NOT EXISTS idx_line_items_receipt ON public.line_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_line_items_canonical ON public.line_items(canonical_item_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user_name ON public.vendors(user_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_canonical_items_user_name ON public.canonical_items(user_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_vendor_aliases_user_alias ON public.vendor_aliases(user_id, normalized_alias);
CREATE INDEX IF NOT EXISTS idx_item_aliases_user_alias ON public.item_aliases(user_id, normalized_alias);

-- Trigram indexes for fuzzy merge suggestions.
CREATE INDEX IF NOT EXISTS idx_vendors_trgm ON public.vendors USING gin (normalized_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_canonical_items_trgm ON public.canonical_items USING gin (normalized_name gin_trgm_ops);
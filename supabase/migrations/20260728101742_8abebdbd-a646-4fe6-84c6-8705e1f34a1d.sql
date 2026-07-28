-- Triggers: keep line_items denormalized from the parent receipt
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_line_items_from_receipt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.line_items
  SET vendor_id = NEW.vendor_id,
      receipt_date = NEW.date
  WHERE receipt_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_line_items_from_receipt ON public.receipts;
CREATE TRIGGER sync_line_items_from_receipt
AFTER INSERT OR UPDATE OF vendor_id, date ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION public.sync_line_items_from_receipt();

-- ---------------------------------------------------------------------------
-- Updated-at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_vendors_updated_at ON public.vendors;
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_canonical_items_updated_at ON public.canonical_items;
CREATE TRIGGER update_canonical_items_updated_at
BEFORE UPDATE ON public.canonical_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_uploads_updated_at ON public.uploads;
CREATE TRIGGER update_uploads_updated_at
BEFORE UPDATE ON public.uploads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_receipts_updated_at ON public.receipts;
CREATE TRIGGER update_receipts_updated_at
BEFORE UPDATE ON public.receipts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
REVOKE ALL ON FUNCTION public.sync_line_items_from_receipt() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_line_items_from_receipt() FROM authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM authenticated;
REVOKE ALL ON FUNCTION public.sync_line_items_from_receipt() FROM anon;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon;
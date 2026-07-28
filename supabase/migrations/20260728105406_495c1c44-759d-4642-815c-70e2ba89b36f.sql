
ALTER FUNCTION public.dataset_stats() SECURITY INVOKER;
ALTER FUNCTION public.suggest_vendor_merges() SECURITY INVOKER;
ALTER FUNCTION public.merge_vendors(uuid, uuid) SECURITY INVOKER;
ALTER FUNCTION public.suggest_item_merges() SECURITY INVOKER;
ALTER FUNCTION public.merge_canonical_items(uuid, uuid) SECURITY INVOKER;

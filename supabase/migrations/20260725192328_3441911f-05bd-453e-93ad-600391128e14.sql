REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_approved_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_master_admin() FROM authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_approved_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_master_admin() TO service_role;

GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;

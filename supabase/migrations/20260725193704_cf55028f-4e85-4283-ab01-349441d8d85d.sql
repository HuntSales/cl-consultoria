REVOKE ALL ON FUNCTION public.is_approved_user() FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_master_admin() FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.is_approved_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_master_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated, service_role;
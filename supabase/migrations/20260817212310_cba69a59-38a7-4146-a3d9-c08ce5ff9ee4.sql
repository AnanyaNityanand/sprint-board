REVOKE EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_project_owner(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.shares_project_with(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_project() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
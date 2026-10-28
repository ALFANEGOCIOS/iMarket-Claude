-- Aplicada en Supabase como "email_registered_check".
-- Devuelve true si existe una cuenta con ese correo (se usa antes de enviar el correo de restablecimiento).
create or replace function public.imarket_email_registered(p_email text)
returns boolean language sql security definer stable set search_path = ''
as $$ select exists (select 1 from auth.users u where lower(u.email) = lower(btrim(p_email)) and u.deleted_at is null); $$;
revoke all on function public.imarket_email_registered(text) from public;
grant execute on function public.imarket_email_registered(text) to anon, authenticated;

-- iMarket: avisos por correo (mensajes nuevos, anuncio aprobado/rechazado, identidad aprobada/rechazada).
-- La base de datos llama a https://TU-SITIO/api/notify (Vercel), que envía el correo con Gmail.
-- Si falta la configuración (más abajo, paso 2) simplemente no se envía nada y la app funciona igual.

create extension if not exists pg_net with schema extensions;

create schema if not exists private;
create table if not exists private.app_settings (key text primary key, value text not null);
revoke all on private.app_settings from public, anon, authenticated;

-- Preferencia del usuario (por defecto, recibe avisos)
create table if not exists private.email_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default true
);
revoke all on private.email_prefs from public, anon, authenticated;

create or replace function public.imarket_get_email_pref()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select email_enabled from private.email_prefs where user_id = auth.uid()), true);
$$;
create or replace function public.imarket_set_email_pref(p_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'IMARKET_UNAUTHENTICATED'; end if;
  insert into private.email_prefs(user_id, email_enabled) values (auth.uid(), coalesce(p_enabled, true))
  on conflict (user_id) do update set email_enabled = excluded.email_enabled;
end $$;
revoke all on function public.imarket_get_email_pref() from public, anon;
revoke all on function public.imarket_set_email_pref(boolean) from public, anon;
grant execute on function public.imarket_get_email_pref() to authenticated;
grant execute on function public.imarket_set_email_pref(boolean) to authenticated;

-- Envío (nunca rompe la operación original: cualquier fallo se ignora)
create or replace function private.queue_email(p_user uuid, p_subject text, p_title text, p_body text, p_path text default '/')
returns void language plpgsql security definer set search_path = '' as $$
declare v_url text; v_secret text; v_email text;
begin
  select value into v_url from private.app_settings where key = 'notify_url';
  select value into v_secret from private.app_settings where key = 'notify_secret';
  if v_url is null or v_secret is null then return; end if;
  if not coalesce((select email_enabled from private.email_prefs where user_id = p_user), true) then return; end if;
  select email into v_email from auth.users where id = p_user;
  if v_email is null then return; end if;
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('to', v_email, 'subject', p_subject, 'title', p_title, 'body', p_body, 'path', p_path),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret)
  );
exception when others then
  null;
end $$;
revoke all on function private.queue_email(uuid, text, text, text, text) from public, anon, authenticated;

-- 1) Mensaje nuevo (máx. 1 correo cada 10 min por conversación y remitente)
create or replace function private.notify_new_message()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_conv public.conversations; v_to uuid; v_from text; v_model text;
begin
  select * into v_conv from public.conversations where id = new.conversation_id;
  if not found then return new; end if;
  v_to := case when new.sender_id = v_conv.buyer_id then v_conv.seller_id else v_conv.buyer_id end;
  if exists (select 1 from public.messages where conversation_id = new.conversation_id and sender_id = new.sender_id
             and id <> new.id and created_at > now() - interval '10 minutes') then
    return new;
  end if;
  select display_name into v_from from public.profiles where id = new.sender_id;
  select model into v_model from public.listings where id = v_conv.listing_id;
  perform private.queue_email(v_to,
    'Nuevo mensaje sobre tu ' || coalesce(v_model, 'iPhone'),
    coalesce(v_from, 'Alguien') || ' te escribió sobre ' || coalesce(v_model, 'un iPhone'),
    left(new.content, 200), '/');
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message after insert on public.messages
  for each row execute function private.notify_new_message();

-- 2) Anuncio aprobado / rechazado
create or replace function private.notify_listing_status()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_reason text;
begin
  if old.status::text <> 'pending_review' or new.status::text = old.status::text then return new; end if;
  if new.status::text = 'active' then
    perform private.queue_email(new.seller_id, 'Tu anuncio fue aprobado',
      'Tu ' || new.model || ' ya está publicado', 'Los compradores ya pueden verlo en iMarket.', '/');
  elsif new.status::text in ('draft', 'rejected') then
    select rejection_reason into v_reason from public.listing_moderation_history
      where listing_id = new.id order by created_at desc limit 1;
    perform private.queue_email(new.seller_id, 'Tu anuncio necesita cambios',
      'No pudimos publicar tu ' || new.model, coalesce('Motivo: ' || v_reason, 'Revisa tu anuncio y vuelve a enviarlo.'), '/');
  end if;
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists trg_notify_listing_status on public.listings;
create trigger trg_notify_listing_status after update of status on public.listings
  for each row execute function private.notify_listing_status();

-- 3) Verificación de identidad aprobada / rechazada
create or replace function private.notify_verification_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status::text = old.status::text then return new; end if;
  if new.status::text = 'approved' then
    perform private.queue_email(new.user_id, 'Identidad verificada',
      'Tu identidad fue verificada', 'Ya puedes publicar tus iPhone en iMarket.', '/');
  elsif new.status::text = 'rejected' then
    perform private.queue_email(new.user_id, 'Verificación rechazada',
      'No pudimos verificar tu identidad', coalesce('Motivo: ' || new.rejection_reason, 'Puedes enviar una nueva solicitud.'), '/');
  end if;
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists trg_notify_verification_status on public.verification_requests;
create trigger trg_notify_verification_status after update of status on public.verification_requests
  for each row execute function private.notify_verification_status();

-- PASO 2 (después de desplegar la web en Vercel y poner las variables de entorno):
-- insert into private.app_settings(key, value) values
--   ('notify_url',    'https://TU-SITIO.vercel.app/api/notify'),
--   ('notify_secret', 'LA_MISMA_CLAVE_QUE_NOTIFY_SECRET_EN_VERCEL')
-- on conflict (key) do update set value = excluded.value;

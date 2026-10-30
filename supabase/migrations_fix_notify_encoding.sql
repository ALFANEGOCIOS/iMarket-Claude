-- iMarket: corrige los textos de los avisos por correo (tildes danadas por la codificacion al pegar el SQL).
-- Este archivo es 100 % ASCII a proposito: asi no se puede danar al copiarlo.
-- Reemplaza las 3 funciones de aviso; los triggers y la configuracion no cambian.
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
    coalesce(v_from, 'Alguien') || U&' te escribi\00f3 sobre ' || coalesce(v_model, 'un iPhone'),
    left(new.content, 200), '/');
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message after insert on public.messages
  for each row execute function private.notify_new_message();

create or replace function private.notify_listing_status()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_reason text;
begin
  if old.status::text <> 'pending_review' or new.status::text = old.status::text then return new; end if;
  if new.status::text = 'active' then
    perform private.queue_email(new.seller_id, 'Tu anuncio fue aprobado',
      'Tu ' || new.model || U&' ya est\00e1 publicado', 'Los compradores ya pueden verlo en iMarket.', '/');
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

create or replace function private.notify_verification_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status::text = old.status::text then return new; end if;
  if new.status::text = 'approved' then
    perform private.queue_email(new.user_id, 'Identidad verificada',
      'Tu identidad fue verificada', 'Ya puedes publicar tus iPhone en iMarket.', '/');
  elsif new.status::text = 'rejected' then
    perform private.queue_email(new.user_id, U&'Verificaci\00f3n rechazada',
      'No pudimos verificar tu identidad', coalesce('Motivo: ' || new.rejection_reason, 'Puedes enviar una nueva solicitud.'), '/');
  end if;
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists trg_notify_verification_status on public.verification_requests;
create trigger trg_notify_verification_status after update of status on public.verification_requests
  for each row execute function private.notify_verification_status();


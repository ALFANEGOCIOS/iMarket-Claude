-- Límite de intentos para imarket_email_registered: 5 consultas por IP cada 10 minutos.
-- Ejecutar en Supabase → SQL Editor (reemplaza la función anterior).
create table if not exists private.email_check_attempts (
  id bigserial primary key,
  ip text not null,
  created_at timestamptz not null default now()
);
create index if not exists email_check_attempts_ip_time on private.email_check_attempts (ip, created_at desc);
revoke all on private.email_check_attempts from public, anon, authenticated;

create or replace function public.imarket_email_registered(p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_headers json;
  v_ip text;
  v_count int;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    v_headers := null;
  end;
  v_ip := coalesce(
    nullif(btrim(v_headers->>'cf-connecting-ip'), ''),
    nullif(btrim(v_headers->>'x-real-ip'), ''),
    nullif(btrim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), ''),
    'unknown'
  );

  delete from private.email_check_attempts where created_at < now() - interval '1 day';

  select count(*) into v_count
  from private.email_check_attempts
  where ip = v_ip and created_at > now() - interval '10 minutes';

  if v_count >= 5 then
    raise exception 'IMARKET_RATE_LIMIT' using errcode = 'P0001';
  end if;

  insert into private.email_check_attempts (ip) values (v_ip);

  return exists (
    select 1 from auth.users u
    where lower(u.email) = lower(btrim(p_email))
      and u.deleted_at is null
  );
end;
$$;
revoke all on function public.imarket_email_registered(text) from public;
grant execute on function public.imarket_email_registered(text) to anon, authenticated;

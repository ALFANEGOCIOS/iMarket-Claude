-- Contador de vistas por anuncio. Ejecutar en Supabase → SQL Editor.
-- Usa la columna existente public.listings.views_count.
-- Una misma persona (usuario o navegador anónimo) suma 1 vista cada 24 h por anuncio;
-- el vendedor no cuenta como visita en su propio anuncio.
create table if not exists private.listing_views (
  id bigserial primary key,
  listing_id uuid not null,
  viewer_key text not null,
  viewed_at timestamptz not null default now()
);
create index if not exists listing_views_lookup on private.listing_views (listing_id, viewer_key, viewed_at desc);
revoke all on private.listing_views from public, anon, authenticated;

create or replace function public.imarket_register_view(p_listing_id uuid, p_viewer text default null)
returns integer
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  v_seller uuid;
  v_status text;
  v_key text;
  v_count integer;
begin
  select seller_id, status::text, views_count into v_seller, v_status, v_count
  from public.listings where id = p_listing_id;
  if not found then
    return null;
  end if;

  if auth.uid() is not null and auth.uid() = v_seller then
    return v_count;
  end if;

  v_key := coalesce(auth.uid()::text, 'a:' || left(coalesce(nullif(btrim(p_viewer), ''), 'anon'), 64));

  if exists (
    select 1 from private.listing_views
    where listing_id = p_listing_id and viewer_key = v_key
      and viewed_at > now() - interval '24 hours'
  ) then
    return v_count;
  end if;

  delete from private.listing_views where viewed_at < now() - interval '30 days';
  insert into private.listing_views (listing_id, viewer_key) values (p_listing_id, v_key);

  perform set_config('app.internal_token', (select internal_token from private.internal_config where id = true), true);
  update public.listings set views_count = views_count + 1
  where id = p_listing_id
  returning views_count into v_count;

  return v_count;
end;
$$;
revoke all on function public.imarket_register_view(uuid, text) from public;
grant execute on function public.imarket_register_view(uuid, text) to anon, authenticated;

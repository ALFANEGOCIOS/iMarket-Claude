-- iMarket: almacenamientos validos por modelo (como los colores). Ejecutar completo, una sola vez.
-- 1) Permite 2 TB (2048 GB), que existe en iPhone 17 Pro Max, 18 Pro, 18 Pro Max y Duo.
alter table public.listings drop constraint if exists listings_storage_gb_check;
alter table public.listings add constraint listings_storage_gb_check
  check (storage_gb = any (array[16, 32, 64, 128, 256, 512, 1024, 2048]));

-- 2) Catalogo de almacenamientos por modelo (lectura publica).
create table if not exists public.iphone_storages (
  model text not null,
  storage_gb integer not null,
  primary key (model, storage_gb)
);
alter table public.iphone_storages enable row level security;
drop policy if exists iphone_storages_read on public.iphone_storages;
create policy iphone_storages_read on public.iphone_storages for select to anon, authenticated using (true);
grant select on public.iphone_storages to anon, authenticated;
insert into public.iphone_storages(model, storage_gb) values
  ('iPhone 18 Pro Max',256),
  ('iPhone 18 Pro Max',512),
  ('iPhone 18 Pro Max',1024),
  ('iPhone 18 Pro Max',2048),
  ('iPhone 18 Pro',256),
  ('iPhone 18 Pro',512),
  ('iPhone 18 Pro',1024),
  ('iPhone 18 Pro',2048),
  ('iPhone Duo',256),
  ('iPhone Duo',512),
  ('iPhone Duo',1024),
  ('iPhone Duo',2048),
  ('iPhone 17 Pro Max',256),
  ('iPhone 17 Pro Max',512),
  ('iPhone 17 Pro Max',1024),
  ('iPhone 17 Pro Max',2048),
  ('iPhone 17 Pro',256),
  ('iPhone 17 Pro',512),
  ('iPhone 17 Pro',1024),
  ('iPhone 17 Air',256),
  ('iPhone 17 Air',512),
  ('iPhone 17 Air',1024),
  ('iPhone 17',256),
  ('iPhone 17',512),
  ('iPhone 17e',256),
  ('iPhone 17e',512),
  ('iPhone 16 Pro Max',256),
  ('iPhone 16 Pro Max',512),
  ('iPhone 16 Pro Max',1024),
  ('iPhone 16 Pro',128),
  ('iPhone 16 Pro',256),
  ('iPhone 16 Pro',512),
  ('iPhone 16 Pro',1024),
  ('iPhone 16 Plus',128),
  ('iPhone 16 Plus',256),
  ('iPhone 16 Plus',512),
  ('iPhone 16',128),
  ('iPhone 16',256),
  ('iPhone 16',512),
  ('iPhone 16e',128),
  ('iPhone 16e',256),
  ('iPhone 16e',512),
  ('iPhone 15 Pro Max',256),
  ('iPhone 15 Pro Max',512),
  ('iPhone 15 Pro Max',1024),
  ('iPhone 15 Pro',128),
  ('iPhone 15 Pro',256),
  ('iPhone 15 Pro',512),
  ('iPhone 15 Pro',1024),
  ('iPhone 15 Plus',128),
  ('iPhone 15 Plus',256),
  ('iPhone 15 Plus',512),
  ('iPhone 15',128),
  ('iPhone 15',256),
  ('iPhone 15',512),
  ('iPhone 14 Pro Max',128),
  ('iPhone 14 Pro Max',256),
  ('iPhone 14 Pro Max',512),
  ('iPhone 14 Pro Max',1024),
  ('iPhone 14 Pro',128),
  ('iPhone 14 Pro',256),
  ('iPhone 14 Pro',512),
  ('iPhone 14 Pro',1024),
  ('iPhone 14 Plus',128),
  ('iPhone 14 Plus',256),
  ('iPhone 14 Plus',512),
  ('iPhone 14',128),
  ('iPhone 14',256),
  ('iPhone 14',512),
  ('iPhone 13 Pro Max',128),
  ('iPhone 13 Pro Max',256),
  ('iPhone 13 Pro Max',512),
  ('iPhone 13 Pro Max',1024),
  ('iPhone 13 Pro',128),
  ('iPhone 13 Pro',256),
  ('iPhone 13 Pro',512),
  ('iPhone 13 Pro',1024),
  ('iPhone 13',128),
  ('iPhone 13',256),
  ('iPhone 13',512),
  ('iPhone 13 mini',128),
  ('iPhone 13 mini',256),
  ('iPhone 13 mini',512),
  ('iPhone 12 Pro Max',128),
  ('iPhone 12 Pro Max',256),
  ('iPhone 12 Pro Max',512),
  ('iPhone 12 Pro',128),
  ('iPhone 12 Pro',256),
  ('iPhone 12 Pro',512),
  ('iPhone 12',64),
  ('iPhone 12',128),
  ('iPhone 12',256),
  ('iPhone 12 mini',64),
  ('iPhone 12 mini',128),
  ('iPhone 12 mini',256),
  ('iPhone SE',16),
  ('iPhone SE',32),
  ('iPhone SE',64),
  ('iPhone SE',128),
  ('iPhone SE',256),
  ('iPhone 11 Pro Max',64),
  ('iPhone 11 Pro Max',256),
  ('iPhone 11 Pro Max',512),
  ('iPhone 11 Pro',64),
  ('iPhone 11 Pro',256),
  ('iPhone 11 Pro',512),
  ('iPhone 11',64),
  ('iPhone 11',128),
  ('iPhone 11',256),
  ('iPhone XS Max',64),
  ('iPhone XS Max',256),
  ('iPhone XS Max',512),
  ('iPhone XS',64),
  ('iPhone XS',256),
  ('iPhone XS',512),
  ('iPhone XR',64),
  ('iPhone XR',128),
  ('iPhone XR',256),
  ('iPhone X',64),
  ('iPhone X',256),
  ('iPhone 8 Plus',64),
  ('iPhone 8 Plus',128),
  ('iPhone 8 Plus',256),
  ('iPhone 8',64),
  ('iPhone 8',128),
  ('iPhone 8',256),
  ('iPhone 7 Plus',32),
  ('iPhone 7 Plus',128),
  ('iPhone 7 Plus',256),
  ('iPhone 7',32),
  ('iPhone 7',128),
  ('iPhone 7',256),
  ('iPhone 6s Plus',16),
  ('iPhone 6s Plus',32),
  ('iPhone 6s Plus',64),
  ('iPhone 6s Plus',128),
  ('iPhone 6s',16),
  ('iPhone 6s',32),
  ('iPhone 6s',64),
  ('iPhone 6s',128),
  ('iPhone 6 Plus',16),
  ('iPhone 6 Plus',64),
  ('iPhone 6 Plus',128),
  ('iPhone 6',16),
  ('iPhone 6',32),
  ('iPhone 6',64),
  ('iPhone 6',128)
on conflict do nothing;

-- 3) Validacion en el servidor al publicar (error IMARKET_INVALID_STORAGE).
-- Incluye ademas: los anuncios de un admin se publican al instante (sin revision).
create or replace function public.imarket_create_listing(p_payload jsonb, p_photo_paths text[])
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare v_uid uuid := public.imarket_require_account(); v_row public.listings; v_path text; v_position integer := 0; v_config jsonb:=public.imarket_contract();
begin
  if not public.imarket_can_sell(v_uid) then raise exception 'IMARKET_VERIFICATION_REQUIRED'; end if;
  if not coalesce((p_payload->>'ownership_confirmed')::boolean,false) then raise exception 'IMARKET_OWNERSHIP_REQUIRED'; end if;
  if p_photo_paths is null or cardinality(p_photo_paths) not between 1 and 5
    or (select count(distinct x) from unnest(p_photo_paths) x) <> cardinality(p_photo_paths) then raise exception 'IMARKET_INVALID_PHOTOS'; end if;
  v_row:=jsonb_populate_record(null::public.listings,p_payload||jsonb_build_object('seller_id',v_uid,'status',case when public.imarket_is_admin() then v_config->>'published' else v_config->>'pending' end));
  if v_row.id is null or v_row.price_usd<=0 or v_row.price_usd>10000
    or char_length(coalesce(v_row.model,'')) not between 5 and 50 or v_row.model !~ '^iPhone (SE|Duo|X|XR|XS|[1-9][0-9]?[a-z]?)( (Pro|Pro Max|Plus|mini|Air|Max))?$'
    or char_length(coalesce(v_row.color,'')) not between 1 and 40
    or char_length(coalesce(v_row.description,'')) not between 20 and 1500
    or char_length(coalesce(v_row.details,''))>500
    or char_length(coalesce(v_row.municipality,'')) not between 1 and 80
    or char_length(coalesce(v_row.neighborhood,''))>80
    or (v_row.has_warranty and coalesce(v_row.warranty_days,0) not between 1 and 365)
    or not (coalesce(v_row.cosmetic_issues,'{}') <@ array['back_glass','front_glass','screen_stain','screen_scratches','frame_dents']::text[])
    then raise exception 'IMARKET_INVALID_LISTING'; end if;
  if not exists (select 1 from public.iphone_colors where model = v_row.model and color = v_row.color) then
    raise exception 'IMARKET_INVALID_COLOR';
  end if;
  if to_regclass('public.iphone_storages') is not null
     and not exists (select 1 from public.iphone_storages where model = v_row.model and storage_gb = v_row.storage_gb) then
    raise exception 'IMARKET_INVALID_STORAGE';
  end if;
  foreach v_path in array p_photo_paths loop
    if v_path is null or v_path not like v_uid::text||'/'||v_row.id::text||'/%'
      or not exists(select 1 from storage.objects where bucket_id=v_config->>'photoBucket' and name=v_path and owner_id=v_uid::text)
      then raise exception 'IMARKET_INVALID_PHOTOS'; end if;
  end loop;
  insert into public.listings(id,seller_id,model,storage_gb,color,price_usd,negotiable,accepts_trade,aesthetic_condition,cosmetic_issues,battery_health,battery_type,
    factory_unlocked,face_id_working,true_tone_working,includes_cable,includes_charger,has_details,details,has_warranty,warranty_days,municipality,neighborhood,title,description,status,published_at)
  values(v_row.id,v_uid,v_row.model,v_row.storage_gb,v_row.color,v_row.price_usd,v_row.negotiable,v_row.accepts_trade,v_row.aesthetic_condition,coalesce(v_row.cosmetic_issues,'{}'),v_row.battery_health,v_row.battery_type,
    v_row.factory_unlocked,v_row.face_id_working,v_row.true_tone_working,v_row.includes_cable,v_row.includes_charger,v_row.has_details,v_row.details,v_row.has_warranty,v_row.warranty_days,
    v_row.municipality,v_row.neighborhood,v_row.model,v_row.description,v_row.status,
    case when v_row.status::text = v_config->>'published' then now() else null end);
  foreach v_path in array p_photo_paths loop
    v_position:=v_position+1;
    insert into public.listing_images(listing_id,storage_path,position) values(v_row.id,v_path,v_position);
  end loop;
  return jsonb_build_object('id',v_row.id,'status',v_row.status);
end $function$;

-- iMarket: los anuncios publicados por un ADMIN salen publicados al instante (sin pasar por revision).
-- Reemplaza imarket_create_listing; incluye tambien la validacion de color y (si existe la tabla) de almacenamiento.
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

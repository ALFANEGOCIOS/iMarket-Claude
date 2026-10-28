-- iMarket: catálogo de colores de fábrica por modelo (fuente de verdad para el formulario y el servidor).
create table if not exists public.iphone_colors (
  model text not null,
  color text not null,
  position integer not null default 0,
  primary key (model, color)
);
alter table public.iphone_colors enable row level security;
drop policy if exists iphone_colors_read on public.iphone_colors;
create policy iphone_colors_read on public.iphone_colors for select to anon, authenticated using (true);
grant select on public.iphone_colors to anon, authenticated;
insert into public.iphone_colors(model,color,position) values
('iPhone 18 Pro Max','Negro',1),
('iPhone 18 Pro Max','Plata',2),
('iPhone 18 Pro Max','Glaciar',3),
('iPhone 18 Pro Max','Borgoña',4),
('iPhone 18 Pro','Negro',1),
('iPhone 18 Pro','Plata',2),
('iPhone 18 Pro','Glaciar',3),
('iPhone 18 Pro','Borgoña',4),
('iPhone Duo','Blanco estrella',1),
('iPhone Duo','Cielo nocturno',2),
('iPhone 17 Pro Max','Plata',1),
('iPhone 17 Pro Max','Naranja cósmico',2),
('iPhone 17 Pro Max','Azul profundo',3),
('iPhone 17 Pro','Plata',1),
('iPhone 17 Pro','Naranja cósmico',2),
('iPhone 17 Pro','Azul profundo',3),
('iPhone 17 Air','Negro espacial',1),
('iPhone 17 Air','Blanco nube',2),
('iPhone 17 Air','Oro claro',3),
('iPhone 17 Air','Azul cielo',4),
('iPhone 17','Negro',1),
('iPhone 17','Blanco',2),
('iPhone 17','Azul niebla',3),
('iPhone 17','Salvia',4),
('iPhone 17','Lavanda',5),
('iPhone 17e','Negro',1),
('iPhone 17e','Blanco',2),
('iPhone 17e','Rosa suave',3),
('iPhone 16 Pro Max','Titanio negro',1),
('iPhone 16 Pro Max','Titanio blanco',2),
('iPhone 16 Pro Max','Titanio natural',3),
('iPhone 16 Pro Max','Titanio desierto',4),
('iPhone 16 Pro','Titanio negro',1),
('iPhone 16 Pro','Titanio blanco',2),
('iPhone 16 Pro','Titanio natural',3),
('iPhone 16 Pro','Titanio desierto',4),
('iPhone 16 Plus','Negro',1),
('iPhone 16 Plus','Blanco',2),
('iPhone 16 Plus','Rosa',3),
('iPhone 16 Plus','Verde azulado',4),
('iPhone 16 Plus','Ultramar',5),
('iPhone 16','Negro',1),
('iPhone 16','Blanco',2),
('iPhone 16','Rosa',3),
('iPhone 16','Verde azulado',4),
('iPhone 16','Ultramar',5),
('iPhone 16e','Negro',1),
('iPhone 16e','Blanco',2),
('iPhone 15 Pro Max','Titanio negro',1),
('iPhone 15 Pro Max','Titanio blanco',2),
('iPhone 15 Pro Max','Titanio azul',3),
('iPhone 15 Pro Max','Titanio natural',4),
('iPhone 15 Pro','Titanio negro',1),
('iPhone 15 Pro','Titanio blanco',2),
('iPhone 15 Pro','Titanio azul',3),
('iPhone 15 Pro','Titanio natural',4),
('iPhone 15 Plus','Negro',1),
('iPhone 15 Plus','Azul',2),
('iPhone 15 Plus','Verde',3),
('iPhone 15 Plus','Amarillo',4),
('iPhone 15 Plus','Rosa',5),
('iPhone 15','Negro',1),
('iPhone 15','Azul',2),
('iPhone 15','Verde',3),
('iPhone 15','Amarillo',4),
('iPhone 15','Rosa',5),
('iPhone 14 Pro Max','Negro espacial',1),
('iPhone 14 Pro Max','Plata',2),
('iPhone 14 Pro Max','Oro',3),
('iPhone 14 Pro Max','Morado oscuro',4),
('iPhone 14 Pro','Negro espacial',1),
('iPhone 14 Pro','Plata',2),
('iPhone 14 Pro','Oro',3),
('iPhone 14 Pro','Morado oscuro',4),
('iPhone 14 Plus','Medianoche',1),
('iPhone 14 Plus','Blanco estelar',2),
('iPhone 14 Plus','Azul',3),
('iPhone 14 Plus','Morado',4),
('iPhone 14 Plus','Amarillo',5),
('iPhone 14 Plus','(PRODUCT)RED',6),
('iPhone 14','Medianoche',1),
('iPhone 14','Blanco estelar',2),
('iPhone 14','Azul',3),
('iPhone 14','Morado',4),
('iPhone 14','Amarillo',5),
('iPhone 14','(PRODUCT)RED',6),
('iPhone 13 Pro Max','Grafito',1),
('iPhone 13 Pro Max','Oro',2),
('iPhone 13 Pro Max','Plata',3),
('iPhone 13 Pro Max','Azul sierra',4),
('iPhone 13 Pro Max','Verde alpino',5),
('iPhone 13 Pro','Grafito',1),
('iPhone 13 Pro','Oro',2),
('iPhone 13 Pro','Plata',3),
('iPhone 13 Pro','Azul sierra',4),
('iPhone 13 Pro','Verde alpino',5),
('iPhone 13','Medianoche',1),
('iPhone 13','Blanco estelar',2),
('iPhone 13','Rosa',3),
('iPhone 13','Azul',4),
('iPhone 13','Verde',5),
('iPhone 13','(PRODUCT)RED',6),
('iPhone 13 mini','Medianoche',1),
('iPhone 13 mini','Blanco estelar',2),
('iPhone 13 mini','Rosa',3),
('iPhone 13 mini','Azul',4),
('iPhone 13 mini','Verde',5),
('iPhone 13 mini','(PRODUCT)RED',6),
('iPhone 12 Pro Max','Grafito',1),
('iPhone 12 Pro Max','Plata',2),
('iPhone 12 Pro Max','Oro',3),
('iPhone 12 Pro Max','Azul pacífico',4),
('iPhone 12 Pro','Grafito',1),
('iPhone 12 Pro','Plata',2),
('iPhone 12 Pro','Oro',3),
('iPhone 12 Pro','Azul pacífico',4),
('iPhone 12','Negro',1),
('iPhone 12','Blanco',2),
('iPhone 12','(PRODUCT)RED',3),
('iPhone 12','Verde',4),
('iPhone 12','Azul',5),
('iPhone 12','Morado',6),
('iPhone 12 mini','Negro',1),
('iPhone 12 mini','Blanco',2),
('iPhone 12 mini','(PRODUCT)RED',3),
('iPhone 12 mini','Verde',4),
('iPhone 12 mini','Azul',5),
('iPhone 12 mini','Morado',6),
('iPhone SE','Gris espacial',1),
('iPhone SE','Plata',2),
('iPhone SE','Oro',3),
('iPhone SE','Oro rosa',4),
('iPhone SE','Negro',5),
('iPhone SE','Blanco',6),
('iPhone SE','Medianoche',7),
('iPhone SE','Blanco estelar',8),
('iPhone SE','(PRODUCT)RED',9),
('iPhone 11 Pro Max','Gris espacial',1),
('iPhone 11 Pro Max','Plata',2),
('iPhone 11 Pro Max','Oro',3),
('iPhone 11 Pro Max','Verde noche',4),
('iPhone 11 Pro','Gris espacial',1),
('iPhone 11 Pro','Plata',2),
('iPhone 11 Pro','Oro',3),
('iPhone 11 Pro','Verde noche',4),
('iPhone 11','Negro',1),
('iPhone 11','Blanco',2),
('iPhone 11','Verde',3),
('iPhone 11','Amarillo',4),
('iPhone 11','Morado',5),
('iPhone 11','(PRODUCT)RED',6),
('iPhone XS Max','Gris espacial',1),
('iPhone XS Max','Plata',2),
('iPhone XS Max','Oro',3),
('iPhone XS','Gris espacial',1),
('iPhone XS','Plata',2),
('iPhone XS','Oro',3),
('iPhone XR','Negro',1),
('iPhone XR','Blanco',2),
('iPhone XR','Azul',3),
('iPhone XR','Amarillo',4),
('iPhone XR','Coral',5),
('iPhone XR','(PRODUCT)RED',6),
('iPhone X','Gris espacial',1),
('iPhone X','Plata',2),
('iPhone 8 Plus','Gris espacial',1),
('iPhone 8 Plus','Plata',2),
('iPhone 8 Plus','Oro',3),
('iPhone 8 Plus','(PRODUCT)RED',4),
('iPhone 8','Gris espacial',1),
('iPhone 8','Plata',2),
('iPhone 8','Oro',3),
('iPhone 8','(PRODUCT)RED',4),
('iPhone 7 Plus','Negro brillante',1),
('iPhone 7 Plus','Negro',2),
('iPhone 7 Plus','Plata',3),
('iPhone 7 Plus','Oro',4),
('iPhone 7 Plus','Oro rosa',5),
('iPhone 7 Plus','(PRODUCT)RED',6),
('iPhone 7','Negro brillante',1),
('iPhone 7','Negro',2),
('iPhone 7','Plata',3),
('iPhone 7','Oro',4),
('iPhone 7','Oro rosa',5),
('iPhone 7','(PRODUCT)RED',6),
('iPhone 6s Plus','Gris espacial',1),
('iPhone 6s Plus','Plata',2),
('iPhone 6s Plus','Oro',3),
('iPhone 6s Plus','Oro rosa',4),
('iPhone 6s','Gris espacial',1),
('iPhone 6s','Plata',2),
('iPhone 6s','Oro',3),
('iPhone 6s','Oro rosa',4),
('iPhone 6 Plus','Gris espacial',1),
('iPhone 6 Plus','Plata',2),
('iPhone 6 Plus','Oro',3),
('iPhone 6','Gris espacial',1),
('iPhone 6','Plata',2),
('iPhone 6','Oro',3)
on conflict (model,color) do update set position = excluded.position;

-- Validación en el servidor: el color debe existir para ese modelo.
-- (Esta función reemplaza a la anterior; conserva todas sus comprobaciones.)
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
  v_row:=jsonb_populate_record(null::public.listings,p_payload||jsonb_build_object('seller_id',v_uid,'status',v_config->>'pending'));
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
  foreach v_path in array p_photo_paths loop
    if v_path is null or v_path not like v_uid::text||'/'||v_row.id::text||'/%'
      or not exists(select 1 from storage.objects where bucket_id=v_config->>'photoBucket' and name=v_path and owner_id=v_uid::text)
      then raise exception 'IMARKET_INVALID_PHOTOS'; end if;
  end loop;
  insert into public.listings(id,seller_id,model,storage_gb,color,price_usd,negotiable,accepts_trade,aesthetic_condition,cosmetic_issues,battery_health,battery_type,
    factory_unlocked,face_id_working,true_tone_working,includes_cable,includes_charger,has_details,details,has_warranty,warranty_days,municipality,neighborhood,title,description,status)
  values(v_row.id,v_uid,v_row.model,v_row.storage_gb,v_row.color,v_row.price_usd,v_row.negotiable,v_row.accepts_trade,v_row.aesthetic_condition,coalesce(v_row.cosmetic_issues,'{}'),v_row.battery_health,v_row.battery_type,
    v_row.factory_unlocked,v_row.face_id_working,v_row.true_tone_working,v_row.includes_cable,v_row.includes_charger,v_row.has_details,v_row.details,v_row.has_warranty,v_row.warranty_days,
    v_row.municipality,v_row.neighborhood,v_row.model,v_row.description,v_row.status);
  foreach v_path in array p_photo_paths loop
    v_position:=v_position+1;
    insert into public.listing_images(listing_id,storage_path,position) values(v_row.id,v_path,v_position);
  end loop;
  return jsonb_build_object('id',v_row.id,'status',v_row.status);
end $function$;

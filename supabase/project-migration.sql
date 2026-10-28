-- GENERATED: node supabase/build-project-migration.mjs
-- Target: jlolyhglduixwjjngcuk. Replaces only the inspected policy snapshot.
-- Preserves existing tables, records, Auth triggers and reputation reviews.
-- Adds platform_feedback; legacy client RPCs are retired.
-- Review in an isolated copy before applying to the remote project.
begin;
-- FRAGMENT ONLY: bundled atomically by build-project-migration.mjs.
-- Do not execute this file separately. Target: jlolyhglduixwjjngcuk.
-- Snapshot: 2026-09-30. Only policies whose complete snapshot matches are replaced.
do $$
declare v_hash text;v_policy record;
begin
 if to_regprocedure('public.imarket_contract()') is null then
  select md5(coalesce(jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname)::text,'[]')) into v_hash
  from pg_policies p where
   (schemaname='public' and tablename in ('profiles','profile_private','verification_requests','listings','listing_images','favorites','sales','platform_reviews','conversations','messages','reports','user_blocks','user_roles','listing_moderation_history'))
   or (schemaname='storage' and tablename in ('objects','buckets'));
  if v_hash <> '2e968a8572dad26bc8d98c2efaced3a3' then
   raise exception 'IMARKET_POLICY_SNAPSHOT_CHANGED: inspect policies again before applying';
  end if;
  for v_policy in select schemaname,tablename,policyname from pg_policies where
   (schemaname='public' and tablename in ('profiles','profile_private','verification_requests','listings','listing_images','favorites','sales','platform_reviews','conversations','messages','reports','user_blocks','user_roles','listing_moderation_history'))
   or (schemaname='storage' and tablename in ('objects','buckets')) loop
   execute format('drop policy %I on %I.%I',v_policy.policyname,v_policy.schemaname,v_policy.tablename);
  end loop;
 end if;
end $$;

-- Keep the existing Auth/metrics/guard triggers and private token mechanism.
-- Retire legacy client RPCs while iMarket uses the new authorization boundaries.
-- No private.internal_config values are read or included in this migration.
do $$
declare v_signature text;v_oid oid;
begin
 foreach v_signature in array array[
  'public._begin_internal_op()',
  'public.attach_verification_documents(uuid,text,text)',
  'public.confirm_sale(uuid)',
  'public.create_or_get_conversation(uuid)',
  'public.create_platform_review(uuid,integer,text)',
  'public.create_verification_request()',
  'public.handle_new_user()',
  'public.has_role(uuid,public.app_role)',
  'public.increment_listing_views(uuid)',
  'public.is_admin()',
  'public.is_havana_municipality(text)',
  'public.is_internal_operation()',
  'public.is_staff()',
  'public.mark_listing_sold(uuid,numeric,uuid,public.sale_source_type)',
  'public.pause_listing(uuid)',
  'public.protect_listing_fields()',
  'public.protect_profile_fields()',
  'public.recalculate_seller_sales(uuid)',
  'public.recalculate_user_rating(uuid)',
  'public.report_listing(uuid,text,text)',
  'public.reserve_listing(uuid,uuid)',
  'public.review_listing(uuid,text,text)',
  'public.review_verification(uuid,text,text)',
  'public.soft_delete_listing(uuid)',
  'public.submit_listing_for_review(uuid)',
  'public.sync_listing_favorites_count()',
  'public.touch_conversation()',
  'public.update_seller_sales()',
  'public.update_updated_at()',
  'public.update_user_rating()',
  'public.validate_listing_image_path()'
 ] loop
  v_oid:=to_regprocedure(v_signature);
  if v_oid is not null then
   execute format('revoke all on function %s from public,anon,authenticated',v_oid::regprocedure);
   execute format('alter function %s set search_path to public,private,pg_temp',v_oid::regprocedure);
  end if;
 end loop;
end $$;

-- Retain the image-path trigger, allowing both legacy position filenames and
-- the UUID filenames uploaded by this application. RPC checks Storage ownership.
create or replace function public.validate_listing_image_path()
returns trigger language plpgsql set search_path='' as $$
declare v_seller_id uuid;v_parts text[];
begin
 select seller_id into v_seller_id from public.listings where id=NEW.listing_id;
 v_parts:=string_to_array(NEW.storage_path,'/');
 if v_seller_id is null or cardinality(v_parts)<>3
  or v_parts[1]<>v_seller_id::text or v_parts[2]<>NEW.listing_id::text
  or (v_parts[3]<>NEW.position::text||'.webp'
   and v_parts[3] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$') then
  raise exception 'IMARKET_INVALID_PHOTOS';
 end if;
 return NEW;
end $$;
revoke all on function public.validate_listing_image_path() from public,anon,authenticated;



do $$
begin
  if exists (
    select 1 from pg_catalog.pg_policies existing where (
      (schemaname='public' and tablename in ('profiles','profile_private','verification_requests','listings','listing_images','favorites','sales','platform_reviews','platform_feedback','conversations','messages','reports','user_blocks','user_roles','listing_moderation_history'))
      or (schemaname='storage' and tablename in ('objects','buckets'))
    ) and not exists(select 1 from (values
      ('public','profiles','imarket_profiles_read'),
      ('public','profiles','imarket_profiles_insert'),
      ('public','profiles','imarket_profiles_update'),
      ('public','profile_private','imarket_private_read'),
      ('public','verification_requests','imarket_verifications_read'),
      ('public','user_roles','imarket_roles_read'),
      ('public','listings','imarket_listings_read'),
      ('public','listing_images','imarket_images_read'),
      ('public','favorites','imarket_favorites_read'),
      ('public','favorites','imarket_favorites_insert'),
      ('public','favorites','imarket_favorites_delete'),
      ('public','sales','imarket_sales_read'),
      ('public','platform_reviews','imarket_reviews_read'),
      ('public','platform_feedback','imarket_feedback_read'),
      ('public','conversations','imarket_conversations_read'),
      ('public','messages','imarket_messages_read'),
      ('public','reports','imarket_reports_read'),
      ('public','reports','imarket_reports_insert'),
      ('public','user_blocks','imarket_blocks_read'),
      ('public','user_blocks','imarket_blocks_insert'),
      ('public','user_blocks','imarket_blocks_delete'),
      ('public','listing_moderation_history','imarket_moderation_read'),
      ('storage','objects','imarket_storage_insert'),
      ('storage','objects','imarket_storage_read'),
      ('storage','objects','imarket_storage_delete')
    ) known(schema_name,table_name,policy_name) where known.schema_name=existing.schemaname and known.table_name=existing.tablename and known.policy_name=existing.policyname)
  ) then raise exception 'IMARKET_EXISTING_POLICIES: review and reconcile existing policies before applying this integration'; end if;
end $$;

create or replace function public.imarket_enum(p_table text,p_column text,p_candidates text[])
returns text language plpgsql stable security definer set search_path='' as $$
declare v_label text;
begin
  select candidates.label into v_label from unnest(p_candidates) with ordinality candidates(label,position)
  join pg_catalog.pg_enum e on e.enumlabel=candidates.label
  join pg_catalog.pg_attribute a on a.atttypid=e.enumtypid
  join pg_catalog.pg_class c on c.oid=a.attrelid
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname=p_table and a.attname=p_column
  order by candidates.position limit 1;
  if v_label is null then raise exception 'IMARKET_ENUM: unsupported %.%; inspect diagnostic.sql and adjust candidates',p_table,p_column; end if;
  return v_label;
end $$;

create or replace function public.imarket_contract()
returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object(
  'published',public.imarket_enum('listings','status',array['published','active']),
  'pending',public.imarket_enum('listings','status',array['pending_review','pending','under_review']),
  'sold',public.imarket_enum('listings','status',array['sold']),
  'draft',public.imarket_enum('listings','status',array['draft']),
  'verified',public.imarket_enum('profiles','verification_status',array['approved','verified']),
  'rejected',public.imarket_enum('profiles','verification_status',array['rejected']),
  'originalBattery',public.imarket_enum('listings','battery_type',array['original']),
  'genericBattery',public.imarket_enum('listings','battery_type',array['generic','replacement','replaced']),
  'conditions',jsonb_build_array(
    public.imarket_enum('listings','aesthetic_condition',array['like_new','new','como_nuevo']),
    public.imarket_enum('listings','aesthetic_condition',array['excellent','excelente']),
    public.imarket_enum('listings','aesthetic_condition',array['good','good_condition','buen_estado'])
  ),
  'adminRole',public.imarket_enum('user_roles','role',array['admin','administrator']),
  'photoBucket','listing-images','identityBucket','verification-private'
);
$$;

-- Validate every required enum before changing grants/policies.
do $$ begin perform public.imarket_contract(); end $$;

create or replace function public.imarket_account_ok(p_user_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.profiles where id=p_user_id and not is_banned and not is_suspended);
$$;
create or replace function public.imarket_is_admin()
returns boolean language sql stable security definer set search_path='' as $$
select public.imarket_account_ok((select auth.uid())) and exists(
  select 1 from public.user_roles where user_id=(select auth.uid()) and role::text=public.imarket_contract()->>'adminRole'
);
$$;
create or replace function public.imarket_can_sell(p_user_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.profiles where id=p_user_id and not is_banned and not is_suspended
 and account_type='individual' and verification_status::text=public.imarket_contract()->>'verified');
$$;
create or replace function public.imarket_listing_participant(p_listing_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.conversations where listing_id=p_listing_id and (select auth.uid()) in (buyer_id,seller_id));
$$;
create or replace function public.imarket_require_account()
returns uuid language plpgsql stable security definer set search_path='' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'IMARKET_UNAUTHENTICATED'; end if;
  if not public.imarket_account_ok(v_uid) then raise exception 'IMARKET_ACCOUNT_RESTRICTED'; end if;
  return v_uid;
end $$;

-- Platform feedback is separate from the existing user-to-user reputation table.
create table if not exists public.platform_feedback (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id),
 sale_id uuid not null references public.sales(id),
 rating integer not null check (rating between 1 and 5),
 comment text not null check (char_length(btrim(comment)) between 10 and 1000),
 created_at timestamptz not null default now(),
 unique(sale_id,user_id)
);

-- Unique positions make the existing 1..5 check also enforce a five-photo limit.
create unique index if not exists listing_images_listing_id_position_key on public.listing_images(listing_id,position);
create unique index if not exists unique_conversation on public.conversations(listing_id,buyer_id,seller_id);
create index if not exists imarket_listing_status_date_idx on public.listings(status,published_at desc);
create index if not exists imarket_listing_model_price_idx on public.listings(model,price_usd);
create index if not exists imarket_listing_seller_idx on public.listings(seller_id);
create index if not exists imarket_messages_conversation_idx on public.messages(conversation_id,created_at);
create index if not exists imarket_conversations_buyer_idx on public.conversations(buyer_id);
create index if not exists imarket_conversations_seller_idx on public.conversations(seller_id);

create or replace function public.imarket_create_listing(p_payload jsonb,p_photo_paths text[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid := public.imarket_require_account(); v_row public.listings; v_path text; v_position integer := 0; v_config jsonb:=public.imarket_contract();
begin
  if not public.imarket_can_sell(v_uid) then raise exception 'IMARKET_VERIFICATION_REQUIRED'; end if;
  if not coalesce((p_payload->>'ownership_confirmed')::boolean,false) then raise exception 'IMARKET_OWNERSHIP_REQUIRED'; end if;
  if p_photo_paths is null or cardinality(p_photo_paths) not between 1 and 5
    or (select count(distinct x) from unnest(p_photo_paths) x) <> cardinality(p_photo_paths) then raise exception 'IMARKET_INVALID_PHOTOS'; end if;
  v_row:=jsonb_populate_record(null::public.listings,p_payload||jsonb_build_object('seller_id',v_uid,'status',v_config->>'pending'));
  if v_row.id is null or v_row.price_usd<=0 or v_row.price_usd>10000
    or char_length(coalesce(v_row.model,'')) not between 5 and 50 or v_row.model !~ '^iPhone (SE|[1-9][0-9]?[a-z]?)( (Pro|Pro Max|Plus|mini|Air))?$'
    or char_length(coalesce(v_row.color,'')) not between 1 and 40
    or char_length(coalesce(v_row.description,'')) not between 20 and 1500
    or char_length(coalesce(v_row.details,''))>500
    or char_length(coalesce(v_row.municipality,'')) not between 1 and 80
    or char_length(coalesce(v_row.neighborhood,''))>80
    or (v_row.has_warranty and coalesce(v_row.warranty_days,0) not between 1 and 365)
    then raise exception 'IMARKET_INVALID_LISTING'; end if;
  foreach v_path in array p_photo_paths loop
    if v_path is null or v_path not like v_uid::text||'/'||v_row.id::text||'/%'
      or not exists(select 1 from storage.objects where bucket_id=v_config->>'photoBucket' and name=v_path and owner_id=v_uid::text)
      then raise exception 'IMARKET_INVALID_PHOTOS'; end if;
  end loop;
  insert into public.listings(id,seller_id,model,storage_gb,color,price_usd,negotiable,accepts_trade,aesthetic_condition,battery_health,battery_type,
    factory_unlocked,face_id_working,true_tone_working,includes_cable,includes_charger,has_details,details,has_warranty,warranty_days,municipality,neighborhood,title,description,status)
  values(v_row.id,v_uid,v_row.model,v_row.storage_gb,v_row.color,v_row.price_usd,v_row.negotiable,v_row.accepts_trade,v_row.aesthetic_condition,v_row.battery_health,v_row.battery_type,
    v_row.factory_unlocked,v_row.face_id_working,v_row.true_tone_working,v_row.includes_cable,v_row.includes_charger,v_row.has_details,v_row.details,v_row.has_warranty,v_row.warranty_days,
    v_row.municipality,v_row.neighborhood,v_row.model,v_row.description,v_row.status);
  foreach v_path in array p_photo_paths loop
    v_position:=v_position+1;
    insert into public.listing_images(listing_id,storage_path,position) values(v_row.id,v_path,v_position);
  end loop;
  return jsonb_build_object('id',v_row.id,'status',v_row.status);
end $$;

create or replace function public.imarket_report_sale(p_listing_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=public.imarket_require_account();v_listing public.listings;v_sale uuid;v_config jsonb:=public.imarket_contract();
begin
  select * into v_listing from public.listings where id=p_listing_id for update;
  if not found or v_listing.seller_id<>v_uid then raise exception 'IMARKET_FORBIDDEN'; end if;
  if v_listing.status::text<>v_config->>'published' then raise exception 'IMARKET_ALREADY_SOLD'; end if;
  -- Existing protected-field triggers require a server-owned internal operation.
  if to_regprocedure('public._begin_internal_op()') is not null then execute 'select public._begin_internal_op()'; end if;
  update public.listings set status=(jsonb_populate_record(null::public.listings,jsonb_build_object('status',v_config->>'sold'))).status,sold_at=now(),updated_at=now() where id=p_listing_id;
  insert into public.sales(listing_id,seller_id,status,seller_confirmed,buyer_confirmed,sold_price_usd)
    values(p_listing_id,v_uid,'reported',true,false,v_listing.price_usd) returning id into v_sale;
  perform set_config('app.internal_token','',true);
  -- Do not increment profile reputation for an unconfirmed, external sale.
  return jsonb_build_object('sale_id',v_sale,'listing_id',p_listing_id);
end $$;

create or replace function public.imarket_platform_review(p_sale_id uuid,p_rating integer,p_comment text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=public.imarket_require_account();v_id uuid;
begin
  if p_rating is null or p_rating not between 1 and 5 or char_length(trim(coalesce(p_comment,''))) not between 10 and 1000 then raise exception 'IMARKET_INVALID_REVIEW'; end if;
  if not exists(select 1 from public.sales where id=p_sale_id and seller_id=v_uid and seller_confirmed and status in ('reported','confirmed')) then raise exception 'IMARKET_FORBIDDEN'; end if;
  if exists(select 1 from public.platform_feedback where sale_id=p_sale_id and user_id=v_uid) then raise exception 'IMARKET_REVIEW_EXISTS'; end if;
  -- Preserve user-to-user reviews and reputation; platform feedback has no rating trigger.
  insert into public.platform_feedback(user_id,sale_id,rating,comment) values(v_uid,p_sale_id,p_rating,trim(p_comment)) returning id into v_id;
  return v_id;
end $$;

create or replace function public.imarket_save_private_profile(p_phone text,p_address text)
returns void language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=public.imarket_require_account();
begin
  if char_length(coalesce(p_phone,''))>30 or char_length(coalesce(p_address,''))>300 then raise exception 'IMARKET_INVALID_PROFILE'; end if;
  insert into public.profile_private(user_id,phone,exact_address) values(v_uid,nullif(trim(p_phone),''),nullif(trim(p_address),''))
  on conflict(user_id) do update set phone=excluded.phone,exact_address=excluded.exact_address,updated_at=now();
end $$;

create or replace function public.imarket_save_profile(p_name text,p_municipality text,p_phone text,p_address text)
returns void language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=public.imarket_require_account();
begin
 if char_length(trim(coalesce(p_name,''))) not between 2 and 60 or char_length(coalesce(p_municipality,''))>80 then raise exception 'IMARKET_INVALID_PROFILE'; end if;
 update public.profiles set display_name=trim(p_name),municipality=nullif(trim(p_municipality),''),updated_at=now() where id=v_uid;
 perform public.imarket_save_private_profile(p_phone,p_address);
end $$;

create or replace function public.imarket_request_verification(p_selfie_path text,p_document_path text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=public.imarket_require_account();v_id uuid;v_profile public.profiles;v_bucket text:=public.imarket_contract()->>'identityBucket';
begin
  select * into v_profile from public.profiles where id=v_uid for update;
  if v_profile.verification_status::text=public.imarket_contract()->>'verified' then raise exception 'IMARKET_FORBIDDEN'; end if;
  if exists(select 1 from public.verification_requests where user_id=v_uid and status::text='pending') then raise exception 'IMARKET_VERIFICATION_PENDING'; end if;
  if p_selfie_path is null or p_document_path is null or p_selfie_path=p_document_path
    or p_selfie_path not like v_uid::text||'/%' or p_document_path not like v_uid::text||'/%'
    or (select count(*) from storage.objects where bucket_id=v_bucket and owner_id=v_uid::text and name in (p_selfie_path,p_document_path))<>2 then raise exception 'IMARKET_INVALID_PHOTOS'; end if;
  insert into public.verification_requests(user_id,selfie_path,document_path) values(v_uid,p_selfie_path,p_document_path) returning id into v_id;
  if to_regprocedure('public._begin_internal_op()') is not null then execute 'select public._begin_internal_op()'; end if;
  update public.profiles set verification_status=(jsonb_populate_record(null::public.profiles,'{"verification_status":"pending"}')).verification_status,updated_at=now() where id=v_uid;
  perform set_config('app.internal_token','',true);
  return v_id;
end $$;

create or replace function public.imarket_review_verification(p_request_id uuid,p_approve boolean,p_reason text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_request public.verification_requests;v_status text;
begin
  if not public.imarket_is_admin() then raise exception 'IMARKET_FORBIDDEN'; end if;
  if p_approve is null or (not p_approve and char_length(trim(coalesce(p_reason,''))) not between 5 and 500) then raise exception 'IMARKET_INVALID_REASON'; end if;
  select * into v_request from public.verification_requests where id=p_request_id for update;
  if not found or v_request.status::text<>'pending' then raise exception 'IMARKET_FORBIDDEN'; end if;
  if p_approve and (v_request.selfie_path is null or v_request.document_path is null or v_request.selfie_path=v_request.document_path
    or (select count(*) from storage.objects where bucket_id=public.imarket_contract()->>'identityBucket' and owner_id=v_request.user_id::text and name in (v_request.selfie_path,v_request.document_path))<>2) then raise exception 'IMARKET_INVALID_PHOTOS'; end if;
  v_status:=public.imarket_contract()->>(case when p_approve then 'verified' else 'rejected' end);
  update public.verification_requests set status=(jsonb_populate_record(null::public.verification_requests,jsonb_build_object('status',v_status))).status,
    rejection_reason=case when p_approve then null else trim(p_reason) end,reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_request_id;
  update public.profiles set verification_status=(jsonb_populate_record(null::public.profiles,jsonb_build_object('verification_status',v_status))).verification_status,updated_at=now() where id=v_request.user_id;
end $$;

create or replace function public.imarket_review_listing(p_listing_id uuid,p_approve boolean,p_reason text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_listing public.listings;v_config jsonb:=public.imarket_contract();v_status text;
begin
  if not public.imarket_is_admin() then raise exception 'IMARKET_FORBIDDEN'; end if;
  if p_approve is null or (not p_approve and char_length(trim(coalesce(p_reason,''))) not between 5 and 500) then raise exception 'IMARKET_INVALID_REASON'; end if;
  select * into v_listing from public.listings where id=p_listing_id for update;
  if not found or v_listing.status::text<>v_config->>'pending' then raise exception 'IMARKET_FORBIDDEN'; end if;
  if p_approve and (not public.imarket_can_sell(v_listing.seller_id) or (select count(*) from public.listing_images where listing_id=p_listing_id) not between 1 and 5) then raise exception 'IMARKET_VERIFICATION_REQUIRED'; end if;
  v_status:=case when p_approve then v_config->>'published' else v_config->>'draft' end;
  -- jsonb_populate_record handles the actual type of previous_status too.
  insert into public.listing_moderation_history(listing_id,reviewer_id,decision,rejection_reason,previous_status)
    select p_listing_id,auth.uid(),case when p_approve then 'approved' else 'rejected' end,case when p_approve then null else trim(p_reason) end,r.previous_status
    from jsonb_populate_record(null::public.listing_moderation_history,jsonb_build_object('previous_status',v_listing.status::text)) r;
  update public.listings set status=(jsonb_populate_record(null::public.listings,jsonb_build_object('status',v_status))).status,
    published_at=case when p_approve then now() else null end,updated_at=now() where id=p_listing_id;
end $$;

create or replace function public.imarket_check_conversation(p_buyer uuid,p_seller uuid)
returns void language plpgsql stable security definer set search_path='' as $$
begin
  if not public.imarket_account_ok(p_buyer) or not public.imarket_account_ok(p_seller) then raise exception 'IMARKET_ACCOUNT_RESTRICTED'; end if;
  if exists(select 1 from public.user_blocks where (blocker_id=p_buyer and blocked_id=p_seller) or (blocker_id=p_seller and blocked_id=p_buyer)) then raise exception 'IMARKET_BLOCKED'; end if;
end $$;

create or replace function public.imarket_send_message(p_listing_id uuid,p_content text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=public.imarket_require_account();v_seller uuid;v_conversation uuid;
begin
  if char_length(trim(coalesce(p_content,''))) not between 1 and 2000 then raise exception 'IMARKET_INVALID_MESSAGE'; end if;
  select seller_id into v_seller from public.listings where id=p_listing_id and status::text=public.imarket_contract()->>'published' and public.imarket_can_sell(seller_id);
  if not found then raise exception 'IMARKET_FORBIDDEN'; end if;
  if v_seller=v_uid then raise exception 'IMARKET_OWN_LISTING'; end if;
  perform public.imarket_check_conversation(v_uid,v_seller);
  insert into public.conversations(listing_id,buyer_id,seller_id,last_message_at) values(p_listing_id,v_uid,v_seller,now())
    on conflict(listing_id,buyer_id,seller_id) do update set last_message_at=now() returning id into v_conversation;
  insert into public.messages(conversation_id,sender_id,content) values(v_conversation,v_uid,trim(p_content));
  return v_conversation;
end $$;
create or replace function public.imarket_reply(p_conversation_id uuid,p_content text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=public.imarket_require_account();v_conversation public.conversations;v_message uuid;
begin
  if char_length(trim(coalesce(p_content,''))) not between 1 and 2000 then raise exception 'IMARKET_INVALID_MESSAGE'; end if;
  select * into v_conversation from public.conversations where id=p_conversation_id for update;
  if not found or v_uid not in (v_conversation.buyer_id,v_conversation.seller_id) then raise exception 'IMARKET_FORBIDDEN'; end if;
  perform public.imarket_check_conversation(v_conversation.buyer_id,v_conversation.seller_id);
  insert into public.messages(conversation_id,sender_id,content) values(p_conversation_id,v_uid,trim(p_content)) returning id into v_message;
  update public.conversations set last_message_at=now() where id=p_conversation_id;
  return v_message;
end $$;
create or replace function public.imarket_read_conversation(p_conversation_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=public.imarket_require_account();
begin
  if not exists(select 1 from public.conversations where id=p_conversation_id and v_uid in (buyer_id,seller_id)) then raise exception 'IMARKET_FORBIDDEN'; end if;
  update public.messages set read_at=now() where conversation_id=p_conversation_id and sender_id<>v_uid and read_at is null;
end $$;

-- Account status, verification, roles, reputation and lifecycle fields cannot
-- be assigned directly from an untrusted client.
do $$
declare v_table text;v_columns text;
begin
  foreach v_table in array array['profiles','profile_private','verification_requests','listings','listing_images','favorites','sales','platform_reviews','platform_feedback','conversations','messages','reports','user_blocks','user_roles','listing_moderation_history'] loop
    execute format('alter table public.%I enable row level security',v_table);
    execute format('revoke all on table public.%I from public,anon,authenticated',v_table);
    select string_agg(quote_ident(a.attname),',') into v_columns from pg_catalog.pg_attribute a where a.attrelid=('public.'||quote_ident(v_table))::regclass and a.attnum>0 and not a.attisdropped;
    execute format('revoke all(%s) on table public.%I from public,anon,authenticated',v_columns,v_table);
  end loop;
end $$;
grant select on public.profiles,public.listings,public.listing_images to anon,authenticated;
grant insert(id,display_name) on public.profiles to authenticated;
grant update(display_name,municipality) on public.profiles to authenticated;
grant select on public.profile_private,public.verification_requests,public.favorites,public.sales,public.platform_reviews,public.platform_feedback,public.conversations,public.messages,public.reports,public.user_blocks,public.user_roles,public.listing_moderation_history to authenticated;
grant insert(user_id,listing_id) on public.favorites to authenticated;
grant delete on public.favorites to authenticated;
grant insert(reporter_id,listing_id,reported_user_id,reason,description) on public.reports to authenticated;
grant insert(blocker_id,blocked_id) on public.user_blocks to authenticated;
grant delete on public.user_blocks to authenticated;

drop policy if exists imarket_profiles_read on public.profiles;
create policy imarket_profiles_read on public.profiles for select to anon,authenticated using(true);
drop policy if exists imarket_profiles_insert on public.profiles;
create policy imarket_profiles_insert on public.profiles for insert to authenticated with check(id=(select auth.uid()) and verification_status::text='pending' and account_type='individual' and not is_suspended and not is_banned and total_sales=0 and total_reviews=0 and rating=0 and char_length(display_name) between 2 and 60);
drop policy if exists imarket_profiles_update on public.profiles;
create policy imarket_profiles_update on public.profiles for update to authenticated using(id=(select auth.uid()) and public.imarket_account_ok(id)) with check(id=(select auth.uid()) and char_length(display_name) between 2 and 60 and char_length(coalesce(municipality,''))<=80);
drop policy if exists imarket_private_read on public.profile_private;
create policy imarket_private_read on public.profile_private for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists imarket_verifications_read on public.verification_requests;
create policy imarket_verifications_read on public.verification_requests for select to authenticated using(user_id=(select auth.uid()) or public.imarket_is_admin());
drop policy if exists imarket_roles_read on public.user_roles;
create policy imarket_roles_read on public.user_roles for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists imarket_listings_read on public.listings;
create policy imarket_listings_read on public.listings for select to anon,authenticated using(
  (status::text=public.imarket_contract()->>'published' and public.imarket_can_sell(seller_id))
  or seller_id=(select auth.uid()) or public.imarket_is_admin()
  or public.imarket_listing_participant(id)
);
drop policy if exists imarket_images_read on public.listing_images;
create policy imarket_images_read on public.listing_images for select to anon,authenticated using(exists(select 1 from public.listings where id=listing_id));
drop policy if exists imarket_favorites_read on public.favorites;
create policy imarket_favorites_read on public.favorites for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists imarket_favorites_insert on public.favorites;
create policy imarket_favorites_insert on public.favorites for insert to authenticated with check(user_id=(select auth.uid()) and public.imarket_account_ok(user_id) and exists(select 1 from public.listings where id=listing_id and status::text=public.imarket_contract()->>'published'));
drop policy if exists imarket_favorites_delete on public.favorites;
create policy imarket_favorites_delete on public.favorites for delete to authenticated using(user_id=(select auth.uid()));
drop policy if exists imarket_sales_read on public.sales;
create policy imarket_sales_read on public.sales for select to authenticated using((select auth.uid()) in (seller_id,buyer_id) or public.imarket_is_admin());
drop policy if exists imarket_reviews_read on public.platform_reviews;
create policy imarket_reviews_read on public.platform_reviews for select to authenticated using((select auth.uid()) in (user_id,reviewer_id) or public.imarket_is_admin());
drop policy if exists imarket_feedback_read on public.platform_feedback;
create policy imarket_feedback_read on public.platform_feedback for select to authenticated using(user_id=(select auth.uid()) or public.imarket_is_admin());
drop policy if exists imarket_conversations_read on public.conversations;
create policy imarket_conversations_read on public.conversations for select to authenticated using((select auth.uid()) in (seller_id,buyer_id));
drop policy if exists imarket_messages_read on public.messages;
create policy imarket_messages_read on public.messages for select to authenticated using(exists(select 1 from public.conversations where id=conversation_id and (select auth.uid()) in (seller_id,buyer_id)));
drop policy if exists imarket_reports_read on public.reports;
create policy imarket_reports_read on public.reports for select to authenticated using(reporter_id=(select auth.uid()) or public.imarket_is_admin());
drop policy if exists imarket_reports_insert on public.reports;
create policy imarket_reports_insert on public.reports for insert to authenticated with check(reporter_id=(select auth.uid()) and public.imarket_account_ok(reporter_id) and status::text='pending' and reviewed_by is null and admin_notes is null and (listing_id is not null or reported_user_id is not null) and char_length(reason) between 1 and 100 and char_length(coalesce(description,''))<=1500);
drop policy if exists imarket_blocks_read on public.user_blocks;
create policy imarket_blocks_read on public.user_blocks for select to authenticated using(blocker_id=(select auth.uid()));
drop policy if exists imarket_blocks_insert on public.user_blocks;
create policy imarket_blocks_insert on public.user_blocks for insert to authenticated with check(blocker_id=(select auth.uid()) and blocked_id<>blocker_id and public.imarket_account_ok(blocker_id));
drop policy if exists imarket_blocks_delete on public.user_blocks;
create policy imarket_blocks_delete on public.user_blocks for delete to authenticated using(blocker_id=(select auth.uid()));
drop policy if exists imarket_moderation_read on public.listing_moderation_history;
create policy imarket_moderation_read on public.listing_moderation_history for select to authenticated using(public.imarket_is_admin() or exists(select 1 from public.listings where id=listing_id and seller_id=(select auth.uid())));

-- Storage identifiers are declared in imarket_contract. Existing buckets must
-- already have compatible visibility; never make an identity bucket public.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('listing-images','listing-images',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('verification-private','verification-private',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
do $$
begin
 if (select public from storage.buckets where id='verification-private') or not (select public from storage.buckets where id='listing-images') then raise exception 'IMARKET_BUCKET_VISIBILITY: incompatible existing bucket configuration'; end if;
end $$;
-- Enforce the same file bounds on buckets that already existed.
update storage.buckets set file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='listing-images';
update storage.buckets set file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='verification-private';
drop policy if exists imarket_storage_insert on storage.objects;
create policy imarket_storage_insert on storage.objects for insert to authenticated with check(
  (storage.foldername(name))[1]=(select auth.uid())::text and public.imarket_account_ok((select auth.uid()))
  and ((bucket_id='listing-images' and public.imarket_can_sell((select auth.uid())))
    or (bucket_id='verification-private' and not public.imarket_can_sell((select auth.uid()))))
);
drop policy if exists imarket_storage_read on storage.objects;
create policy imarket_storage_read on storage.objects for select to authenticated using(
  bucket_id in ('listing-images','verification-private') and (owner_id=(select auth.uid())::text or public.imarket_is_admin())
);
drop policy if exists imarket_storage_delete on storage.objects;
create policy imarket_storage_delete on storage.objects for delete to authenticated using(
  owner_id=(select auth.uid())::text and (
    (bucket_id='listing-images' and not exists(select 1 from public.listing_images where storage_path=name))
    or (bucket_id='verification-private' and not exists(select 1 from public.verification_requests where selfie_path=name or document_path=name))
  )
);

-- PostgreSQL grants EXECUTE to PUBLIC by default; explicitly revoke it from
-- every helper and expose only intended RPCs and the read-only policy helpers.
do $$
declare v_function record;
begin
 for v_function in select p.proname,pg_get_function_identity_arguments(p.oid) arguments from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.oid=any(array['public.imarket_enum(text,text,text[])'::regprocedure::oid,'public.imarket_contract()'::regprocedure::oid,'public.imarket_account_ok(uuid)'::regprocedure::oid,'public.imarket_is_admin()'::regprocedure::oid,'public.imarket_can_sell(uuid)'::regprocedure::oid,'public.imarket_listing_participant(uuid)'::regprocedure::oid,'public.imarket_require_account()'::regprocedure::oid,'public.imarket_create_listing(jsonb,text[])'::regprocedure::oid,'public.imarket_report_sale(uuid)'::regprocedure::oid,'public.imarket_platform_review(uuid,integer,text)'::regprocedure::oid,'public.imarket_save_private_profile(text,text)'::regprocedure::oid,'public.imarket_save_profile(text,text,text,text)'::regprocedure::oid,'public.imarket_request_verification(text,text)'::regprocedure::oid,'public.imarket_review_verification(uuid,boolean,text)'::regprocedure::oid,'public.imarket_review_listing(uuid,boolean,text)'::regprocedure::oid,'public.imarket_check_conversation(uuid,uuid)'::regprocedure::oid,'public.imarket_send_message(uuid,text)'::regprocedure::oid,'public.imarket_reply(uuid,text)'::regprocedure::oid,'public.imarket_read_conversation(uuid)'::regprocedure::oid]) loop
   execute format('revoke all on function public.%I(%s) from public,anon,authenticated',v_function.proname,v_function.arguments);
 end loop;
end $$;
grant execute on function public.imarket_contract(),public.imarket_is_admin(),public.imarket_can_sell(uuid),public.imarket_listing_participant(uuid) to anon,authenticated;
grant execute on function public.imarket_account_ok(uuid) to authenticated;
grant execute on function public.imarket_create_listing(jsonb,text[]),public.imarket_report_sale(uuid),public.imarket_platform_review(uuid,integer,text),public.imarket_save_private_profile(text,text),public.imarket_save_profile(text,text,text,text),public.imarket_request_verification(text,text),public.imarket_send_message(uuid,text),public.imarket_reply(uuid,text),public.imarket_read_conversation(uuid),public.imarket_review_verification(uuid,boolean,text),public.imarket_review_listing(uuid,boolean,text) to authenticated;

notify pgrst, 'reload schema';
commit;

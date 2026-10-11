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

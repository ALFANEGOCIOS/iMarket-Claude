-- Local-only reproduction of relevant observed trigger behavior.
-- Actual private configuration/customer data is never copied.
create schema private;
create table private.internal_config(id boolean primary key,internal_token text not null);
insert into private.internal_config values(true,gen_random_uuid()::text);
create function public._begin_internal_op() returns void language plpgsql security definer set search_path=public,private as $$
begin perform set_config('app.internal_token',(select internal_token from private.internal_config where id),true);end $$;
create function public.is_internal_operation() returns boolean language sql stable security definer set search_path=public,private as $$
select exists(select 1 from private.internal_config where internal_token=current_setting('app.internal_token',true));$$;
create function public.has_role(_user_id uuid,_role public.app_role) returns boolean language sql stable security definer set search_path=public as $$
select exists(select 1 from public.user_roles where user_id=_user_id and role=_role);$$;
create function public.protect_profile_fields() returns trigger language plpgsql security definer as $$
begin
 if public.is_internal_operation() or public.has_role(auth.uid(),'admin') then return NEW;end if;
 if row(NEW.is_banned,NEW.is_suspended,NEW.verification_status,NEW.total_sales,NEW.total_reviews,NEW.rating)
  is distinct from row(OLD.is_banned,OLD.is_suspended,OLD.verification_status,OLD.total_sales,OLD.total_reviews,OLD.rating) then
  raise exception 'Protected profile fields cannot be modified directly';
 end if;
 return NEW;
end $$;
create function public.protect_listing_fields() returns trigger language plpgsql security definer as $$
begin
 if public.is_internal_operation() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator') then return NEW;end if;
 if NEW.status is distinct from OLD.status then raise exception 'Protected listing status';end if;
 NEW.views_count:=OLD.views_count;NEW.favorites_count:=OLD.favorites_count;
 if row(NEW.published_at,NEW.reserved_at,NEW.sold_at) is distinct from row(OLD.published_at,OLD.reserved_at,OLD.sold_at) then raise exception 'Protected listing dates';end if;
 return NEW;
end $$;
create function public.validate_listing_image_path() returns trigger language plpgsql set search_path=public as $$
declare v_seller uuid;
begin
 select seller_id into v_seller from public.listings where id=NEW.listing_id;
 if NEW.storage_path<>v_seller::text||'/'||NEW.listing_id::text||'/'||NEW.position::text||'.webp' then raise exception 'Legacy image path mismatch';end if;
 return NEW;
end $$;
create function public.update_user_rating() returns trigger language plpgsql as $$
declare target_id uuid;
begin
 target_id:=coalesce(NEW.user_id,OLD.user_id);
 update profiles set rating=coalesce((select avg(rating)::numeric(3,2) from platform_reviews where user_id=target_id),0),total_reviews=(select count(*) from platform_reviews where user_id=target_id) where id=target_id;
 return null;
end $$;
create function public.update_seller_sales() returns trigger language plpgsql as $$
begin
 if NEW.status='confirmed' and OLD.status<>'confirmed' then update profiles set total_sales=total_sales+1 where id=NEW.seller_id;end if;
 return NEW;
end $$;
create function public.touch_conversation() returns trigger language plpgsql as $$
begin update conversations set last_message_at=NEW.created_at where id=NEW.conversation_id;return NEW;end $$;
create function public.sync_listing_favorites_count() returns trigger language plpgsql security definer set search_path=public,private as $$
declare v_listing uuid;
begin
 v_listing:=case when TG_OP='DELETE' then OLD.listing_id else NEW.listing_id end;
 perform public._begin_internal_op();
 update public.listings set favorites_count=greatest(favorites_count+case when TG_OP='DELETE' then -1 else 1 end,0) where id=v_listing;
 perform set_config('app.internal_token','',true);
 return coalesce(NEW,OLD);
end $$;
alter table auth.users add column raw_user_meta_data jsonb default '{}';
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,display_name) values(NEW.id,coalesce(NEW.raw_user_meta_data->>'display_name','Usuario')) on conflict(id) do nothing;
 insert into public.profile_private(user_id) values(NEW.id) on conflict(user_id) do nothing;
 return NEW;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create trigger tr_protect_profile_fields before update on public.profiles for each row execute function public.protect_profile_fields();
create trigger tr_protect_listing_fields before update on public.listings for each row execute function public.protect_listing_fields();
create trigger validate_listing_image_path_trigger before insert or update on public.listing_images for each row execute function public.validate_listing_image_path();
create trigger trg_user_rating after insert or delete or update on public.platform_reviews for each row execute function public.update_user_rating();
create trigger trg_sales_confirmed after update on public.sales for each row execute function public.update_seller_sales();
create trigger trg_touch_conversation after insert on public.messages for each row execute function public.touch_conversation();
create trigger favorites_count_ins after insert on public.favorites for each row execute function public.sync_listing_favorites_count();
create trigger favorites_count_del after delete on public.favorites for each row execute function public.sync_listing_favorites_count();

-- iMarket: el admin puede eliminar (retirar) un anuncio publicado.
-- Es una eliminación lógica: status = 'deleted' (deja de verse en el marketplace).
create or replace function public.imarket_admin_remove_listing(p_listing_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_listing public.listings;
begin
  if not public.imarket_is_admin() then raise exception 'IMARKET_FORBIDDEN'; end if;
  if char_length(trim(coalesce(p_reason,''))) not between 5 and 500 then raise exception 'IMARKET_INVALID_REASON'; end if;
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found or v_listing.status::text not in ('active','reserved','paused','pending_review') then
    raise exception 'IMARKET_FORBIDDEN';
  end if;
  insert into public.listing_moderation_history(listing_id, reviewer_id, decision, rejection_reason, previous_status)
    select p_listing_id, auth.uid(), 'rejected', trim(p_reason), r.previous_status
    from jsonb_populate_record(null::public.listing_moderation_history,
         jsonb_build_object('previous_status', v_listing.status::text)) r;
  update public.listings
     set status = (jsonb_populate_record(null::public.listings, jsonb_build_object('status','deleted'))).status,
         featured_at = null, updated_at = now()
   where id = p_listing_id;
end $$;
revoke all on function public.imarket_admin_remove_listing(uuid, text) from public, anon;
grant execute on function public.imarket_admin_remove_listing(uuid, text) to authenticated;

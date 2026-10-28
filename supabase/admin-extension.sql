-- iMarket — extensión aditiva sobre project-migration.sql
-- No reemplaza ni borra nada de la migración original: solo agrega las
-- funciones que faltaban para 1) terminar el panel de administración
-- (usuarios, reportes, métricas) y 2) la confirmación de compra por el
-- comprador, que hoy no existe (imarket_report_sale deja buyer_id en null
-- y no hay ninguna RPC que lo complete ni lo confirme).
--
-- Requisito: project-migration.sql ya debe estar aplicado (imarket_contract(),
-- imarket_is_admin(), imarket_require_account(), etc. deben existir).
-- Revisa y prueba esto en una copia aislada antes de aplicarlo al proyecto
-- real, igual que el resto de los archivos de supabase/.
begin;

do $$ begin
  if to_regprocedure('public.imarket_contract()') is null then
    raise exception 'IMARKET_PREREQUISITE_MISSING: aplica antes supabase/project-migration.sql';
  end if;
end $$;

-- ============================================================
-- 1. Comprador: vincular y confirmar una venta reportada
-- ============================================================

-- El vendedor, tras reportar una venta, puede indicar quién fue el
-- comprador SOLO si existe una conversación entre ambos sobre ese anuncio
-- (evita que cualquiera se adjudique una compra que no hizo).
create or replace function public.imarket_assign_sale_buyer(p_sale_id uuid, p_buyer_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=public.imarket_require_account();v_sale public.sales;
begin
  select * into v_sale from public.sales where id=p_sale_id for update;
  if not found or v_sale.seller_id<>v_uid then raise exception 'IMARKET_FORBIDDEN'; end if;
  if v_sale.buyer_id is not null then raise exception 'IMARKET_FORBIDDEN'; end if;
  if p_buyer_id is null or p_buyer_id=v_uid then raise exception 'IMARKET_INVALID_BUYER'; end if;
  if not exists(select 1 from public.conversations where listing_id=v_sale.listing_id and seller_id=v_uid and buyer_id=p_buyer_id) then
    raise exception 'IMARKET_INVALID_BUYER';
  end if;
  update public.sales set buyer_id=p_buyer_id where id=p_sale_id;
end $$;

-- El comprador confirma la venta. Solo funciona si el vendedor ya lo
-- vinculó con imarket_assign_sale_buyer. Al confirmar, el trigger
-- existente update_seller_sales() incrementa profiles.total_sales del
-- vendedor; como ese campo está protegido por protect_profile_fields(),
-- usamos el mismo mecanismo de token interno que ya usa
-- imarket_report_sale() para el mismo motivo.
create or replace function public.imarket_confirm_sale(p_sale_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=public.imarket_require_account();v_sale public.sales;
begin
  select * into v_sale from public.sales where id=p_sale_id for update;
  if not found or v_sale.buyer_id is distinct from v_uid then raise exception 'IMARKET_FORBIDDEN'; end if;
  if v_sale.status<>'reported' or v_sale.buyer_confirmed then raise exception 'IMARKET_ALREADY_SOLD'; end if;
  if to_regprocedure('public._begin_internal_op()') is not null then execute 'select public._begin_internal_op()'; end if;
  update public.sales set buyer_confirmed=true,status='confirmed',confirmed_at=now() where id=p_sale_id;
  perform set_config('app.internal_token','',true);
  return jsonb_build_object('sale_id',p_sale_id,'status','confirmed');
end $$;

-- ============================================================
-- 2. Panel de administración: usuarios, roles y reportes
-- ============================================================

-- Suspender/banear/reinstalar una cuenta. No toca verification_status.
create or replace function public.imarket_admin_set_account_status(p_user_id uuid, p_is_suspended boolean, p_is_banned boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.imarket_is_admin() then raise exception 'IMARKET_FORBIDDEN'; end if;
  if p_user_id=(select auth.uid()) then raise exception 'IMARKET_FORBIDDEN'; end if;
  update public.profiles set is_suspended=coalesce(p_is_suspended,is_suspended),is_banned=coalesce(p_is_banned,is_banned),updated_at=now()
  where id=p_user_id;
  if not found then raise exception 'IMARKET_FORBIDDEN'; end if;
end $$;

-- Otorgar o revocar un rol (admin/moderator). No existe autoasignación: el
-- primer administrador se crea a mano desde el editor SQL, con un contexto
-- autorizado de la base (fuera del alcance de esta función a propósito).
create or replace function public.imarket_admin_set_role(p_user_id uuid, p_role text, p_grant boolean)
returns void language plpgsql security definer set search_path='' as $$
declare v_role public.app_role;
begin
  if not public.imarket_is_admin() then raise exception 'IMARKET_FORBIDDEN'; end if;
  if p_user_id=(select auth.uid()) then raise exception 'IMARKET_FORBIDDEN'; end if;
  begin
    v_role:=p_role::public.app_role;
  exception when invalid_text_representation then
    raise exception 'IMARKET_ENUM: % no es un rol válido',p_role;
  end;
  if p_grant then
    insert into public.user_roles(user_id,role) values(p_user_id,v_role) on conflict do nothing;
  else
    delete from public.user_roles where user_id=p_user_id and role=v_role;
  end if;
end $$;

-- Resolver un reporte. Los textos de estado reales del enum report_status
-- se descubren igual que el resto del contrato, sin asumirlos a ciegas.
create or replace function public.imarket_admin_resolve_report(p_report_id uuid, p_approve boolean, p_notes text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_status text;
begin
  if not public.imarket_is_admin() then raise exception 'IMARKET_FORBIDDEN'; end if;
  if char_length(coalesce(p_notes,''))>1500 then raise exception 'IMARKET_INVALID_REASON'; end if;
  v_status:=case when p_approve
    then public.imarket_enum('reports','status',array['resolved','closed','actioned'])
    else public.imarket_enum('reports','status',array['dismissed','rejected','closed'])
  end;
  update public.reports set status=(jsonb_populate_record(null::public.reports,jsonb_build_object('status',v_status))).status,
    admin_notes=nullif(trim(coalesce(p_notes,'')),''),reviewed_by=(select auth.uid()),reviewed_at=now()
  where id=p_report_id and status::text='pending';
  if not found then raise exception 'IMARKET_FORBIDDEN'; end if;
end $$;

-- Métricas del panel. Una sola llamada, sin exponer filas individuales.
create or replace function public.imarket_admin_metrics()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_config jsonb;
begin
  if not public.imarket_is_admin() then raise exception 'IMARKET_FORBIDDEN'; end if;
  v_config:=public.imarket_contract();
  return jsonb_build_object(
    'totalUsers',(select count(*) from public.profiles),
    'suspendedUsers',(select count(*) from public.profiles where is_suspended),
    'bannedUsers',(select count(*) from public.profiles where is_banned),
    'pendingVerifications',(select count(*) from public.verification_requests where status::text='pending'),
    'pendingListings',(select count(*) from public.listings where status::text=v_config->>'pending'),
    'publishedListings',(select count(*) from public.listings where status::text=v_config->>'published'),
    'openReports',(select count(*) from public.reports where status::text='pending'),
    'totalSales',(select count(*) from public.sales where status='confirmed'),
    'reportedSales',(select count(*) from public.sales where status='reported')
  );
end $$;

-- ============================================================
-- Permisos: igual que el resto del contrato, EXECUTE abierto a
-- authenticated y el chequeo de rol vive dentro de cada función.
-- ============================================================
revoke all on function
  public.imarket_assign_sale_buyer(uuid,uuid),
  public.imarket_confirm_sale(uuid),
  public.imarket_admin_set_account_status(uuid,boolean,boolean),
  public.imarket_admin_set_role(uuid,text,boolean),
  public.imarket_admin_resolve_report(uuid,boolean,text),
  public.imarket_admin_metrics()
from public,anon,authenticated;

grant execute on function
  public.imarket_assign_sale_buyer(uuid,uuid),
  public.imarket_confirm_sale(uuid),
  public.imarket_admin_set_account_status(uuid,boolean,boolean),
  public.imarket_admin_set_role(uuid,text,boolean),
  public.imarket_admin_resolve_report(uuid,boolean,text),
  public.imarket_admin_metrics()
to authenticated;

notify pgrst, 'reload schema';
commit;

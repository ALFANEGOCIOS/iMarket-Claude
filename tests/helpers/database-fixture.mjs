import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
export async function databaseFixture() {
  const db = new PGlite();
  await db.exec(`
  create role anon; create role authenticated;
  create schema auth;create schema storage;
  grant usage on schema public,auth,storage to anon,authenticated;
  create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  create type public.verification_status as enum('pending','approved','rejected');
  create type public.listing_status as enum('draft','pending_review','active','reserved','sold','paused','rejected','deleted');
  create type public.aesthetic_condition as enum('new','like_new','excellent','good','acceptable');
  create type public.battery_type as enum('original','generic','unknown');
  create type public.sale_source_type as enum('external','platform');
  create type public.report_status as enum('pending','reviewing','resolved','dismissed');
  create type public.app_role as enum('admin','moderator');
  create table storage.buckets(id text primary key,name text not null,public boolean not null,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);
  alter table storage.objects enable row level security;
  grant select,insert,delete on storage.objects to authenticated;
  create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;
 `);
  const source = await readFile(
    new URL("../../supabase/schema-context.sql", import.meta.url),
    "utf8",
  );
  const types = {
    profiles: { verification_status: "verification_status" },
    verification_requests: { status: "verification_status" },
    listings: {
      status: "listing_status",
      battery_type: "battery_type",
      aesthetic_condition: "aesthetic_condition",
    },
    sales: { sale_source: "sale_source_type" },
    reports: { status: "report_status" },
    user_roles: { role: "app_role" },
    listing_moderation_history: { previous_status: "listing_status" },
  };
  for (const block of source.matchAll(
    /CREATE TABLE public\.(\w+) \([\s\S]*?\n\);/g,
  )) {
    let sql = block[0];
    for (const [column, type] of Object.entries(types[block[1]] || {}))
      sql = sql.replace(
        new RegExp(`\\b${column} USER-DEFINED`),
        `${column} public.${type}`,
      );
    await db.exec(sql);
  }
  // Additional constraints observed in the actual project (2026-09-30).
  await db.exec(`
    alter table public.platform_reviews add constraint no_self_review check(reviewer_id<>user_id);
    alter table public.listings add constraint listings_battery_consistency_check check(battery_health is not null or battery_type='unknown');
    alter table public.listings add constraint listings_details_consistency_check check((has_details and details is not null and btrim(details)<>'') or (not has_details and (details is null or btrim(details)='')));
    alter table public.listings add constraint listings_warranty_consistency_check check((has_warranty and warranty_days is not null) or (not has_warranty and warranty_days is null));
    alter table public.verification_requests add constraint verification_requests_paths_when_resolved check(status='pending' or (selfie_path is not null and document_path is not null));
    alter table public.reports add constraint report_has_target check(listing_id is not null or reported_user_id is not null);
    alter table public.conversations add constraint no_self_conversation check(buyer_id<>seller_id);
    alter table public.sales add constraint sales_no_self_buyer check(buyer_id is null or buyer_id<>seller_id);
    alter table public.user_blocks add constraint no_self_block check(blocker_id<>blocked_id);
    alter table public.listing_moderation_history add constraint listing_moderation_history_rejection_check check((decision='rejected' and rejection_reason is not null and btrim(rejection_reason)<>'') or (decision='approved' and rejection_reason is null));
  `);
  return db;
}
export async function asUser(db, userId, sql, params = []) {
  await db.exec(`reset role;set role ${userId ? "authenticated" : "anon"};`);
  await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [
    userId || "",
  ]);
  return db.query(sql, params);
}

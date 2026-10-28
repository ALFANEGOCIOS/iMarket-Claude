-- Read only. Run in your Supabase SQL editor and share the result sets.
-- Does not return customer rows or keys.
select n.nspname as schema_name,t.typname as enum_name,e.enumlabel as value,e.enumsortorder
from pg_type t join pg_namespace n on n.oid=t.typnamespace
join pg_enum e on e.enumtypid=t.oid where n.nspname='public'
order by t.typname,e.enumsortorder;

select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_policies where schemaname in ('public','storage') order by schemaname,tablename,policyname;

select n.nspname as schema_name,c.relname as table_name,c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','storage') and c.relkind='r' order by n.nspname,c.relname;

select event_object_table,trigger_name,action_timing,event_manipulation,action_statement
from information_schema.triggers where trigger_schema in ('public','auth')
order by event_object_table,trigger_name;

select n.nspname as schema_name,p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
p.prosecdef as security_definer,pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prokind='f' order by p.proname;

select id,name,public,file_size_limit,allowed_mime_types from storage.buckets order by id;

select table_name,grantee,privilege_type from information_schema.role_table_grants
where table_schema='public' and grantee in ('anon','authenticated') order by table_name,grantee,privilege_type;

select table_name,column_name,grantee,privilege_type from information_schema.column_privileges
where table_schema='public' and grantee in ('anon','authenticated') order by table_name,column_name,grantee,privilege_type;

select table_name,column_name,data_type,udt_schema,udt_name,column_default
from information_schema.columns where table_schema='public' and data_type='USER-DEFINED' order by table_name,ordinal_position;

-- Constraints may contain compatibility rules absent from a CREATE TABLE export.
select c.relname as table_name,con.conname,pg_get_constraintdef(con.oid) as definition
from pg_constraint con join pg_class c on c.oid=con.conrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and con.contype in ('c','u') order by c.relname,con.conname;

select indexname,indexdef from pg_indexes where schemaname='public' order by tablename,indexname;

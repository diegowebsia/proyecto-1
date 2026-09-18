-- ReviewFlow AI — migración v3.16.0: catálogo de 4 planes (2 familias x 2 niveles).
--
--   negocio       19 €/mes  · locales y servicios (bar, clínica, taller…)
--   negocio_plus  39 €/mes  · mismos límites x3 y hasta 5 sedes
--   tiendas       49 €/mes  · ecommerce/dropshipping: tienda conectada + WhatsApp al entregar
--   tiendas_plus  89 €/mes  · volumen alto, 30 sedes, sincronización cada 30 min
--
-- Aplicable sobre instalaciones v3.9–v3.15 (plan check con 'pro'/'business').
-- Idempotente: normaliza primero y re-crea el constraint después.

begin;

update public.tenants set plan = 'negocio'
 where plan in ('free', 'pro', 'trial', 'gratis', 'gratuito', 'starter', 'standard', 'estandar', 'resenas', 'solo-resenas');

update public.tenants set plan = 'tiendas'
 where plan in ('business', 'completo', 'completo-ecommerce', 'ecommerce', 'enterprise');

update public.tenants set plan = 'negocio'
 where plan not in ('negocio', 'negocio_plus', 'tiendas', 'tiendas_plus');

alter table public.tenants drop constraint if exists tenants_plan_check;
alter table public.tenants
  add constraint tenants_plan_check
  check (plan in ('negocio', 'negocio_plus', 'tiendas', 'tiendas_plus'));
alter table public.tenants alter column plan set default 'negocio';

comment on column public.tenants.plan is
  'Plan del catálogo v3.16.0: negocio | negocio_plus | tiendas | tiendas_plus (fuente única: lib/plans.ts)';

commit;

-- Si usas Supabase Cron (pg_cron, ver migration_3_10_0.sql §8), duplica la cadencia
-- para que Tiendas Plus pueda sincronizar cada 30 min (el endpoint filtra por plan):
--   select cron.alter_job(job_id, schedule := '7,37 * * * *');
-- (Sustituye job_id por el de tu trabajo: select jobid, jobname from cron.job;)

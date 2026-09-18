-- ============================================================
-- ReviewFlow AI v3.14.0 — Integraciones asistidas + entorno de pruebas
-- ------------------------------------------------------------
-- 1) `integrations.status` admite `pending_setup`: el cliente pulsa
--    «Conectar cuenta» y la parte técnica (secretos, API keys) la completa
--    el dueño del proyecto desde /admin. Nunca más campos técnicos en el panel.
-- 2) Nada más cambia: cuotas, RLS, purgas y contadores quedan intactos.
--
-- Ejecutar en Supabase → SQL Editor sobre un proyecto ya migrado a 3_13_0.
-- ============================================================

begin;

alter table public.integrations
  drop constraint if exists integrations_status_check;

alter table public.integrations
  add constraint integrations_status_check
  check (status in ('connected', 'pending_setup', 'error', 'disconnected'));

comment on column public.integrations.status is
  'connected = operativa · pending_setup = solicitada por el cliente, pendiente de que el dueño complete las credenciales desde /admin · error/disconnected = fallida o dada de baja.';

commit;

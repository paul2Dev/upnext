-- UpNext — Documentează event trigger ensure_rls (rls_auto_enable)
-- Rulează acest fișier în Supabase Dashboard > SQL Editor
--
-- Context (security-audit-3, punct [6]):
-- Există live un event trigger "ensure_rls" (ON ddl_command_end, WHEN TAG IN
-- ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')) care apelează funcția
-- rls_auto_enable() și activează automat RLS pe orice tabel nou creat în
-- schema public. Nu apar în niciun migration file — verificat direct pe
-- remote via pg_event_trigger (RAISE NOTICE, apoi șters) după ce o încercare
-- inițială de DROP FUNCTION a eșuat cu eroare de dependență, dovedind că
-- trigger-ul chiar există și e activ (enabled='O'). Acest fișier documentează
-- exact ce rulează pe remote, fără să schimbe comportamentul.

DROP EVENT TRIGGER IF EXISTS ensure_rls;
DROP FUNCTION IF EXISTS public.rls_auto_enable();

CREATE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;

CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();

-- UpNext — Documentează policy INSERT nedocumentat pe profiles
-- Rulează acest fișier în Supabase Dashboard > SQL Editor
--
-- Context (security-audit-3, punct [5]):
-- Descoperit via supabase db pull la rezolvarea punctului [1]: există live
-- policy-ul "Users can insert own profile" (INSERT, to public, check
-- auth.uid() = id) care nu apare în 001_initial_schema.sql. Insert-ul de
-- profil se face oricum prin trigger-ul handle_new_user (SECURITY DEFINER),
-- iar check-ul limitează userul să insereze doar propriul rând — nu e o
-- gaură, doar drift nedocumentat. Acest fișier aduce migration history la
-- zi cu realitatea de pe remote.

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

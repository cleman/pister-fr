-- ============================================================
-- Correctif — récursion infinie dans les règles RLS de `profiles`
-- ============================================================
-- Problème : la règle de `profiles` vérifiait "es-tu admin ?" en
-- refaisant une requête sur `profiles`, ce qui redéclenche la même
-- règle indéfiniment (Postgres bloque ça). Résultat : la requête
-- échoue côté site, alors qu'elle fonctionne dans l'éditeur SQL
-- (qui a des droits élevés et ne passe pas par RLS de la même façon).
--
-- Correctif : sortir la vérification du rôle dans des fonctions
-- `security definer`, qui s'exécutent avec les droits du créateur de
-- la fonction (donc sans redéclencher RLS) et court-circuitent la
-- récursion.
--
-- À exécuter une fois dans l'éditeur SQL Supabase.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.has_edit_role()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('editor', 'admin')
  );
$$;

drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_write_admin" on profiles;
create policy "profiles_write_admin" on profiles
  for all using (public.is_admin());

drop policy if exists "app_data_write_editors" on app_data;
create policy "app_data_write_editors" on app_data
  for insert with check (public.has_edit_role());

drop policy if exists "app_data_update_editors" on app_data;
create policy "app_data_update_editors" on app_data
  for update using (public.has_edit_role());

drop policy if exists "app_data_delete_editors" on app_data;
create policy "app_data_delete_editors" on app_data
  for delete using (public.has_edit_role());

drop policy if exists "editor_invites_admin_only" on editor_invites;
create policy "editor_invites_admin_only" on editor_invites
  for all using (public.is_admin());

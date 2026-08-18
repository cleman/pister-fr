-- ============================================================
-- Correctif — "permission denied for table ..."
-- ============================================================
-- RLS filtre QUELLES lignes un rôle peut voir/modifier, mais Postgres
-- vérifie d'abord si le rôle a même le droit d'accéder à la table.
-- Créer des tables via l'éditeur SQL ne donne pas ce droit de base aux
-- rôles `anon` (visiteur non connecté) et `authenticated` (connecté) —
-- contrairement à l'éditeur de tables graphique de Supabase, qui l'ajoute
-- automatiquement. Sans ce GRANT, l'accès est refusé avant même que les
-- règles RLS (is_admin(), has_edit_role()...) soient évaluées.
--
-- À exécuter une fois dans l'éditeur SQL Supabase.
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select on app_data to anon, authenticated;
grant insert, update, delete on app_data to authenticated;

grant select on profiles to anon, authenticated;
grant insert, update, delete on profiles to authenticated;

grant select on editor_invites to authenticated;
grant insert, update, delete on editor_invites to authenticated;

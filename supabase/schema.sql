-- ============================================================
-- Piste FR — schéma Supabase (auth, rôles, données)
-- À copier-coller UNE FOIS dans l'éditeur SQL de ton projet
-- Supabase (SQL Editor → New query → coller → Run).
-- ============================================================

-- Stockage des données de l'app (compétitions, résultats, athlètes),
-- sous forme de blobs JSON identifiés par une clé — même logique que
-- le prototype (window.storage / localStorage), juste hébergée sur
-- Supabase au lieu du navigateur.
create table if not exists app_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table app_data enable row level security;

-- Droit de base d'accès à la table, en plus de RLS (voir
-- supabase/fix_grants.sql pour l'explication détaillée). Sans ça, Postgres
-- refuse l'accès avant même d'évaluer les règles ci-dessous.
grant usage on schema public to anon, authenticated;
grant select on app_data to anon, authenticated;
grant insert, update, delete on app_data to authenticated;

-- Tout le monde peut LIRE, sans compte (site public).
create policy "app_data_select_public" on app_data
  for select using (true);

-- ------------------------------------------------------------

-- Profils utilisateurs : un rôle par compte ('editor' ou 'admin').
-- Pas de profil = pas de droit d'édition (simple visiteur).
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('editor', 'admin')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

grant select on profiles to anon, authenticated;
grant insert, update, delete on profiles to authenticated;

-- Fonctions security definer : évitent la récursion infinie qui se
-- produirait si la règle de `profiles` refaisait une requête sur
-- `profiles` directement (piège classique de Postgres RLS).
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

-- Chacun voit son propre profil ; l'admin voit tout le monde.
create policy "profiles_select_own_or_admin" on profiles
  for select using (auth.uid() = id or public.is_admin());

-- Seul un admin peut créer/modifier/supprimer des profils (promouvoir,
-- révoquer...). Passe par la page Admin du site, pas besoin de SQL après
-- la mise en place initiale.
create policy "profiles_write_admin" on profiles
  for all using (public.is_admin());

-- ------------------------------------------------------------

-- Écriture des données réservée aux comptes editor/admin.
-- C'est LA règle de sécurité qui empêche un visiteur non connecté (ou un
-- compte sans droit) de modifier quoi que ce soit, même en trafiquant le
-- JavaScript du site : la vérification a lieu ici, côté serveur Supabase.
create policy "app_data_write_editors" on app_data
  for insert with check (public.has_edit_role());
create policy "app_data_update_editors" on app_data
  for update using (public.has_edit_role());
create policy "app_data_delete_editors" on app_data
  for delete using (public.has_edit_role());

-- ------------------------------------------------------------

-- Liste des emails invités comme éditeurs (gérée depuis la page Admin).
create table if not exists editor_invites (
  email text primary key,
  role text not null default 'editor' check (role in ('editor','admin')),
  created_at timestamptz not null default now()
);

alter table editor_invites enable row level security;

grant select, insert, update, delete on editor_invites to authenticated;

create policy "editor_invites_admin_only" on editor_invites
  for all using (public.is_admin());

-- ------------------------------------------------------------

-- Accorde un rôle par email : si un compte existe déjà avec cet email,
-- il reçoit le rôle immédiatement ; sinon, l'invitation reste en attente
-- et le rôle sera accordé automatiquement à l'inscription (voir le
-- déclencheur handle_new_user plus bas). Appelable uniquement par un
-- admin (vérifié à l'intérieur de la fonction).
create or replace function public.grant_role_by_email(target_email text, target_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Seul un admin peut inviter/promouvoir.';
  end if;
  if target_role not in ('editor', 'admin') then
    raise exception 'Rôle invalide.';
  end if;

  select id into target_id from auth.users where email = target_email;
  if target_id is not null then
    insert into profiles (id, email, role) values (target_id, target_email, target_role)
    on conflict (id) do update set role = excluded.role;
  end if;

  insert into editor_invites (email, role) values (target_email, target_role)
  on conflict (email) do update set role = excluded.role;
end;
$$;

grant execute on function public.grant_role_by_email(text, text) to authenticated;

-- ------------------------------------------------------------

-- À l'inscription d'un nouvel utilisateur : si son email figure dans
-- editor_invites, on lui crée automatiquement un profil avec le rôle
-- prévu. Sinon, aucun profil n'est créé : il peut se connecter mais reste
-- un simple lecteur (aucun droit d'écriture, RLS l'empêche).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite record;
begin
  select * into invite from editor_invites where email = new.email;
  if found then
    insert into profiles (id, email, role) values (new.id, new.email, invite.role)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ÉTAPE MANUELLE — à faire une seule fois, toi-même, après avoir lancé
-- le site (npm run dev) :
--
-- 1. Sur le site, clique "Se connecter" → "Créer un compte", inscris-toi
--    avec TON adresse email.
-- 2. Reviens ici et exécute (en remplaçant l'email) :
--
--    insert into profiles (id, email, role)
--    select id, email, 'admin' from auth.users where email = 'ton-email@exemple.com'
--    on conflict (id) do update set role = 'admin';
--
-- Tu es maintenant admin. Pour inviter un éditeur ensuite, utilise la
-- page Admin du site (onglet "Admin", visible une fois connecté en
-- admin) — plus besoin de SQL après cette étape initiale.
-- ============================================================

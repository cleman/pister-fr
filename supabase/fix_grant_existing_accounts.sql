-- ============================================================
-- Correctif — permettre d'inviter/promouvoir un compte déjà créé
-- ============================================================
-- Avant : `editor_invites` ne faisait effet qu'à une future inscription.
-- Si le compte existait déjà, l'invitation ne le "rattrapait" pas.
--
-- Après : cette fonction vérifie immédiatement si un compte existe pour
-- l'email donné et lui accorde le rôle tout de suite ; sinon, l'entrée
-- reste dans editor_invites et le rôle sera accordé automatiquement à
-- la prochaine inscription.
--
-- À exécuter une fois dans l'éditeur SQL Supabase.
-- ============================================================

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

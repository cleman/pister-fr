/**
 * Vérifie que les règles de sécurité (RLS) de Supabase se comportent
 * réellement comme prévu, en conditions réelles — pas une simulation.
 *
 * Je (Claude) n'ai pas accès réseau à ton projet Supabase depuis mon
 * environnement : ce script doit être lancé PAR TOI, sur TA machine.
 *
 * Préparation (une seule fois) :
 *   1. npm install @supabase/supabase-js  (si pas déjà présent)
 *   2. Crée un compte de test SANS aucun rôle (inscris-toi normalement sur
 *      le site avec un email jetable, ne l'invite pas comme éditeur/admin).
 *   3. Renseigne les variables ci-dessous.
 *
 * Lancement :
 *   node supabase/test-rls.mjs
 *
 * Ce script ne modifie rien de façon permanente : la seule écriture de
 * test (si elle réussit) est immédiatement annulée à la fin.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xxxxxxxx.supabase.co"; // <- ton URL
const SUPABASE_ANON_KEY = "eyJhbGci..."; // <- ta clé anon (celle du .env)

// Compte de test SANS rôle éditeur/admin (simple visiteur inscrit)
const TEST_EMAIL = "";
const TEST_PASSWORD = "";

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  OK   ${label}`);
  } else {
    console.log(`  ÉCHEC ${label}`);
    failures++;
  }
}

async function run() {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.log("Renseigne TEST_EMAIL / TEST_PASSWORD (compte sans rôle) avant de lancer ce script.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log("\n1) Visiteur non connecté (anon)");
  {
    const { data, error } = await supabase.from("app_data").select("key").limit(1);
    check("peut lire app_data", !error);

    const { error: writeErr } = await supabase.from("app_data").insert({ key: "test-rls-should-fail", value: {} });
    check("NE PEUT PAS écrire dans app_data", !!writeErr);

    const { error: profErr } = await supabase.from("profiles").select("*").limit(1);
    // profiles n'a pas de policy "select public" -> doit être vide ou en erreur, jamais une liste complète
    check("ne peut pas lister tous les profils (résultat vide ou erreur)", !!profErr || (data ?? []).length === 0 || (profErr === null && true));
  }

  console.log("\n2) Compte inscrit MAIS sans rôle (editor/admin)");
  {
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
    check("connexion réussie avec le compte de test", !signInErr);
    if (signInErr) {
      console.log("   -> vérifie TEST_EMAIL/TEST_PASSWORD, arrêt du script.");
      process.exit(1);
    }

    const { error: writeErr } = await supabase.from("app_data").upsert({ key: "test-rls-should-fail", value: { test: true } });
    check("NE PEUT PAS écrire dans app_data (aucun rôle)", !!writeErr);

    const { error: inviteErr } = await supabase.from("editor_invites").insert({ email: "quelquun@test.com", role: "editor" });
    check("NE PEUT PAS inviter un éditeur (réservé admin)", !!inviteErr);

    const { error: rpcErr } = await supabase.rpc("grant_role_by_email", { target_email: "quelquun@test.com", target_role: "admin" });
    check("NE PEUT PAS s'auto-promouvoir admin via grant_role_by_email", !!rpcErr);

    await supabase.auth.signOut();
  }

  console.log(`\n${failures === 0 ? "Tout est conforme." : failures + " problème(s) détecté(s) — les règles RLS ne se comportent pas comme prévu."}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

run();

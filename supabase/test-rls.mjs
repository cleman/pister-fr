/**
 * Vérifie que les règles de sécurité (RLS) de Supabase se comportent
 * réellement comme prévu, en conditions réelles.
 *
 * Ce fichier ne contient AUCUN identifiant en clair — il lit tout depuis
 * ton fichier .env (déjà ignoré par git, voir .gitignore). Ça veut dire
 * que ce script est sans risque à commiter/partager tel quel.
 *
 * ============================================================
 * COMMENT L'UTILISER (étape par étape)
 * ============================================================
 *
 * 1. Crée un compte de test SANS aucun rôle (jamais invité comme
 *    éditeur/admin) :
 *      - lance le site (npm run dev), clique "Se connecter" -> "Créer
 *        un compte"
 *      - astuce si tu utilises Gmail : "tonadresse+test@gmail.com" ->
 *        ça arrive dans ta boîte normale, mais Supabase le traite comme
 *        un compte totalement différent
 *      - si Supabase demande une confirmation par email, clique le lien
 *        reçu avant de continuer
 *
 * 2. Ouvre ton fichier .env (à la racine du projet) et ajoute ces deux
 *    lignes (les autres VITE_SUPABASE_... y sont déjà) :
 *
 *      TEST_RLS_EMAIL=tonadresse+test@gmail.com
 *      TEST_RLS_PASSWORD=le-mot-de-passe-choisi
 *
 * 3. Depuis un terminal, dans le dossier piste-fr :
 *      node supabase/test-rls.mjs
 *
 * Tu dois voir une série de lignes "OK". Si une ligne dit "ECHEC",
 * copie-moi la sortie complète du terminal.
 *
 * Ce script n'écrit rien de permanent : les seules écritures tentées
 * sont censées être refusées ; si l'une d'elles réussissait par erreur
 * (signe d'un bug), le script la supprime automatiquement à la fin.
 * ============================================================
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
// Node 18/20 n'a pas de WebSocket natif (contrairement au navigateur, où
// le site lui-même fonctionne sans ce paquet) ; on le fournit explicitement
// pour que ce script Node fonctionne quelle que soit la version installée.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_RLS_EMAIL;
const TEST_PASSWORD = process.env.TEST_RLS_PASSWORD;

let failures = 0;
function check(label, ok) {
  console.log(`  ${ok ? "OK   " : "ECHEC"}  ${label}`);
  if (!ok) failures++;
}

async function run() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY introuvables dans .env. Vérifie que tu lances ce script depuis le dossier piste-fr.");
    process.exit(1);
  }
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.log("Ajoute TEST_RLS_EMAIL et TEST_RLS_PASSWORD dans ton .env (voir les instructions en haut de ce fichier) avant de lancer ce script.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { transport: WebSocket },
  });

  console.log("\n1) Visiteur non connecté (anonyme)");
  {
    const { error: readErr } = await supabase.from("app_data").select("key").limit(1);
    check("peut lire app_data (le site doit rester public en lecture)", !readErr);

    const { error: writeErr } = await supabase.from("app_data").insert({ key: "test-rls-should-fail", value: {} });
    check("NE PEUT PAS écrire dans app_data", !!writeErr);

    const { data: profData, error: profErr } = await supabase.from("profiles").select("*");
    // RLS doit filtrer TOUTES les lignes pour un anonyme : pas d'erreur,
    // mais une liste vide (aucune ligne ne remplit "auth.uid() = id").
    check("ne voit aucun profil (liste vide, pas une erreur bloquante)", !profErr && (profData || []).length === 0);
  }

  console.log("\n2) Compte inscrit MAIS sans rôle éditeur/admin");
  {
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
    check("connexion réussie avec le compte de test", !signInErr);
    if (signInErr) {
      console.log(`   -> ${signInErr.message}`);
      console.log("   Vérifie TEST_RLS_EMAIL/TEST_RLS_PASSWORD dans .env (et que l'email est confirmé si Supabase le demande). Arrêt.");
      process.exit(1);
    }

    const { error: writeErr } = await supabase.from("app_data").upsert({ key: "test-rls-should-fail", value: { test: true } });
    check("NE PEUT PAS écrire dans app_data (aucun rôle)", !!writeErr);
    if (!writeErr) {
      await supabase.from("app_data").delete().eq("key", "test-rls-should-fail");
    }

    const { error: inviteErr } = await supabase.from("editor_invites").insert({ email: "personne-test-rls@example.com", role: "editor" });
    check("NE PEUT PAS inviter un éditeur (réservé à l'admin)", !!inviteErr);
    if (!inviteErr) {
      await supabase.from("editor_invites").delete().eq("email", "personne-test-rls@example.com");
    }

    const { error: rpcErr } = await supabase.rpc("grant_role_by_email", { target_email: "personne-test-rls@example.com", target_role: "admin" });
    check("NE PEUT PAS s'auto-promouvoir admin via grant_role_by_email", !!rpcErr);

    await supabase.auth.signOut();
  }

  console.log(`\n${failures === 0 ? "Tout est conforme : la sécurité tient." : failures + " probleme(s) detecte(s) -> a me signaler avec le detail affiche ci-dessus."}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

run();

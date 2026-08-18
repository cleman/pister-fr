/**
 * Couche de persistance.
 *
 * Branchée sur Supabase (table `app_data`, voir supabase/schema.sql) :
 * lecture publique pour tout le monde, écriture réservée aux comptes
 * editor/admin via les règles RLS définies côté base — pas dans ce fichier,
 * donc impossible à contourner depuis le navigateur.
 *
 * L'interface (get -> {key, value} | null, set -> {key, value} | null,
 * value toujours en JSON stringifié) est inchangée par rapport à la version
 * localStorage précédente : aucun autre fichier de l'app n'a eu besoin
 * d'être modifié pour ce changement.
 */

import { supabase } from "./supabaseClient";

async function get(key) {
  try {
    const { data, error } = await supabase
      .from("app_data")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return null;
    return { key, value: JSON.stringify(data.value) };
  } catch (e) {
    return null;
  }
}

async function set(key, value) {
  try {
    const parsed = JSON.parse(value);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("app_data")
      .upsert({ key, value: parsed, updated_at: new Date().toISOString(), updated_by: user ? user.id : null });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Écriture refusée (droits insuffisants ?)", error.message);
      return null;
    }
    return { key, value };
  } catch (e) {
    return null;
  }
}

async function del(key) {
  try {
    const { error } = await supabase.from("app_data").delete().eq("key", key);
    if (error) return null;
    return { key, deleted: true };
  } catch (e) {
    return null;
  }
}

async function list(prefix) {
  try {
    let query = supabase.from("app_data").select("key");
    if (prefix) query = query.like("key", `${prefix}%`);
    const { data, error } = await query;
    if (error) return null;
    return { keys: (data || []).map((r) => r.key) };
  } catch (e) {
    return null;
  }
}

export const storage = { get, set, delete: del, list };

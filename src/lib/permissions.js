/**
 * Dérive les droits effectifs à partir du rôle d'un compte.
 * Isolé dans un fichier à part (plutôt que gardé inline dans auth.jsx) pour
 * pouvoir le tester sans avoir à simuler React ou Supabase.
 *
 * role attendu : "editor" | "admin" | null (aucun profil = simple visiteur)
 */
export function derivePermissions(role) {
  const isAdmin = role === "admin";
  const canEdit = role === "editor" || isAdmin;
  return { canEdit, isAdmin };
}

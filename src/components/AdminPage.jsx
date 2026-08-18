import React, { useEffect, useRef, useState } from "react";
import { Download, ShieldCheck, Trash2, Upload, UserPlus } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function AdminPage({ competitions, resultsStore, athletes, onRestoreBackup }) {
  const [invites, setInvites] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [importError, setImportError] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef(null);

  const totalResults = Object.values(resultsStore).reduce(
    (sum, blocks) => sum + (blocks || []).reduce((s, b) => s + b.entries.length, 0),
    0
  );

  function handleExport() {
    const payload = {
      exportedAt: new Date().toISOString(),
      competitions,
      resultsStore,
      athletes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `piste-fr-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImportError("");
    setImportMsg("");
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload.competitions || !payload.resultsStore || !payload.athletes) {
        throw new Error("Fichier invalide : il doit contenir competitions, resultsStore et athletes.");
      }
      const confirmed = window.confirm(
        `Ceci va REMPLACER toutes les données actuelles par celles du fichier (sauvegarde du ${payload.exportedAt ? new Date(payload.exportedAt).toLocaleString("fr-FR") : "date inconnue"}). Continuer ?`
      );
      if (!confirmed) return;
      await onRestoreBackup(payload);
      setImportMsg("Données restaurées avec succès.");
    } catch (err) {
      setImportError("Import impossible : " + (err.message || String(err)));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function refresh() {
    setLoading(true);
    const [{ data: inv }, { data: profs }] = await Promise.all([
      supabase.from("editor_invites").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    setInvites(inv || []);
    setProfiles(profs || []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function handleInvite(e) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;
    const { error: err } = await supabase.rpc("grant_role_by_email", {
      target_email: email.trim().toLowerCase(),
      target_role: role,
    });
    if (err) { setError(err.message); return; }
    setEmail("");
    refresh();
  }

  async function removeInvite(invEmail) {
    await supabase.from("editor_invites").delete().eq("email", invEmail);
    refresh();
  }

  async function changeProfileRole(id, newRole) {
    await supabase.from("profiles").update({ role: newRole }).eq("id", id);
    refresh();
  }
  async function removeProfile(id) {
    await supabase.from("profiles").delete().eq("id", id);
    refresh();
  }

  return (
    <section className="max-w-3xl mx-auto px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: "var(--track)" }}>
        <ShieldCheck size={13} /> Administration
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8" style={{ color: "var(--ink)" }}>Tableau de bord</h1>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Athlètes" value={athletes.length} />
        <Stat label="Compétitions" value={competitions.length} />
        <Stat label="Résultats saisis" value={totalResults} />
      </div>

      {/* SAUVEGARDE */}
      <div className="rounded-md p-4 mb-10" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <p className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: "var(--steel)" }}>Sauvegarde</p>
        <p className="text-xs mb-3" style={{ color: "var(--steel)" }}>
          Supabase (plan gratuit) ne fait pas de sauvegarde automatique. Exporte régulièrement un fichier de secours.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleExport} className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--ink)", color: "#fff" }}>
            <Download size={13} /> Exporter en JSON
          </button>
          <label className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm cursor-pointer" style={{ border: "1px solid var(--track)", color: "var(--track)" }}>
            <Upload size={13} /> Restaurer depuis un fichier
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          </label>
        </div>
        {importError && <p className="text-xs font-mono mt-2" style={{ color: "var(--track)" }}>{importError}</p>}
        {importMsg && <p className="text-xs font-mono mt-2" style={{ color: "var(--lane-yellow)" }}>{importMsg}</p>}
      </div>

      <p className="font-mono text-xs mb-8" style={{ color: "var(--steel)" }}>
        Pour les statistiques de visites, un outil d'analytics dédié (ex. Umami, gratuit et sans cookie) est recommandé plutôt qu'un compteur maison — voir le README.
      </p>

      {/* INVITATIONS */}
      <p className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: "var(--steel)" }}>Inviter un éditeur</p>
      <form onSubmit={handleInvite} className="flex flex-wrap gap-2 mb-4">
        <input className="field flex-1 min-w-[10rem]" type="email" placeholder="email@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="field" style={{ width: "auto" }} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="editor">Éditeur</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--track)", color: "#fff" }}>
          <UserPlus size={13} /> Inviter
        </button>
      </form>
      {error && <p className="text-xs font-mono mb-4" style={{ color: "var(--track)" }}>{error}</p>}

      {!loading && invites.length > 0 && (
        <div className="mb-10 space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--steel)" }}>Invitations enregistrées (donnent le rôle automatiquement à l'inscription, ou immédiatement si le compte existe déjà — voir "Comptes avec accès" ci-dessous)</p>
          {invites.map((inv) => (
            <div key={inv.email} className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: "1px solid var(--line)" }}>
              <span style={{ color: "var(--ink)" }}>{inv.email} <span className="font-mono text-xs" style={{ color: "var(--steel)" }}>· {inv.role}</span></span>
              <button onClick={() => removeInvite(inv.email)} aria-label="Retirer l'invitation" style={{ color: "var(--steel)" }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* COMPTES ACTIFS */}
      <p className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: "var(--steel)" }}>Comptes avec accès</p>
      {loading ? (
        <p className="text-sm" style={{ color: "var(--steel)" }}>Chargement…</p>
      ) : profiles.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--steel)" }}>Aucun compte éditeur ou admin pour le moment.</p>
      ) : (
        <div className="space-y-1">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: "1px solid var(--line)" }}>
              <span style={{ color: "var(--ink)" }}>{p.email}</span>
              <div className="flex items-center gap-2">
                <select className="field" style={{ width: "auto" }} value={p.role} onChange={(e) => changeProfileRole(p.id, e.target.value)}>
                  <option value="editor">Éditeur</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => removeProfile(p.id)} aria-label="Révoquer l'accès" style={{ color: "var(--track)" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
      <p className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--steel)" }}>{label}</p>
      <p className="font-mono font-bold text-2xl" style={{ color: "var(--ink)" }}>{value}</p>
    </div>
  );
}

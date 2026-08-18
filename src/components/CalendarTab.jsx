import React, { useMemo, useState } from "react";
import { Bell, BellRing, Calendar, Eye, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { TIERS, STATUS_INFO, TIER_WEIGHT } from "../data/competitions";
import { getCompStatus } from "../lib/ranking";
import { useAuth } from "../lib/auth";

export default function CalendarTab({ loaded, competitions, resultsStore, onOpen, onToggleFollow, onAddCompetition, onDeleteCompetition }) {
  const { canEdit, isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", location: "", tier: "circuit" });

  function handleDelete(c) {
    if (!window.confirm(`Supprimer "${c.name}" et TOUS ses résultats saisis ? Cette action est irréversible.`)) return;
    onDeleteCompetition(c.id);
  }

  const rows = useMemo(() => {
    return competitions
      .map((c) => ({ ...c, status: getCompStatus(c, resultsStore) }))
      .filter((c) => statusFilter === "all" || c.status === statusFilter)
      .sort((a, b) => (TIER_WEIGHT[a.tier] - TIER_WEIGHT[b.tier]) || (new Date(b.date) - new Date(a.date)));
  }, [competitions, resultsStore, statusFilter]);

  function handleAdd() {
    if (!form.name.trim() || !form.date) return;
    onAddCompetition({ ...form });
    setForm({ name: "", date: "", location: "", tier: "circuit" });
    setShowForm(false);
  }

  if (!loaded) return <p className="max-w-5xl mx-auto px-6 py-10 font-mono text-sm" style={{ color: "var(--steel)" }}>Chargement du calendrier…</p>;

  return (
    <section className="max-w-5xl mx-auto px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "var(--track)" }}>Compétitions</p>
      <h1 className="font-display font-semibold text-3xl mb-6" style={{ color: "var(--ink)" }}>Calendrier &amp; saisie des résultats</h1>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {[["all", "Toutes"], ["a_saisir", "À saisir"], ["en_cours", "En cours"], ["a_venir", "À venir"], ["saisi", "Saisi"]].map(([key, label]) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm"
              style={{ background: statusFilter === key ? "var(--ink)" : "var(--card)", color: statusFilter === key ? "#fff" : "var(--ink)", border: "1px solid " + (statusFilter === key ? "var(--ink)" : "var(--line)") }}>{label}</button>
          ))}
        </div>
        {canEdit && (
          <button onClick={() => setShowForm((v) => !v)} className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--track)", color: "#fff" }}><Plus size={14} /> Ajouter une compétition</button>
        )}
      </div>

      {canEdit && showForm && (
        <div className="rounded-md p-4 mb-6 grid sm:grid-cols-4 gap-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <input className="field sm:col-span-2" placeholder="Nom de la compétition" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <select className="field" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
            {Object.entries(TIERS).map(([key, t]) => (<option key={key} value={key}>{t.label}</option>))}
          </select>
          <input className="field sm:col-span-3" placeholder="Lieu" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <button onClick={handleAdd} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--ink)", color: "#fff" }}>Enregistrer</button>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((c) => (
          <div key={c.id} className="rounded-md p-4 flex items-center gap-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            {canEdit ? (
              <button onClick={() => onToggleFollow(c.id)} aria-label="Suivre cette compétition" className="focus-ring p-1.5 rounded-sm shrink-0" style={{ color: c.following ? "var(--track)" : "var(--steel)" }}>
                {c.following ? <BellRing size={17} /> : <Bell size={17} />}
              </button>
            ) : (
              <span className="p-1.5 shrink-0" style={{ color: "var(--line)" }}><Bell size={17} /></span>
            )}
            <button onClick={() => onOpen(c.id, "view")} className="focus-ring flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-sm" style={{ color: "var(--ink)" }}>{c.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm" style={TIERS[c.tier].style}>{TIERS[c.tier].label}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm" style={STATUS_INFO[c.status].style}>{STATUS_INFO[c.status].label}</span>
              </div>
              <p className="text-xs mt-1 flex items-center gap-3 flex-wrap" style={{ color: "var(--steel)" }}>
                <span className="flex items-center gap-1"><Calendar size={11} />{new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                {c.location && <span className="flex items-center gap-1"><MapPin size={11} />{c.location}</span>}
              </p>
            </button>
            <button onClick={() => onOpen(c.id, canEdit ? "edit" : "view")} className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm shrink-0" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>
              {canEdit ? (<><Pencil size={13} /> Éditeur</>) : (<><Eye size={13} /> Voir</>)}
            </button>
            {isAdmin && (
              <button onClick={() => handleDelete(c)} aria-label="Supprimer cette compétition" className="focus-ring p-1.5 rounded-sm shrink-0" style={{ color: "var(--track)" }}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm font-mono" style={{ color: "var(--steel)" }}>Aucune compétition pour ce filtre.</p>}
      </div>
    </section>
  );
}

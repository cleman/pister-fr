import React, { useMemo, useState } from "react";
import { Bell, BellRing, Calendar, CalendarDays, Eye, ExternalLink, List, MapPin, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { TIERS, STATUS_INFO } from "../data/competitions";
import { getCompStatus } from "../lib/ranking";
import { useAuth } from "../lib/auth";
import CalendarMonthView from "./CalendarMonthView";

export default function CalendarTab({ loaded, competitions, resultsStore, onOpen, onToggleFollow, onAddCompetition, onDeleteCompetition }) {
  const { canEdit, isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("list"); // 'list' | 'calendar'
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", location: "", tier: "circuit", resultsUrl: "" });

  function handleDelete(c) {
    if (!window.confirm(`Supprimer "${c.name}" et TOUS ses résultats saisis ? (restaurable depuis la corbeille par un admin)`)) return;
    onDeleteCompetition(c.id);
  }

  const withStatus = useMemo(() => competitions.map((c) => ({ ...c, status: getCompStatus(c, resultsStore) })), [competitions, resultsStore]);

  const locations = useMemo(() => [...new Set(competitions.map((c) => c.location).filter(Boolean))].sort(), [competitions]);
  const years = useMemo(() => [...new Set(competitions.map((c) => new Date(c.date).getFullYear()))].sort((a, b) => b - a), [competitions]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withStatus
      .filter((c) => statusFilter === "all" || c.status === statusFilter)
      .filter((c) => tierFilter === "all" || c.tier === tierFilter)
      .filter((c) => locationFilter === "all" || c.location === locationFilter)
      .filter((c) => yearFilter === "all" || new Date(c.date).getFullYear() === yearFilter)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.location || "").toLowerCase().includes(q))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [withStatus, statusFilter, tierFilter, locationFilter, yearFilter, query]);

  function handleAdd() {
    if (!form.name.trim() || !form.date) return;
    onAddCompetition({ ...form });
    setForm({ name: "", date: "", location: "", tier: "circuit", resultsUrl: "" });
    setShowForm(false);
  }

  if (!loaded) return <p className="max-w-5xl mx-auto px-6 py-10 font-mono text-sm" style={{ color: "var(--steel)" }}>Chargement du calendrier…</p>;

  return (
    <section className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--track)" }}>Compétitions</p>
        <div className="flex rounded-sm overflow-hidden" style={{ border: "1px solid var(--line)" }}>
          <button onClick={() => setView("list")} className="focus-ring flex items-center gap-1 font-mono text-[10px] uppercase px-2 py-1.5" style={{ background: view === "list" ? "var(--ink)" : "var(--card)", color: view === "list" ? "#fff" : "var(--ink)" }}><List size={12} /> Liste</button>
          <button onClick={() => setView("calendar")} className="focus-ring flex items-center gap-1 font-mono text-[10px] uppercase px-2 py-1.5" style={{ background: view === "calendar" ? "var(--ink)" : "var(--card)", color: view === "calendar" ? "#fff" : "var(--ink)" }}><CalendarDays size={12} /> Calendrier</button>
        </div>
      </div>
      <h1 className="font-display font-semibold text-3xl mb-6" style={{ color: "var(--ink)" }}>Calendrier &amp; saisie des résultats</h1>

      {view === "calendar" ? (
        <CalendarMonthView competitions={rows} onOpen={onOpen} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
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

          {/* Filtres complémentaires : type, lieu, période */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setTierFilter("all")} className="focus-ring font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm" style={{ background: tierFilter === "all" ? "var(--ink)" : "var(--card)", color: tierFilter === "all" ? "#fff" : "var(--steel)", border: "1px solid var(--line)" }}>Tous types</button>
              {Object.entries(TIERS).map(([key, t]) => {
                const selected = tierFilter === key;
                const style = selected
                  ? (key === "regionale" ? { background: "var(--paper)", color: "var(--ink)", border: "2px solid var(--ink)" } : t.style)
                  : { color: "var(--steel)", border: "1px solid var(--line)" };
                return (
                  <button key={key} onClick={() => setTierFilter(key)} className="focus-ring font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm" style={style}>{t.label}</button>
                );
              })}
            </div>
            {locations.length > 0 && (
              <select className="field" style={{ width: "auto" }} value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                <option value="all">Tous les lieux</option>
                {locations.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            )}
            {years.length > 1 && (
              <select className="field" style={{ width: "auto" }} value={yearFilter} onChange={(e) => setYearFilter(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}>
                <option value="all">Toutes les années</option>
                {years.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
            )}
          </div>

          <div className="relative mb-4" style={{ maxWidth: "20rem" }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--steel)" }} />
            <input className="field" style={{ paddingLeft: "2rem" }} placeholder="Chercher par nom ou lieu…" value={query} onChange={(e) => setQuery(e.target.value)} />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Effacer la recherche" className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "var(--steel)" }}><X size={14} /></button>
            )}
          </div>

          {canEdit && showForm && (
            <div className="rounded-md p-4 mb-6 grid sm:grid-cols-4 gap-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <input className="field sm:col-span-2" placeholder="Nom de la compétition" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <select className="field" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                {Object.entries(TIERS).map(([key, t]) => (<option key={key} value={key}>{t.label}</option>))}
              </select>
              <input className="field sm:col-span-2" placeholder="Lieu" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <input className="field sm:col-span-2" placeholder="Lien résultats/fiche horaire (optionnel)" value={form.resultsUrl} onChange={(e) => setForm({ ...form, resultsUrl: e.target.value })} />
              <button onClick={handleAdd} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm sm:col-span-4" style={{ background: "var(--ink)", color: "#fff" }}>Enregistrer</button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            {rows.map((c) => (
              <div key={c.id} className="rounded-md p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <button onClick={() => onOpen(c.id, "view")} className="focus-ring text-left min-w-0">
                    <span className="font-display text-sm" style={{ color: "var(--ink)" }}>{c.name}</span>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit ? (
                      <button onClick={() => onToggleFollow(c.id)} aria-label="Suivre cette compétition" className="focus-ring p-1 rounded-sm" style={{ color: c.following ? "var(--track)" : "var(--steel)" }}>
                        {c.following ? <BellRing size={15} /> : <Bell size={15} />}
                      </button>
                    ) : null}
                    {isAdmin && (
                      <button onClick={() => handleDelete(c)} aria-label="Supprimer cette compétition" className="focus-ring p-1 rounded-sm" style={{ color: "var(--track)" }}><Trash2 size={15} /></button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm" style={TIERS[c.tier].style}>{TIERS[c.tier].label}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm" style={STATUS_INFO[c.status].style}>{STATUS_INFO[c.status].label}</span>
                </div>
                <p className="text-xs mb-3 flex items-center gap-3 flex-wrap" style={{ color: "var(--steel)" }}>
                  <span className="flex items-center gap-1"><Calendar size={11} />{new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                  {c.location && <span className="flex items-center gap-1"><MapPin size={11} />{c.location}</span>}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => onOpen(c.id, canEdit ? "edit" : "view")} className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-1.5 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>
                    {canEdit ? (<><Pencil size={12} /> Éditeur</>) : (<><Eye size={12} /> Voir</>)}
                  </button>
                  {c.resultsUrl && (
                    <a href={c.resultsUrl} target="_blank" rel="noreferrer" className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-1.5 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--track)" }}>
                      <ExternalLink size={12} /> Résultats officiels
                    </a>
                  )}
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="text-sm font-mono md:col-span-2" style={{ color: "var(--steel)" }}>Aucune compétition pour ce filtre.</p>}
          </div>
        </>
      )}
    </section>
  );
}

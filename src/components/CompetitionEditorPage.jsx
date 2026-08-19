import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, Eye, Info, MapPin, Pencil, Settings, Trash2 } from "lucide-react";
import { DISCIPLINES, getLabel } from "../data/disciplines";
import { TIERS } from "../data/competitions";
import { roundKey, defaultRound } from "../lib/rounds";
import { computeCompetitionOverview } from "../lib/ranking";
import { useAuth } from "../lib/auth";
import DisciplineChips from "./DisciplineChips";
import EnvironmentToggle from "./EnvironmentToggle";
import RoundPicker from "./RoundPicker";
import ResultBlockForm from "./ResultBlockForm";
import ResultsTable from "./ResultsTable";
import MarkScale from "./MarkScale";

function ChangeRoundForm({ current, existingRounds, onApply, onCancel }) {
  const [type, setType] = useState(current.type === "overview" ? "finale" : current.type);
  const [heat, setHeat] = useState(current.heat || 1);
  return (
    <div className="flex items-center gap-2 flex-wrap p-2 rounded-sm mb-2" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
      <select className="field" style={{ width: "auto" }} value={type} onChange={(e) => setType(e.target.value)}>
        <option value="finale">Finale</option>
        <option value="demi">Demi-finale</option>
        <option value="serie">Série</option>
      </select>
      <input className="field" style={{ width: "5rem" }} type="number" min="1" value={heat} onChange={(e) => setHeat(parseInt(e.target.value, 10) || 1)} />
      <button onClick={() => onApply({ type, heat })} className="focus-ring font-mono text-[10px] uppercase tracking-wide px-2 py-1.5 rounded-sm" style={{ background: "var(--track)", color: "#fff" }}>Appliquer</button>
      <button onClick={onCancel} className="focus-ring font-mono text-[10px] uppercase tracking-wide px-2 py-1.5" style={{ color: "var(--steel)" }}>Annuler</button>
    </div>
  );
}

function EditMetaForm({ comp, onSave, onCancel }) {
  const [name, setName] = useState(comp.name);
  const [date, setDate] = useState(comp.date);
  const [location, setLocation] = useState(comp.location || "");
  const [tier, setTier] = useState(comp.tier);
  const [resultsUrl, setResultsUrl] = useState(comp.resultsUrl || "");
  return (
    <div className="rounded-md p-4 mb-6 grid sm:grid-cols-2 gap-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
      <input className="field sm:col-span-2" placeholder="Nom de la compétition" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <select className="field" value={tier} onChange={(e) => setTier(e.target.value)}>
        {Object.entries(TIERS).map(([key, t]) => (<option key={key} value={key}>{t.label}</option>))}
      </select>
      <input className="field sm:col-span-2" placeholder="Lieu" value={location} onChange={(e) => setLocation(e.target.value)} />
      <input className="field sm:col-span-2" placeholder="Lien résultats/fiche horaire (optionnel)" value={resultsUrl} onChange={(e) => setResultsUrl(e.target.value)} />
      <div className="sm:col-span-2 flex gap-2">
        <button onClick={() => onSave({ name: name.trim(), date, location: location.trim(), tier, resultsUrl: resultsUrl.trim() })} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--track)", color: "#fff" }}>Enregistrer</button>
        <button onClick={onCancel} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ color: "var(--steel)" }}>Annuler</button>
      </div>
    </div>
  );
}

export default function CompetitionEditorPage({
  comp, blocks, athletes, mode,
  initialDisciplineId, initialGender, initialRound, initialEnvironment,
  onModeChange, onBack, onSelectAthlete, onSaveBlock, onUpdateBlock, onDeleteBlock, onDeleteEntry, onToggleComplete, onUpdateMeta, onChangeRound,
}) {
  const { canEdit, isAdmin } = useAuth();
  const effectiveMode = canEdit ? mode : "view";
  const [filterGender, setFilterGender] = useState(initialGender || (blocks[0] ? blocks[0].gender : "H"));
  const [filterDisciplineId, setFilterDisciplineId] = useState(initialDisciplineId || (blocks[0] ? blocks[0].disciplineId : "100"));
  const filterDiscipline = DISCIPLINES.find((d) => d.id === filterDisciplineId);
  const [filterEnv, setFilterEnv] = useState(initialEnvironment || "outdoor");
  const effectiveEnv = filterDiscipline.indoorEligible ? filterEnv : "outdoor";

  const blocksForFilter = blocks.filter((b) => b.disciplineId === filterDisciplineId && b.gender === filterGender && (b.environment || "outdoor") === effectiveEnv);
  const [activeRound, setActiveRound] = useState(initialRound || defaultRound(blocksForFilter));
  const [editing, setEditing] = useState(false);
  const [changingRound, setChangingRound] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);

  const isOverview = activeRound && activeRound.type === "overview";
  const activeBlock = activeRound && !isOverview ? blocksForFilter.find((b) => roundKey(b.round) === roundKey(activeRound)) || null : null;
  const activeBlockIndex = activeBlock ? blocks.indexOf(activeBlock) : -1;
  const overviewEntries = isOverview ? computeCompetitionOverview(filterDiscipline, blocksForFilter) : null;

  function changeFilter(nextDisciplineId, nextGender, nextEnv) {
    setFilterDisciplineId(nextDisciplineId);
    setFilterGender(nextGender);
    setFilterEnv(nextEnv);
    const nd = DISCIPLINES.find((d) => d.id === nextDisciplineId);
    const env = nd.indoorEligible ? nextEnv : "outdoor";
    const nb = blocks.filter((b) => b.disciplineId === nextDisciplineId && b.gender === nextGender && (b.environment || "outdoor") === env);
    setActiveRound(defaultRound(nb));
    setEditing(false);
    setChangingRound(false);
  }
  function selectRound(round) {
    setActiveRound(round);
    setEditing(false);
    setChangingRound(false);
  }
  async function applyRoundChange(newRound) {
    const others = blocksForFilter.filter((b) => b !== activeBlock).map((b) => b.round);
    if (others.some((r) => roundKey(r) === roundKey(newRound))) {
      window.alert("Ce tour existe déjà pour cette discipline. Choisis un autre numéro.");
      return;
    }
    const ok = await onChangeRound(activeBlockIndex, newRound);
    if (ok !== false) { setActiveRound(newRound); setChangingRound(false); }
  }

  const hasDataFor = (d) => blocks.some((b) => b.disciplineId === d.id && b.gender === filterGender);

  return (
    <section className="max-w-3xl mx-auto px-6 py-10">
      <button onClick={onBack} className="focus-ring flex items-center gap-2 font-mono text-xs uppercase tracking-wide mb-6" style={{ color: "var(--steel)" }}><ArrowLeft size={14} /> Retour au calendrier</button>

      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "var(--track)" }}>
            <span className="px-1.5 py-0.5 rounded-sm mr-2" style={TIERS[comp.tier].style}>{TIERS[comp.tier].label}</span>
            {new Date(comp.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <h1 className="font-display font-semibold text-3xl mb-1" style={{ color: "var(--ink)" }}>{comp.name}</h1>
          {comp.location && <p className="text-sm flex items-center gap-1" style={{ color: "var(--steel)" }}><MapPin size={13} />{comp.location}</p>}
          {comp.resultsUrl && (
            <a href={comp.resultsUrl} target="_blank" rel="noreferrer" className="focus-ring text-sm flex items-center gap-1 mt-1" style={{ color: "var(--track)" }}>
              <ExternalLink size={13} /> Résultats officiels
            </a>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setEditingMeta((v) => !v)} aria-label="Modifier les infos" className="focus-ring p-2 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><Settings size={15} /></button>
            <button onClick={onToggleComplete}
              className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm"
              style={{ background: comp.manualComplete ? "var(--lane-yellow)" : "var(--card)", color: "var(--ink)", border: "1px solid " + (comp.manualComplete ? "var(--lane-yellow)" : "var(--line)") }}>
              <CheckCircle2 size={13} /> {comp.manualComplete ? "Marquée complète" : "Marquer comme complète"}
            </button>
            <button onClick={() => onModeChange(effectiveMode === "view" ? "edit" : "view")}
              className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm"
              style={{ background: effectiveMode === "edit" ? "var(--ink)" : "var(--card)", color: effectiveMode === "edit" ? "#fff" : "var(--ink)", border: "1px solid var(--line)" }}>
              {effectiveMode === "edit" ? (<><Eye size={13} /> Voir</>) : (<><Pencil size={13} /> Éditeur</>)}
            </button>
          </div>
        )}
      </div>

      {canEdit && editingMeta && (
        <EditMetaForm comp={comp} onCancel={() => setEditingMeta(false)} onSave={(patch) => { onUpdateMeta(patch); setEditingMeta(false); }} />
      )}

      {/* FILTRE sexe / environnement */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex rounded-sm overflow-hidden" style={{ border: "1px solid var(--ink)" }}>
          {["H", "F"].map((g) => (
            <button key={g} onClick={() => changeFilter(filterDisciplineId, g, filterEnv)} className="focus-ring font-display text-sm px-4 py-2"
              style={{ background: filterGender === g ? "var(--ink)" : "transparent", color: filterGender === g ? "#fff" : "var(--ink)" }}>{g === "H" ? "Hommes" : "Femmes"}</button>
          ))}
        </div>
        {filterDiscipline.indoorEligible && (
          <EnvironmentToggle environment={effectiveEnv} onChange={(env) => changeFilter(filterDisciplineId, filterGender, env)} />
        )}
      </div>

      {/* FILTRE discipline, groupé par catégorie */}
      <div className="mb-4">
        <DisciplineChips gender={filterGender} activeId={filterDisciplineId} onSelect={(id) => changeFilter(id, filterGender, filterEnv)} hasDataFor={hasDataFor} />
      </div>

      {/* SÉLECTEUR de tour */}
      <RoundPicker blocksForFilter={blocksForFilter} activeRound={activeRound} onSelect={selectRound} showAdd={effectiveMode === "edit"} />

      {/* CONTENU */}
      {isOverview ? (
        <div>
          <p className="text-xs mb-3 flex items-center gap-2" style={{ color: "var(--steel)" }}><Info size={13} /> Calculée automatiquement : meilleure marque de chaque athlète, tous tours confondus. Rien à saisir ici — modifie les tours individuels ci-dessus.</p>
          {overviewEntries.length > 1 && (
            <MarkScale discipline={filterDiscipline} points={overviewEntries.map((e) => ({ mark: e.mark, info: e.name }))} />
          )}
          <ResultsTable disciplineId={filterDisciplineId} entries={overviewEntries} onSelectAthlete={onSelectAthlete} />
        </div>
      ) : effectiveMode === "edit" ? (
        activeRound ? (
          editing || !activeBlock ? (
            <ResultBlockForm
              key={`${filterDisciplineId}-${filterGender}-${effectiveEnv}-${roundKey(activeRound)}-${editing}`}
              initial={activeBlock}
              athletes={athletes}
              lockedDisciplineId={filterDisciplineId}
              lockedGender={filterGender}
              lockedEnvironment={effectiveEnv}
              lockedRound={activeRound}
              onSave={(data) => { activeBlock ? onUpdateBlock(activeBlockIndex, data) : onSaveBlock(data); setEditing(false); }}
              onCancel={activeBlock ? () => setEditing(false) : undefined}
            />
          ) : (
            <div>
              {changingRound ? (
                <ChangeRoundForm current={activeRound} onApply={applyRoundChange} onCancel={() => setChangingRound(false)} />
              ) : (
                <div className="flex items-center justify-end gap-2 mb-2 flex-wrap">
                  <button onClick={() => setChangingRound(true)} className="focus-ring font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>Changer de tour</button>
                  <button onClick={() => setEditing(true)} className="focus-ring font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>Modifier</button>
                  <button onClick={() => { onDeleteBlock(activeBlockIndex); setActiveRound(defaultRound(blocksForFilter.filter((b) => b !== activeBlock))); }} className="focus-ring font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm flex items-center gap-1" style={{ border: "1px solid var(--line)", color: "var(--track)" }}><Trash2 size={11} /> Supprimer</button>
                </div>
              )}
              {activeBlock.entries.length > 1 && (
                <MarkScale discipline={filterDiscipline} points={activeBlock.entries.map((e) => ({ mark: e.mark, info: e.name }))} />
              )}
              <ResultsTable
                disciplineId={filterDisciplineId}
                entries={activeBlock.entries}
                onSelectAthlete={onSelectAthlete}
                onDeleteEntry={isAdmin ? (athleteId) => onDeleteEntry(filterDisciplineId, filterGender, effectiveEnv, activeRound, athleteId) : undefined}
              />
            </div>
          )
        ) : (
          <p className="text-sm" style={{ color: "var(--steel)" }}>Choisis un tour ci-dessus (bouton "Tour") pour commencer la saisie de {getLabel(filterDiscipline, filterGender)}.</p>
        )
      ) : activeBlock ? (
        <div>
          {activeBlock.entries.length > 1 && (
            <MarkScale discipline={filterDiscipline} points={activeBlock.entries.map((e) => ({ mark: e.mark, info: e.name }))} />
          )}
          <ResultsTable disciplineId={filterDisciplineId} entries={activeBlock.entries} onSelectAthlete={onSelectAthlete} />
        </div>
      ) : (
        <div className="rounded-md p-6 text-center" style={{ border: "1px dashed var(--line)", background: "var(--card)" }}>
          <p className="text-sm mb-3" style={{ color: "var(--steel)" }}>Aucun résultat saisi pour {getLabel(filterDiscipline, filterGender)} · {filterGender === "H" ? "Hommes" : "Femmes"}.</p>
          {canEdit && (
            <button onClick={() => onModeChange("edit")} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--track)", color: "#fff" }}>Passer en mode éditeur</button>
          )}
        </div>
      )}

      <p className="font-mono text-xs mt-6 flex items-center gap-2" style={{ color: "var(--steel)" }}><Info size={13} /> Les points jaunes indiquent des épreuves déjà saisies. Le statut "Saisi" se marque manuellement, ci-dessus.</p>
    </section>
  );
}

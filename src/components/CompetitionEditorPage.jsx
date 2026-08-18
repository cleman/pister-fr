import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, Info, MapPin, Pencil, Trash2 } from "lucide-react";
import { DISCIPLINES, getLabel } from "../data/disciplines";
import { TIERS } from "../data/competitions";
import { roundKey, defaultRound } from "../lib/rounds";
import { useAuth } from "../lib/auth";
import RoundPicker from "./RoundPicker";
import ResultBlockForm from "./ResultBlockForm";
import ResultsTable from "./ResultsTable";

export default function CompetitionEditorPage({
  comp, blocks, athletes, mode,
  initialDisciplineId, initialGender, initialRound,
  onModeChange, onBack, onSelectAthlete, onSaveBlock, onUpdateBlock, onDeleteBlock, onDeleteEntry, onToggleComplete,
}) {
  const { canEdit, isAdmin } = useAuth();
  const effectiveMode = canEdit ? mode : "view";
  const [filterGender, setFilterGender] = useState(initialGender || (blocks[0] ? blocks[0].gender : "H"));
  const [filterDisciplineId, setFilterDisciplineId] = useState(initialDisciplineId || (blocks[0] ? blocks[0].disciplineId : "100"));
  const blocksForFilter = blocks.filter((b) => b.disciplineId === filterDisciplineId && b.gender === filterGender);
  const [activeRound, setActiveRound] = useState(initialRound || defaultRound(blocksForFilter));
  const [editing, setEditing] = useState(false);

  const activeDiscipline = DISCIPLINES.find((d) => d.id === filterDisciplineId);
  const activeBlock = activeRound ? blocksForFilter.find((b) => roundKey(b.round) === roundKey(activeRound)) || null : null;
  const activeBlockIndex = activeBlock ? blocks.indexOf(activeBlock) : -1;

  function changeFilter(nextDisciplineId, nextGender) {
    setFilterDisciplineId(nextDisciplineId);
    setFilterGender(nextGender);
    const nb = blocks.filter((b) => b.disciplineId === nextDisciplineId && b.gender === nextGender);
    setActiveRound(defaultRound(nb));
    setEditing(false);
  }
  function selectRound(round) {
    setActiveRound(round);
    setEditing(false);
  }

  return (
    <section className="max-w-3xl mx-auto px-6 py-10">
      <button onClick={onBack} className="focus-ring flex items-center gap-2 font-mono text-xs uppercase tracking-wide mb-6" style={{ color: "var(--steel)" }}><ArrowLeft size={14} /> Retour au calendrier</button>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "var(--track)" }}>
            <span className="px-1.5 py-0.5 rounded-sm mr-2" style={TIERS[comp.tier].style}>{TIERS[comp.tier].label}</span>
            {new Date(comp.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <h1 className="font-display font-semibold text-3xl mb-1" style={{ color: "var(--ink)" }}>{comp.name}</h1>
          {comp.location && <p className="text-sm flex items-center gap-1" style={{ color: "var(--steel)" }}><MapPin size={13} />{comp.location}</p>}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
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

      {/* FILTRE discipline/sexe */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-sm overflow-hidden" style={{ border: "1px solid var(--ink)" }}>
          {["H", "F"].map((g) => (
            <button key={g} onClick={() => changeFilter(filterDisciplineId, g)} className="focus-ring font-display text-sm px-4 py-2"
              style={{ background: filterGender === g ? "var(--ink)" : "transparent", color: filterGender === g ? "#fff" : "var(--ink)" }}>{g === "H" ? "Hommes" : "Femmes"}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {DISCIPLINES.map((d) => {
            const has = blocks.some((b) => b.disciplineId === d.id && b.gender === filterGender);
            const activeChip = filterDisciplineId === d.id;
            return (
              <button key={d.id} onClick={() => changeFilter(d.id, filterGender)}
                className="focus-ring relative font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm"
                style={{ background: activeChip ? "var(--track)" : "var(--card)", color: activeChip ? "#fff" : "var(--ink)", border: "1px solid " + (activeChip ? "var(--track)" : "var(--line)") }}>
                {getLabel(d, filterGender)}
                {has && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: activeChip ? "#fff" : "var(--lane-yellow)" }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SÉLECTEUR de tour */}
      <RoundPicker blocksForFilter={blocksForFilter} activeRound={activeRound} onSelect={selectRound} showAdd={effectiveMode === "edit"} />

      {/* CONTENU */}
      {effectiveMode === "edit" ? (
        activeRound ? (
          editing || !activeBlock ? (
            <ResultBlockForm
              key={`${filterDisciplineId}-${filterGender}-${roundKey(activeRound)}-${editing}`}
              initial={activeBlock}
              athletes={athletes}
              lockedDisciplineId={filterDisciplineId}
              lockedGender={filterGender}
              lockedRound={activeRound}
              onSave={(data) => { activeBlock ? onUpdateBlock(activeBlockIndex, data) : onSaveBlock(data); setEditing(false); }}
              onCancel={activeBlock ? () => setEditing(false) : undefined}
            />
          ) : (
            <div>
              <div className="flex items-center justify-end gap-2 mb-2">
                <button onClick={() => setEditing(true)} className="focus-ring font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>Modifier</button>
                <button onClick={() => { onDeleteBlock(activeBlockIndex); setActiveRound(defaultRound(blocksForFilter.filter((b) => b !== activeBlock))); }} className="focus-ring font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm flex items-center gap-1" style={{ border: "1px solid var(--line)", color: "var(--track)" }}><Trash2 size={11} /> Supprimer</button>
              </div>
              <ResultsTable disciplineId={filterDisciplineId} entries={activeBlock.entries} onSelectAthlete={onSelectAthlete} onDeleteEntry={isAdmin ? (athleteId) => onDeleteEntry(filterDisciplineId, filterGender, activeRound, athleteId) : undefined} />
            </div>
          )
        ) : (
          <p className="text-sm" style={{ color: "var(--steel)" }}>Choisis un tour ci-dessus (bouton "Tour") pour commencer la saisie de {getLabel(activeDiscipline, filterGender)}.</p>
        )
      ) : activeBlock ? (
        <ResultsTable disciplineId={filterDisciplineId} entries={activeBlock.entries} onSelectAthlete={onSelectAthlete} />
      ) : (
        <div className="rounded-md p-6 text-center" style={{ border: "1px dashed var(--line)", background: "var(--card)" }}>
          <p className="text-sm mb-3" style={{ color: "var(--steel)" }}>Aucun résultat saisi pour {getLabel(activeDiscipline, filterGender)} · {filterGender === "H" ? "Hommes" : "Femmes"}.</p>
          {canEdit && (
            <button onClick={() => onModeChange("edit")} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--track)", color: "#fff" }}>Passer en mode éditeur</button>
          )}
        </div>
      )}

      <p className="font-mono text-xs mt-6 flex items-center gap-2" style={{ color: "var(--steel)" }}><Info size={13} /> Les points jaunes indiquent des épreuves déjà saisies. Le statut "Saisi" se marque manuellement, ci-dessus.</p>
    </section>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { Flag } from "lucide-react";

import Header from "./components/Header";
import ClassementPage from "./components/ClassementPage";
import CalendarTab from "./components/CalendarTab";
import CompetitionEditorPage from "./components/CompetitionEditorPage";
import AthleteProfilePanel from "./components/AthleteProfilePanel";
import AdminPage from "./components/AdminPage";

import { storage } from "./lib/storage";
import { useAuth } from "./lib/auth";
import { uid } from "./lib/util";
import { resolveBlockEntries, resolveAthlete } from "./lib/athletes";
import { compareMarks } from "./lib/marks";
import { upsertBlockEntry, removeBlockEntry } from "./lib/blocks";
import { roundKey, roundLabel } from "./lib/rounds";
import { DISCIPLINES, getLabel } from "./data/disciplines";
import { DEFAULT_COMPETITIONS } from "./data/competitions";
import { buildDefaultSeed } from "./data/seed";

export default function App() {
  const { isAdmin, user } = useAuth();
  const [topTab, setTopTab] = useState("classement");
  const [gender, setGender] = useState("H");
  const [disciplineId, setDisciplineId] = useState("100");
  const [environment, setEnvironment] = useState("outdoor");

  const [loaded, setLoaded] = useState(false);
  const [competitions, setCompetitions] = useState(DEFAULT_COMPETITIONS);
  const [resultsStore, setResultsStore] = useState({});
  const [athletes, setAthletes] = useState([]);
  const [trash, setTrash] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  // Miroirs synchrones de l'état ci-dessus. Nécessaires car plusieurs
  // écritures peuvent s'enchaîner rapidement (ex. import en masse) sans
  // laisser le temps à React de re-rendre entre deux appels : lire
  // directement l'état React dans ce cas donnerait une valeur obsolète
  // (celle d'avant le début de la boucle), et chaque écriture écraserait
  // la précédente au lieu de s'accumuler.
  const competitionsRef = useRef(DEFAULT_COMPETITIONS);
  const resultsStoreRef = useRef({});
  const athletesRef = useRef([]);
  const trashRef = useRef([]);
  const auditLogRef = useRef([]);

  const [activeCompId, setActiveCompId] = useState(null);
  const [calMode, setCalMode] = useState("view");
  const [initialCompFilter, setInitialCompFilter] = useState(null);
  const [athleteProfileId, setAthleteProfileId] = useState(null);

  // Chargement initial depuis le stockage (voir src/lib/storage.js)
  useEffect(() => {
    (async () => {
      const compRes = await storage.get("competitions-list");
      const resRes = await storage.get("results-store");
      const athRes = await storage.get("athletes-list");
      const trashRes = await storage.get("trash-list");
      const auditRes = await storage.get("audit-log");

      if (compRes && resRes && athRes) {
        const comps = JSON.parse(compRes.value);
        const res = JSON.parse(resRes.value);
        const ath = JSON.parse(athRes.value);
        const trashList = trashRes ? JSON.parse(trashRes.value) : [];
        const auditList = auditRes ? JSON.parse(auditRes.value) : [];
        setCompetitions(comps);
        setResultsStore(res);
        setAthletes(ath);
        setTrash(trashList);
        setAuditLog(auditList);
        competitionsRef.current = comps;
        resultsStoreRef.current = res;
        athletesRef.current = ath;
        trashRef.current = trashList;
        auditLogRef.current = auditList;
      } else {
        const seed = buildDefaultSeed();
        setCompetitions(DEFAULT_COMPETITIONS);
        setResultsStore(seed.results);
        setAthletes(seed.athletes);
        competitionsRef.current = DEFAULT_COMPETITIONS;
        resultsStoreRef.current = seed.results;
        athletesRef.current = seed.athletes;
        await storage.set("competitions-list", JSON.stringify(DEFAULT_COMPETITIONS));
        await storage.set("results-store", JSON.stringify(seed.results));
        await storage.set("athletes-list", JSON.stringify(seed.athletes));
        await storage.set("trash-list", JSON.stringify([]));
        await storage.set("audit-log", JSON.stringify([]));
      }
      setLoaded(true);
    })();
  }, []);

  async function persistCompetitions(list) {
    competitionsRef.current = list;
    setCompetitions(list);
    await storage.set("competitions-list", JSON.stringify(list));
  }
  async function persistResults(store) {
    resultsStoreRef.current = store;
    setResultsStore(store);
    await storage.set("results-store", JSON.stringify(store));
  }
  async function persistAthletes(list) {
    athletesRef.current = list;
    setAthletes(list);
    await storage.set("athletes-list", JSON.stringify(list));
  }
  async function persistTrash(list) {
    trashRef.current = list;
    setTrash(list);
    await storage.set("trash-list", JSON.stringify(list));
  }
  async function persistAuditLog(list) {
    auditLogRef.current = list;
    setAuditLog(list);
    await storage.set("audit-log", JSON.stringify(list));
  }
  function logAudit(action, label) {
    const entry = { id: uid(), at: new Date().toISOString(), by: user ? user.email : "?", action, label };
    persistAuditLog([entry, ...auditLogRef.current].slice(0, 300));
  }

  function toggleFollow(compId) {
    persistCompetitions(competitionsRef.current.map((c) => (c.id === compId ? { ...c, following: !c.following } : c)));
  }
  function toggleComplete(compId) {
    const comp = competitionsRef.current.find((c) => c.id === compId);
    persistCompetitions(competitionsRef.current.map((c) => (c.id === compId ? { ...c, manualComplete: !c.manualComplete } : c)));
    if (comp) logAudit(comp.manualComplete ? "Compétition rouverte" : "Compétition marquée complète", comp.name);
  }
  async function addCompetition(data) {
    const id = uid();
    await persistCompetitions([...competitionsRef.current, { id, following: false, manualComplete: false, resultsUrl: "", ...data }]);
    logAudit("Ajout compétition", data.name);
    return id;
  }
  async function updateCompetitionMeta(compId, patch) {
    const comp = competitionsRef.current.find((c) => c.id === compId);
    if (!comp) return;
    await persistCompetitions(competitionsRef.current.map((c) => (c.id === compId ? { ...c, ...patch } : c)));
    logAudit("Modification infos compétition", comp.name);
  }
  async function changeBlockRound(compId, index, newRound) {
    const blocks = resultsStoreRef.current[compId] || [];
    const block = blocks[index];
    if (!block) return false;
    const conflict = blocks.some((b, i) => i !== index
      && b.disciplineId === block.disciplineId && b.gender === block.gender
      && (b.environment || "outdoor") === (block.environment || "outdoor")
      && roundKey(b.round) === roundKey(newRound));
    if (conflict) return false;
    const updated = blocks.map((b, i) => (i === index ? { ...b, round: newRound } : b));
    await persistResults({ ...resultsStoreRef.current, [compId]: updated });
    const disc = DISCIPLINES.find((d) => d.id === block.disciplineId);
    logAudit("Changement de tour", `${disc ? getLabel(disc, block.gender) : block.disciplineId} → ${roundLabel(newRound)}`);
    return true;
  }
  function saveBlock(compId, rawBlock) {
    const { entries, registry } = resolveBlockEntries(rawBlock.entries, athletesRef.current, rawBlock.gender);
    persistAthletes(registry);
    const current = resultsStoreRef.current[compId] || [];
    persistResults({ ...resultsStoreRef.current, [compId]: [...current, { disciplineId: rawBlock.disciplineId, gender: rawBlock.gender, environment: rawBlock.environment || "outdoor", round: rawBlock.round, entries }] });
    const disc = DISCIPLINES.find((d) => d.id === rawBlock.disciplineId);
    const comp = competitionsRef.current.find((c) => c.id === compId);
    logAudit("Ajout d'un tableau de résultats", `${disc ? getLabel(disc, rawBlock.gender) : rawBlock.disciplineId} · ${roundLabel(rawBlock.round)} (${comp ? comp.name : compId})`);
  }
  function updateBlock(compId, index, rawBlock) {
    const { entries, registry } = resolveBlockEntries(rawBlock.entries, athletesRef.current, rawBlock.gender);
    persistAthletes(registry);
    const current = [...(resultsStoreRef.current[compId] || [])];
    current[index] = { disciplineId: rawBlock.disciplineId, gender: rawBlock.gender, environment: rawBlock.environment || "outdoor", round: rawBlock.round, entries };
    persistResults({ ...resultsStoreRef.current, [compId]: current });
    const disc = DISCIPLINES.find((d) => d.id === rawBlock.disciplineId);
    const comp = competitionsRef.current.find((c) => c.id === compId);
    logAudit("Modification d'un tableau de résultats", `${disc ? getLabel(disc, rawBlock.gender) : rawBlock.disciplineId} (${comp ? comp.name : compId})`);
  }

  async function deleteBlock(compId, index) {
    const blocks = resultsStoreRef.current[compId] || [];
    const block = blocks[index];
    if (!block) return;
    await persistResults({ ...resultsStoreRef.current, [compId]: blocks.filter((_, i) => i !== index) });
    const disc = DISCIPLINES.find((d) => d.id === block.disciplineId);
    const comp = competitionsRef.current.find((c) => c.id === compId);
    const label = `${disc ? getLabel(disc, block.gender) : block.disciplineId} · ${roundLabel(block.round)} (${comp ? comp.name : compId})`;
    await persistTrash([{ id: uid(), kind: "block", deletedAt: new Date().toISOString(), deletedBy: user ? user.email : "?", label, data: { compId, block } }, ...trashRef.current]);
    logAudit("Suppression d'un tableau de résultats", label);
  }

  async function deleteCompetition(compId) {
    const comp = competitionsRef.current.find((c) => c.id === compId);
    if (!comp) return;
    const blocks = resultsStoreRef.current[compId] || [];
    await persistCompetitions(competitionsRef.current.filter((c) => c.id !== compId));
    const newResults = { ...resultsStoreRef.current };
    delete newResults[compId];
    await persistResults(newResults);
    await persistTrash([{ id: uid(), kind: "competition", deletedAt: new Date().toISOString(), deletedBy: user ? user.email : "?", label: comp.name, data: { competition: comp, blocks } }, ...trashRef.current]);
    logAudit("Suppression compétition", comp.name);
  }

  async function restoreBackup(payload) {
    await persistCompetitions(payload.competitions);
    await persistResults(payload.resultsStore);
    await persistAthletes(payload.athletes);
    logAudit("Restauration d'une sauvegarde", `${payload.competitions.length} compétitions`);
  }

  /* Ajoute une performance pour un athlète déjà identifié, en créant la
     compétition si besoin (competitionId absent) et/ou le bloc discipline/
     sexe/environnement/tour s'il n'existe pas encore. Remplace l'entrée
     existante de cet athlète dans le bloc si elle y était déjà (ré-import).
     Renvoie l'id de la compétition utilisée (utile pour regrouper plusieurs
     lignes d'un même import en masse sur la même compétition nouvellement
     créée). */
  async function addAthletePerformance(payload) {
    let compId = payload.competitionId;
    if (!compId) {
      compId = await addCompetition(payload.newCompetition);
    }
    const discipline = DISCIPLINES.find((d) => d.id === payload.disciplineId);
    const env = payload.environment || "outdoor";
    const currentBlocks = resultsStoreRef.current[compId] || [];
    const idx = currentBlocks.findIndex(
      (b) => b.disciplineId === payload.disciplineId && b.gender === payload.gender && (b.environment || "outdoor") === env && roundKey(b.round) === roundKey(payload.round)
    );
    const entry = {
      name: payload.athleteName,
      club: payload.athleteClub || "",
      mark: payload.status ? null : payload.mark,
      wind: payload.status ? null : (payload.wind ?? null),
      status: payload.status || null,
      athleteId: payload.athleteId,
      place: payload.place || null,
    };
    const newEntries = upsertBlockEntry(discipline, idx === -1 ? [] : currentBlocks[idx].entries, entry);
    const newBlock = { disciplineId: payload.disciplineId, gender: payload.gender, environment: env, round: payload.round, entries: newEntries };
    const newBlocks = idx === -1 ? [...currentBlocks, newBlock] : currentBlocks.map((b, i) => (i === idx ? newBlock : b));
    await persistResults({ ...resultsStoreRef.current, [compId]: newBlocks });
    logAudit("Ajout performance", `${payload.athleteName} · ${discipline ? getLabel(discipline, payload.gender) : payload.disciplineId}`);

    // renseigne le sexe de l'athlète si ce n'était pas encore fait
    const athlete = athletesRef.current.find((a) => a.id === payload.athleteId);
    if (athlete && !athlete.gender) {
      await persistAthletes(athletesRef.current.map((a) => (a.id === payload.athleteId ? { ...a, gender: payload.gender } : a)));
    }
    return compId;
  }

  /* Même chose que addAthletePerformance, mais à partir d'un simple nom
     (import d'un bilan par discipline) : résout/crée l'athlète d'abord. */
  async function addBilanRow(payload) {
    const r = resolveAthlete(payload.athleteName, payload.athleteClub, athletesRef.current);
    let registry = athletesRef.current;
    if (r.isNew) registry = [...registry, { id: r.id, canonicalName: r.canonicalName, club: payload.athleteClub || "", gender: payload.gender || null }];
    else registry = registry.map((a) => (a.id === r.id ? { ...a, club: payload.athleteClub || a.club, gender: a.gender || payload.gender || null } : a));
    await persistAthletes(registry);
    return addAthletePerformance({ ...payload, athleteId: r.id, athleteName: r.canonicalName });
  }

  async function setAthleteGender(athleteId, newGender) {
    const athlete = athletesRef.current.find((a) => a.id === athleteId);
    await persistAthletes(athletesRef.current.map((a) => (a.id === athleteId ? { ...a, gender: newGender } : a)));
    if (athlete) logAudit("Modification sexe athlète", `${athlete.canonicalName} → ${newGender}`);
  }

  /* Supprime uniquement l'entrée d'un athlète dans un bloc (discipline +
     sexe + environnement + tour) donné d'une compétition, sans toucher aux
     autres athlètes du même bloc. Supprime le bloc entier s'il ne reste
     plus personne. Passe par la corbeille (restaurable par un admin). */
  async function deleteAthletePerformance(compId, disciplineId, genderKey, environment2, round, athleteId) {
    const blocks = resultsStoreRef.current[compId] || [];
    const env = environment2 || "outdoor";
    const idx = blocks.findIndex((b) => b.disciplineId === disciplineId && b.gender === genderKey && (b.environment || "outdoor") === env && roundKey(b.round) === roundKey(round));
    if (idx === -1) return;
    const discipline = DISCIPLINES.find((d) => d.id === disciplineId);
    const entry = blocks[idx].entries.find((e) => e.athleteId === athleteId);
    if (!entry) return;
    const remaining = removeBlockEntry(blocks[idx].entries, athleteId);
    let newBlocks;
    if (remaining.length === 0) {
      newBlocks = blocks.filter((_, i) => i !== idx);
    } else {
      newBlocks = blocks.map((b, i) => (i === idx ? { ...b, entries: remaining } : b));
    }
    await persistResults({ ...resultsStoreRef.current, [compId]: newBlocks });

    const comp = competitionsRef.current.find((c) => c.id === compId);
    const label = `${entry.name} · ${discipline ? getLabel(discipline, genderKey) : disciplineId} (${comp ? comp.name : compId})`;
    await persistTrash([{ id: uid(), kind: "performance", deletedAt: new Date().toISOString(), deletedBy: user ? user.email : "?", label, data: { compId, disciplineId, gender: genderKey, environment: env, round, entry } }, ...trashRef.current]);
    logAudit("Suppression performance", label);
  }

  async function restoreTrashItem(trashId) {
    const item = trashRef.current.find((t) => t.id === trashId);
    if (!item) return;
    if (item.kind === "competition") {
      await persistCompetitions([...competitionsRef.current, item.data.competition]);
      await persistResults({ ...resultsStoreRef.current, [item.data.competition.id]: item.data.blocks });
    } else if (item.kind === "performance") {
      const { compId, disciplineId, gender: g, environment: env, round, entry } = item.data;
      const discipline = DISCIPLINES.find((d) => d.id === disciplineId);
      const blocks = resultsStoreRef.current[compId] || [];
      const idx = blocks.findIndex((b) => b.disciplineId === disciplineId && b.gender === g && (b.environment || "outdoor") === (env || "outdoor") && roundKey(b.round) === roundKey(round));
      let newBlocks;
      if (idx === -1) {
        newBlocks = [...blocks, { disciplineId, gender: g, environment: env || "outdoor", round, entries: [{ ...entry, place: 1 }] }];
      } else {
        const merged = [...blocks[idx].entries, entry].sort((a, b) => compareMarks(discipline, a.mark, b.mark)).map((e, i) => ({ ...e, place: i + 1 }));
        newBlocks = blocks.map((b, i) => (i === idx ? { ...b, entries: merged } : b));
      }
      await persistResults({ ...resultsStoreRef.current, [compId]: newBlocks });
    } else if (item.kind === "block") {
      const { compId, block } = item.data;
      const blocks = resultsStoreRef.current[compId] || [];
      await persistResults({ ...resultsStoreRef.current, [compId]: [...blocks, block] });
    }
    await persistTrash(trashRef.current.filter((t) => t.id !== trashId));
    logAudit("Restauration depuis la corbeille", item.label);
  }
  async function permanentlyDeleteTrashItem(trashId) {
    await persistTrash(trashRef.current.filter((t) => t.id !== trashId));
  }
  async function emptyTrash() {
    await persistTrash([]);
    logAudit("Corbeille vidée", `${trashRef.current.length} élément(s)`);
  }

  const activeComp = competitions.find((c) => c.id === activeCompId) || null;
  const activeBlocks = activeCompId ? resultsStore[activeCompId] || [] : [];

  function goCalendarHome() {
    setActiveCompId(null);
    setCalMode("view");
    setInitialCompFilter(null);
  }
  function openCompetition(compId, mode, disciplineId2, gender2, round2, environment2) {
    setActiveCompId(compId);
    setCalMode(mode);
    setInitialCompFilter(disciplineId2 ? { disciplineId: disciplineId2, gender: gender2, round: round2 || null, environment: environment2 || "outdoor" } : null);
  }

  return (
    <div className="min-h-screen w-full">
      <Header
        topTab={topTab}
        onSetClassement={() => setTopTab("classement")}
        onSetCalendrier={() => { setTopTab("calendrier"); goCalendarHome(); }}
        onSetAdmin={() => setTopTab("admin")}
        athletes={athletes}
        onSelectAthlete={(athleteId) => setAthleteProfileId(athleteId)}
      />

      {!loaded ? (
        <p className="max-w-5xl mx-auto px-6 py-10 font-mono text-sm" style={{ color: "var(--steel)" }}>Chargement…</p>
      ) : topTab === "admin" ? (
        isAdmin ? (
          <AdminPage
            competitions={competitions}
            resultsStore={resultsStore}
            athletes={athletes}
            trash={trash}
            auditLog={auditLog}
            onRestoreBackup={restoreBackup}
            onRestoreTrashItem={restoreTrashItem}
            onPermanentlyDeleteTrashItem={permanentlyDeleteTrashItem}
            onEmptyTrash={emptyTrash}
          />
        ) : (
          <p className="max-w-5xl mx-auto px-6 py-10 font-mono text-sm" style={{ color: "var(--steel)" }}>Accès réservé aux administrateurs.</p>
        )
      ) : topTab === "calendrier" ? (
        activeComp ? (
          <CompetitionEditorPage
            comp={activeComp}
            blocks={activeBlocks}
            athletes={athletes}
            mode={calMode}
            initialDisciplineId={initialCompFilter && initialCompFilter.disciplineId}
            initialGender={initialCompFilter && initialCompFilter.gender}
            initialRound={initialCompFilter && initialCompFilter.round}
            initialEnvironment={initialCompFilter && initialCompFilter.environment}
            onModeChange={setCalMode}
            onBack={goCalendarHome}
            onSelectAthlete={(athleteId) => setAthleteProfileId(athleteId)}
            onSaveBlock={(block) => saveBlock(activeComp.id, block)}
            onUpdateBlock={(i, block) => updateBlock(activeComp.id, i, block)}
            onDeleteBlock={(i) => deleteBlock(activeComp.id, i)}
            onDeleteEntry={(disciplineId2, gender2, environment2, round2, athleteId) => deleteAthletePerformance(activeComp.id, disciplineId2, gender2, environment2, round2, athleteId)}
            onToggleComplete={() => toggleComplete(activeComp.id)}
            onUpdateMeta={(patch) => updateCompetitionMeta(activeComp.id, patch)}
            onChangeRound={(index, newRound) => changeBlockRound(activeComp.id, index, newRound)}
          />
        ) : (
          <CalendarTab
            loaded={loaded}
            competitions={competitions}
            resultsStore={resultsStore}
            onOpen={(id, mode) => openCompetition(id, mode)}
            onToggleFollow={toggleFollow}
            onAddCompetition={addCompetition}
            onDeleteCompetition={deleteCompetition}
          />
        )
      ) : (
        <ClassementPage
          gender={gender}
          disciplineId={disciplineId}
          environment={environment}
          onSetGender={setGender}
          onSetDiscipline={setDisciplineId}
          onSetEnvironment={setEnvironment}
          resultsStore={resultsStore}
          athletes={athletes}
          competitions={competitions}
          onSelectAthlete={(athleteId) => setAthleteProfileId(athleteId)}
          onGoCalendar={() => setTopTab("calendrier")}
          onOpenCompetition={(compId) => { setTopTab("calendrier"); openCompetition(compId, "view"); }}
          onImportBilan={addBilanRow}
        />
      )}

      <footer className="border-t" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-xs" style={{ color: "var(--steel)" }}>
          <span className="font-mono">© 2026 Piste FR</span>
          <span className="flex items-center gap-1"><Flag size={12} /> Saisie manuelle + collage de texte</span>
        </div>
      </footer>

      {athleteProfileId && (
        <AthleteProfilePanel
          athleteId={athleteProfileId}
          athletes={athletes}
          resultsStore={resultsStore}
          competitions={competitions}
          onClose={() => setAthleteProfileId(null)}
          onOpenCompetition={(compId, disciplineId2, gender2, round2, environment2) => {
            setAthleteProfileId(null);
            setTopTab("calendrier");
            openCompetition(compId, "view", disciplineId2, gender2, round2, environment2);
          }}
          onAddPerformance={addAthletePerformance}
          onSetGender={setAthleteGender}
          onDeletePerformance={(compId, disciplineId2, gender2, environment2, round2) => deleteAthletePerformance(compId, disciplineId2, gender2, environment2, round2, athleteProfileId)}
        />
      )}
    </div>
  );
}

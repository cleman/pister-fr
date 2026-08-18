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
import { resolveBlockEntries } from "./lib/athletes";
import { compareMarks } from "./lib/marks";
import { roundKey } from "./lib/rounds";
import { DISCIPLINES } from "./data/disciplines";
import { DEFAULT_COMPETITIONS } from "./data/competitions";
import { buildDefaultSeed } from "./data/seed";

export default function App() {
  const { isAdmin } = useAuth();
  const [topTab, setTopTab] = useState("classement");
  const [gender, setGender] = useState("H");
  const [disciplineId, setDisciplineId] = useState("100");

  const [loaded, setLoaded] = useState(false);
  const [competitions, setCompetitions] = useState(DEFAULT_COMPETITIONS);
  const [resultsStore, setResultsStore] = useState({});
  const [athletes, setAthletes] = useState([]);
  // Miroirs synchrones de l'état ci-dessus. Nécessaires car plusieurs
  // écritures peuvent s'enchaîner rapidement (ex. import en masse) sans
  // laisser le temps à React de re-rendre entre deux appels : lire
  // directement `competitions`/`resultsStore` dans ce cas donnerait une
  // valeur obsolète (celle d'avant le début de la boucle), et chaque
  // écriture écraserait la précédente au lieu de s'accumuler.
  const competitionsRef = useRef(DEFAULT_COMPETITIONS);
  const resultsStoreRef = useRef({});
  const athletesRef = useRef([]);
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

      if (compRes && resRes && athRes) {
        const comps = JSON.parse(compRes.value);
        const res = JSON.parse(resRes.value);
        const ath = JSON.parse(athRes.value);
        setCompetitions(comps);
        setResultsStore(res);
        setAthletes(ath);
        competitionsRef.current = comps;
        resultsStoreRef.current = res;
        athletesRef.current = ath;
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

  function toggleFollow(compId) {
    persistCompetitions(competitionsRef.current.map((c) => (c.id === compId ? { ...c, following: !c.following } : c)));
  }
  function toggleComplete(compId) {
    persistCompetitions(competitionsRef.current.map((c) => (c.id === compId ? { ...c, manualComplete: !c.manualComplete } : c)));
  }
  async function addCompetition(data) {
    const id = uid();
    await persistCompetitions([...competitionsRef.current, { id, following: false, manualComplete: false, ...data }]);
    return id;
  }
  function saveBlock(compId, rawBlock) {
    const { entries, registry } = resolveBlockEntries(rawBlock.entries, athletesRef.current, rawBlock.gender);
    persistAthletes(registry);
    const current = resultsStoreRef.current[compId] || [];
    persistResults({ ...resultsStoreRef.current, [compId]: [...current, { disciplineId: rawBlock.disciplineId, gender: rawBlock.gender, round: rawBlock.round, entries }] });
  }
  function updateBlock(compId, index, rawBlock) {
    const { entries, registry } = resolveBlockEntries(rawBlock.entries, athletesRef.current, rawBlock.gender);
    persistAthletes(registry);
    const current = [...(resultsStoreRef.current[compId] || [])];
    current[index] = { disciplineId: rawBlock.disciplineId, gender: rawBlock.gender, round: rawBlock.round, entries };
    persistResults({ ...resultsStoreRef.current, [compId]: current });
  }
  function deleteBlock(compId, index) {
    const current = (resultsStoreRef.current[compId] || []).filter((_, i) => i !== index);
    persistResults({ ...resultsStoreRef.current, [compId]: current });
  }
  async function deleteCompetition(compId) {
    await persistCompetitions(competitionsRef.current.filter((c) => c.id !== compId));
    const newResults = { ...resultsStoreRef.current };
    delete newResults[compId];
    await persistResults(newResults);
  }
  async function restoreBackup(payload) {
    await persistCompetitions(payload.competitions);
    await persistResults(payload.resultsStore);
    await persistAthletes(payload.athletes);
  }

  /* Ajoute une performance pour un athlète déjà identifié, en créant la
     compétition si besoin (competitionId absent) et/ou le bloc discipline/
     sexe/tour s'il n'existe pas encore. Remplace l'entrée existante de cet
     athlète dans le bloc si elle y était déjà (ré-import). Renvoie l'id de
     la compétition utilisée (utile pour regrouper plusieurs lignes d'un
     même import en masse sur la même compétition nouvellement créée). */
  async function addAthletePerformance(payload) {
    let compId = payload.competitionId;
    if (!compId) {
      compId = await addCompetition(payload.newCompetition);
    }
    const discipline = DISCIPLINES.find((d) => d.id === payload.disciplineId);
    const currentBlocks = resultsStoreRef.current[compId] || [];
    const idx = currentBlocks.findIndex(
      (b) => b.disciplineId === payload.disciplineId && b.gender === payload.gender && roundKey(b.round) === roundKey(payload.round)
    );
    const others = idx === -1 ? [] : currentBlocks[idx].entries.filter((e) => e.athleteId !== payload.athleteId);
    const withNew = [...others, {
      name: payload.athleteName,
      club: payload.athleteClub || "",
      mark: payload.mark,
      wind: payload.wind ?? null,
      athleteId: payload.athleteId,
    }];
    const sorted = withNew
      .sort((a, b) => compareMarks(discipline, a.mark, b.mark))
      .map((e, i) => ({ ...e, place: i + 1 }));
    const newBlock = { disciplineId: payload.disciplineId, gender: payload.gender, round: payload.round, entries: sorted };
    const newBlocks = idx === -1 ? [...currentBlocks, newBlock] : currentBlocks.map((b, i) => (i === idx ? newBlock : b));
    await persistResults({ ...resultsStoreRef.current, [compId]: newBlocks });

    // renseigne le sexe de l'athlète si ce n'était pas encore fait
    const athlete = athletesRef.current.find((a) => a.id === payload.athleteId);
    if (athlete && !athlete.gender) {
      await persistAthletes(athletesRef.current.map((a) => (a.id === payload.athleteId ? { ...a, gender: payload.gender } : a)));
    }
    return compId;
  }

  async function setAthleteGender(athleteId, newGender) {
    await persistAthletes(athletesRef.current.map((a) => (a.id === athleteId ? { ...a, gender: newGender } : a)));
  }

  /* Supprime uniquement l'entrée d'un athlète dans un bloc (discipline +
     sexe + tour) donné d'une compétition, sans toucher aux autres athlètes
     du même bloc. Supprime le bloc entier s'il ne reste plus personne. */
  async function deleteAthletePerformance(compId, disciplineId, genderKey, round, athleteId) {
    const blocks = resultsStoreRef.current[compId] || [];
    const idx = blocks.findIndex((b) => b.disciplineId === disciplineId && b.gender === genderKey && roundKey(b.round) === roundKey(round));
    if (idx === -1) return;
    const discipline = DISCIPLINES.find((d) => d.id === disciplineId);
    const remaining = blocks[idx].entries.filter((e) => e.athleteId !== athleteId);
    let newBlocks;
    if (remaining.length === 0) {
      newBlocks = blocks.filter((_, i) => i !== idx);
    } else {
      const resorted = remaining.sort((a, b) => compareMarks(discipline, a.mark, b.mark)).map((e, i) => ({ ...e, place: i + 1 }));
      newBlocks = blocks.map((b, i) => (i === idx ? { ...b, entries: resorted } : b));
    }
    await persistResults({ ...resultsStoreRef.current, [compId]: newBlocks });
  }

  const activeComp = competitions.find((c) => c.id === activeCompId) || null;
  const activeBlocks = activeCompId ? resultsStore[activeCompId] || [] : [];

  function goCalendarHome() {
    setActiveCompId(null);
    setCalMode("view");
    setInitialCompFilter(null);
  }
  function openCompetition(compId, mode, disciplineId2, gender2, round2) {
    setActiveCompId(compId);
    setCalMode(mode);
    setInitialCompFilter(disciplineId2 ? { disciplineId: disciplineId2, gender: gender2, round: round2 || null } : null);
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
          <AdminPage competitions={competitions} resultsStore={resultsStore} athletes={athletes} onRestoreBackup={restoreBackup} />
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
            onModeChange={setCalMode}
            onBack={goCalendarHome}
            onSelectAthlete={(athleteId) => setAthleteProfileId(athleteId)}
            onSaveBlock={(block) => saveBlock(activeComp.id, block)}
            onUpdateBlock={(i, block) => updateBlock(activeComp.id, i, block)}
            onDeleteBlock={(i) => deleteBlock(activeComp.id, i)}
            onDeleteEntry={(disciplineId2, gender2, round2, athleteId) => deleteAthletePerformance(activeComp.id, disciplineId2, gender2, round2, athleteId)}
            onToggleComplete={() => toggleComplete(activeComp.id)}
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
          onSetGender={setGender}
          onSetDiscipline={setDisciplineId}
          resultsStore={resultsStore}
          athletes={athletes}
          competitions={competitions}
          onSelectAthlete={(athleteId) => setAthleteProfileId(athleteId)}
          onGoCalendar={() => setTopTab("calendrier")}
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
          onOpenCompetition={(compId, disciplineId2, gender2, round2) => {
            setAthleteProfileId(null);
            setTopTab("calendrier");
            openCompetition(compId, "view", disciplineId2, gender2, round2);
          }}
          onAddPerformance={addAthletePerformance}
          onSetGender={setAthleteGender}
          onDeletePerformance={(compId, disciplineId2, gender2, round2) => deleteAthletePerformance(compId, disciplineId2, gender2, round2, athleteProfileId)}
        />
      )}
    </div>
  );
}

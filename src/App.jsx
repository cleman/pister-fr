import React, { useEffect, useState } from "react";
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
        setCompetitions(JSON.parse(compRes.value));
        setResultsStore(JSON.parse(resRes.value));
        setAthletes(JSON.parse(athRes.value));
      } else {
        const seed = buildDefaultSeed();
        setCompetitions(DEFAULT_COMPETITIONS);
        setResultsStore(seed.results);
        setAthletes(seed.athletes);
        await storage.set("competitions-list", JSON.stringify(DEFAULT_COMPETITIONS));
        await storage.set("results-store", JSON.stringify(seed.results));
        await storage.set("athletes-list", JSON.stringify(seed.athletes));
      }
      setLoaded(true);
    })();
  }, []);

  async function persistCompetitions(list) {
    setCompetitions(list);
    await storage.set("competitions-list", JSON.stringify(list));
  }
  async function persistResults(store) {
    setResultsStore(store);
    await storage.set("results-store", JSON.stringify(store));
  }
  async function persistAthletes(list) {
    setAthletes(list);
    await storage.set("athletes-list", JSON.stringify(list));
  }

  function toggleFollow(compId) {
    persistCompetitions(competitions.map((c) => (c.id === compId ? { ...c, following: !c.following } : c)));
  }
  function toggleComplete(compId) {
    persistCompetitions(competitions.map((c) => (c.id === compId ? { ...c, manualComplete: !c.manualComplete } : c)));
  }
  function addCompetition(data) {
    persistCompetitions([...competitions, { id: uid(), following: false, manualComplete: false, ...data }]);
  }
  function saveBlock(compId, rawBlock) {
    const { entries, registry } = resolveBlockEntries(rawBlock.entries, athletes);
    persistAthletes(registry);
    const current = resultsStore[compId] || [];
    persistResults({ ...resultsStore, [compId]: [...current, { disciplineId: rawBlock.disciplineId, gender: rawBlock.gender, round: rawBlock.round, entries }] });
  }
  function updateBlock(compId, index, rawBlock) {
    const { entries, registry } = resolveBlockEntries(rawBlock.entries, athletes);
    persistAthletes(registry);
    const current = [...(resultsStore[compId] || [])];
    current[index] = { disciplineId: rawBlock.disciplineId, gender: rawBlock.gender, round: rawBlock.round, entries };
    persistResults({ ...resultsStore, [compId]: current });
  }
  function deleteBlock(compId, index) {
    const current = (resultsStore[compId] || []).filter((_, i) => i !== index);
    persistResults({ ...resultsStore, [compId]: current });
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
          <AdminPage competitions={competitions} resultsStore={resultsStore} athletes={athletes} />
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
        />
      )}
    </div>
  );
}

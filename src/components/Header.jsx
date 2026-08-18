import React from "react";
import { CalendarDays, ShieldCheck } from "lucide-react";
import AthleteSearch from "./AthleteSearch";
import LoginPanel from "./LoginPanel";
import { useAuth } from "../lib/auth";

export default function Header({ topTab, onSetClassement, onSetCalendrier, onSetAdmin, athletes, onSelectAthlete }) {
  const { isAdmin } = useAuth();
  return (
    <header className="sticky top-0 z-20 border-b" style={{ background: "var(--ink)", borderColor: "var(--ink)" }}>
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <button onClick={onSetClassement} className="focus-ring flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm flex items-center justify-center font-display font-bold text-sm" style={{ background: "var(--track)", color: "#fff" }}>10</div>
          <span className="font-display text-white text-lg tracking-wide">PISTE&nbsp;FR</span>
        </button>
        <nav className="flex rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.25)" }}>
          <button onClick={onSetClassement} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2"
            style={{ background: topTab === "classement" ? "var(--track)" : "transparent", color: "#fff" }}>Classement</button>
          <button onClick={onSetCalendrier} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 flex items-center gap-1"
            style={{ background: topTab === "calendrier" ? "var(--track)" : "transparent", color: "#fff" }}><CalendarDays size={13} /> Calendrier</button>
          {isAdmin && (
            <button onClick={onSetAdmin} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 flex items-center gap-1"
              style={{ background: topTab === "admin" ? "var(--track)" : "transparent", color: "#fff" }}><ShieldCheck size={13} /> Admin</button>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <AthleteSearch athletes={athletes} onSelectAthlete={onSelectAthlete} />
          <LoginPanel />
        </div>
      </div>
    </header>
  );
}

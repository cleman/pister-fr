import React, { useState } from "react";
import { LogIn, LogOut, ShieldCheck, User, X } from "lucide-react";
import { useAuth } from "../lib/auth";

export default function LoginPanel() {
  const { user, role, canEdit, isAdmin, signIn, signUp, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fn = mode === "signin" ? signIn : signUp;
    const err = await fn(email, password);
    setBusy(false);
    if (err) {
      setError(err.message || "Erreur de connexion.");
      return;
    }
    if (mode === "signup") {
      setError("Compte créé. Vérifie ta boîte mail si une confirmation est demandée, puis connecte-toi.");
      setMode("signin");
      return;
    }
    setOpen(false);
    setEmail("");
    setPassword("");
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:flex items-center gap-1 font-mono text-xs" style={{ color: canEdit ? "var(--lane-yellow)" : "rgba(255,255,255,0.6)" }}>
          {isAdmin ? <ShieldCheck size={13} /> : <User size={13} />}
          {isAdmin ? "Admin" : canEdit ? "Éditeur" : "Lecture seule"}
        </span>
        <button onClick={signOut} className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-2 py-1.5 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }}>
          <LogOut size={13} /> <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-2 py-1.5 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }}>
        <LogIn size={13} /> Se connecter
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-sm p-4 z-30" style={{ background: "var(--card)", border: "1px solid var(--line)", boxShadow: "0 8px 24px rgba(20,23,31,0.25)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex rounded-sm overflow-hidden" style={{ border: "1px solid var(--line)" }}>
              <button type="button" onClick={() => setMode("signin")} className="font-mono text-[10px] uppercase px-2 py-1" style={{ background: mode === "signin" ? "var(--ink)" : "transparent", color: mode === "signin" ? "#fff" : "var(--ink)" }}>Connexion</button>
              <button type="button" onClick={() => setMode("signup")} className="font-mono text-[10px] uppercase px-2 py-1" style={{ background: mode === "signup" ? "var(--ink)" : "transparent", color: mode === "signup" ? "#fff" : "var(--ink)" }}>Créer un compte</button>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fermer" style={{ color: "var(--steel)" }}><X size={14} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2">
            <input className="field" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="field" type="password" required minLength={6} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-xs font-mono" style={{ color: "var(--track)" }}>{error}</p>}
            <button type="submit" disabled={busy} className="focus-ring w-full font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--track)", color: "#fff", opacity: busy ? 0.6 : 1 }}>
              {mode === "signin" ? "Se connecter" : "Créer le compte"}
            </button>
          </form>
          <p className="text-[10px] font-mono mt-2" style={{ color: "var(--steel)" }}>
            Créer un compte ne donne aucun droit d'édition par défaut — seuls les comptes invités par l'admin peuvent modifier des données.
          </p>
        </div>
      )}
    </div>
  );
}

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { derivePermissions } from "./permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // null = pas de droit d'édition
  const [loading, setLoading] = useState(true);

  async function loadProfile(currentUser) {
    if (!currentUser) {
      setRole(null);
      return;
    }
    const { data, error } = await supabase.from("profiles").select("role").eq("id", currentUser.id).maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur de chargement du profil (rôle) :", error.message);
    }
    setRole(data ? data.role : null);
  }

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      setUser(session?.user || null);
      await loadProfile(session?.user || null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      await loadProfile(session?.user || null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }
  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    return error;
  }
  async function signOut() {
    await supabase.auth.signOut();
  }

  const value = {
    user,
    role,
    loading,
    ...derivePermissions(role),
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé sous <AuthProvider>");
  return ctx;
}

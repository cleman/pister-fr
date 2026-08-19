import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Erreur non interceptée :", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--paper)" }}>
          <div className="max-w-sm text-center">
            <p className="font-display text-2xl mb-2" style={{ color: "var(--ink)" }}>Une erreur est survenue</p>
            <p className="text-sm mb-4" style={{ color: "var(--steel)" }}>
              Rien n'a été perdu — tes données sont toujours enregistrées. Recharge la page pour continuer.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="font-mono text-xs uppercase tracking-wide px-4 py-2 rounded-sm"
              style={{ background: "var(--track)", color: "#fff" }}
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

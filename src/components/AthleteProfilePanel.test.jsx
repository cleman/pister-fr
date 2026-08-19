import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AthleteProfilePanel from "./AthleteProfilePanel";

vi.mock("../lib/auth", () => ({ useAuth: vi.fn() }));
import { useAuth } from "../lib/auth";

const athlete = { id: "a1", canonicalName: "Théo Schaub", club: "Nice", gender: "H" };
const competitions = [{ id: "c1", name: "Meeting Test", date: "2020-01-01", location: "Paris" }];
const resultsStore = {
  c1: [
    { disciplineId: "100", gender: "H", environment: "outdoor", round: { type: "finale", heat: null },
      entries: [{ place: 1, name: "Théo Schaub", club: "Nice", mark: 10.4, wind: 0.5, athleteId: "a1" }] },
  ],
};

const baseProps = {
  athleteId: "a1",
  athletes: [athlete],
  resultsStore,
  competitions,
  onClose: vi.fn(),
  onOpenCompetition: vi.fn(),
  onAddPerformance: vi.fn(),
  onSetGender: vi.fn(),
  onDeletePerformance: vi.fn(),
};

describe("AthleteProfilePanel — droits d'édition selon le rôle", () => {
  it("visiteur non connecté : sexe en lecture seule, pas d'ajout ni de suppression", () => {
    useAuth.mockReturnValue({ canEdit: false, isAdmin: false });
    render(<AthleteProfilePanel {...baseProps} />);
    expect(screen.queryByText(/ajouter une performance/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/supprimer cette performance/i)).not.toBeInTheDocument();
    // le sexe est affiché en texte simple ("H"), pas de boutons H/F cliquables
    expect(screen.queryByRole("button", { name: "H" })).not.toBeInTheDocument();
  });

  it("éditeur : peut modifier le sexe et ajouter une performance, mais pas supprimer", () => {
    useAuth.mockReturnValue({ canEdit: true, isAdmin: false });
    render(<AthleteProfilePanel {...baseProps} />);
    expect(screen.getByText(/ajouter une performance/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "H" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/supprimer cette performance/i)).not.toBeInTheDocument();
  });

  it("admin : peut aussi supprimer une performance individuelle", () => {
    useAuth.mockReturnValue({ canEdit: true, isAdmin: true });
    render(<AthleteProfilePanel {...baseProps} />);
    expect(screen.getByLabelText(/supprimer cette performance/i)).toBeInTheDocument();
  });
});

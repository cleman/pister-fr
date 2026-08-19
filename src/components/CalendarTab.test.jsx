import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CalendarTab from "./CalendarTab";

vi.mock("../lib/auth", () => ({ useAuth: vi.fn() }));
import { useAuth } from "../lib/auth";

const baseProps = {
  loaded: true,
  competitions: [
    { id: "c1", name: "Meeting Test", date: "2020-01-01", location: "Paris", tier: "circuit", following: false, manualComplete: false },
  ],
  resultsStore: {},
  onOpen: vi.fn(),
  onToggleFollow: vi.fn(),
  onAddCompetition: vi.fn(),
  onDeleteCompetition: vi.fn(),
};

describe("CalendarTab — droits d'édition selon le rôle", () => {
  it("visiteur non connecté : ni ajout, ni suppression", () => {
    useAuth.mockReturnValue({ canEdit: false, isAdmin: false });
    render(<CalendarTab {...baseProps} />);
    expect(screen.queryByText(/ajouter une compétition/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/supprimer cette compétition/i)).not.toBeInTheDocument();
  });

  it("éditeur : peut ajouter, mais ne peut pas supprimer", () => {
    useAuth.mockReturnValue({ canEdit: true, isAdmin: false });
    render(<CalendarTab {...baseProps} />);
    expect(screen.getByText(/ajouter une compétition/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/supprimer cette compétition/i)).not.toBeInTheDocument();
  });

  it("admin : peut ajouter ET supprimer", () => {
    useAuth.mockReturnValue({ canEdit: true, isAdmin: true });
    render(<CalendarTab {...baseProps} />);
    expect(screen.getByText(/ajouter une compétition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/supprimer cette compétition/i)).toBeInTheDocument();
  });

  it("éditeur seul (sans être admin) ne voit jamais le bouton de suppression, même avec plusieurs compétitions", () => {
    useAuth.mockReturnValue({ canEdit: true, isAdmin: false });
    render(<CalendarTab {...baseProps} competitions={[...baseProps.competitions, { ...baseProps.competitions[0], id: "c2", name: "Autre meeting" }]} />);
    expect(screen.queryAllByLabelText(/supprimer cette compétition/i)).toHaveLength(0);
  });
});

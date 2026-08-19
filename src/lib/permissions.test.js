import { describe, it, expect } from "vitest";
import { derivePermissions } from "./permissions";

describe("derivePermissions", () => {
  it("visiteur sans compte ou sans profil (role=null) : aucun droit", () => {
    expect(derivePermissions(null)).toEqual({ canEdit: false, isAdmin: false });
  });
  it("éditeur : peut éditer, n'est pas admin", () => {
    expect(derivePermissions("editor")).toEqual({ canEdit: true, isAdmin: false });
  });
  it("admin : peut éditer ET est admin", () => {
    expect(derivePermissions("admin")).toEqual({ canEdit: true, isAdmin: true });
  });
  it("valeur de rôle inattendue : aucun droit par défaut (échoue de façon sûre)", () => {
    expect(derivePermissions("hacker")).toEqual({ canEdit: false, isAdmin: false });
    expect(derivePermissions(undefined)).toEqual({ canEdit: false, isAdmin: false });
    expect(derivePermissions("")).toEqual({ canEdit: false, isAdmin: false });
  });
});

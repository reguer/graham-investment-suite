import { describe, expect, it } from "vitest";
import { getVisibleWatchReason, shouldShowWatchReason } from "../src/tools/watchlist/watchReason.js";

describe("watchReason helpers", () => {
  it("shows long business notes", () => {
    expect(shouldShowWatchReason("Empresa solida, con balance limpio y flujo suficiente para seguir en observacion activa.")).toBe(true);
  });

  it("hides short notes to avoid noisy cells", () => {
    expect(shouldShowWatchReason("Muy cara")).toBe(false);
  });

  it("hides process notes prefixed with technical markers", () => {
    expect(shouldShowWatchReason("Snapshot Yahoo 2026-06-29 generado con FX")).toBe(false);
  });

  it("returns only visible business notes from a company record", () => {
    expect(getVisibleWatchReason({
      watchReason: "Empresa solida, pero el precio exige una valuacion mas tipo Buffett que defensiva.",
    })).toContain("valuacion");
    expect(getVisibleWatchReason({
      watchReason: "Snapshot Yahoo 2026-06-29 generado con FX",
      analysisStatus: "analyzed",
    })).toContain("perfil defensivo Graham");
  });
});

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exportLocalMoatManualToPublic, getLocalMoatManualPath, getPublicMoatManualPaths, readLocalMoatManual, upsertLocalMoatManual, writeLocalMoatManual } from "../scripts/moat-manual-store.js";

describe("moat manual local store", () => {
  it("reads empty state when the local private file does not exist", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "graham-moat-store-"));
    expect(readLocalMoatManual(rootDir)).toEqual({});
  });

  it("writes normalized local records under data/local", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "graham-moat-store-"));
    const result = writeLocalMoatManual({
      tsm: {
        moatRating: { value: "Alta", confidence: "high" },
      },
    }, rootDir);

    expect(result.filePath).toBe(getLocalMoatManualPath(rootDir));
    expect(result.records.TSM.moatRating.value).toBe("Alta");
    expect(result.records.TSM.moatRating.confidence).toBe("high");
  });

  it("upserts one ticker and stamps updatedAt", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "graham-moat-store-"));
    const result = upsertLocalMoatManual({
      ticker: "msft",
      ownerThesis: { value: "Calidad visible", notes: "Solo local" },
    }, rootDir, "2026-07-03T16:20:00.000Z");

    expect(result.record.ticker).toBe("MSFT");
    expect(result.record.updatedAt).toBe("2026-07-03T16:20:00.000Z");
    expect(readLocalMoatManual(rootDir).MSFT.ownerThesis.notes).toBe("Solo local");
  });

  it("exports the public JSON without local notes", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "graham-moat-store-"));
    upsertLocalMoatManual({
      ticker: "nvda",
      moatRating: { value: "Alta", notes: "Privada", sourceUrl: "https://example.com" },
    }, rootDir, "2026-07-03T18:00:00.000Z");

    const result = exportLocalMoatManualToPublic(rootDir);
    const { dataPublicPath, publicSitePath } = getPublicMoatManualPaths(rootDir);

    expect(result.count).toBe(1);
    expect(result.dataPublicPath).toBe(dataPublicPath);
    expect(result.publicSitePath).toBe(publicSitePath);
    expect(result.records.NVDA.moatRating.notes).toBeNull();
    expect(result.records.NVDA.moatRating.value).toBe("Alta");
  });
});

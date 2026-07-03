import { describe, expect, it } from "vitest";
import {
  MOAT_CONFIDENCE_LEVELS,
  MOAT_MANUAL_FIELDS,
  createEmptyMoatManualEntry,
  createEmptyMoatManualRecord,
  normalizeMoatManualEntry,
  normalizeMoatManualMap,
  normalizeMoatManualRecord,
  sanitizeMoatManualRecordForPublic,
} from "../src/tools/watchlist/moatManual.js";

describe("moat manual schema", () => {
  it("defines the manual-only moat fields with a shared evidence schema", () => {
    expect(MOAT_CONFIDENCE_LEVELS).toEqual(["low", "medium", "high"]);
    expect(MOAT_MANUAL_FIELDS.map((field) => field.id)).toEqual([
      "moatRating",
      "strategicContracts",
      "regulatoryTailwind",
      "customerConcentration",
      "managementQuality",
      "technologyMoatEvidence",
      "ownerThesis",
    ]);
    expect(createEmptyMoatManualEntry()).toEqual({
      value: null,
      sourceUrl: null,
      asOf: null,
      confidence: null,
      notes: null,
    });
  });

  it("normalizes a manual moat record without inventing missing values", () => {
    const record = normalizeMoatManualRecord({
      ticker: " tsm ",
      updatedAt: "2026-07-03T10:15:00.000Z",
      moatRating: {
        value: " Alto ",
        sourceUrl: " https://example.com/moat ",
        asOf: "2026-06-30",
        confidence: "HIGH",
        notes: " ADR con evidencia citada ",
      },
      ownerThesis: {
        value: "",
        sourceUrl: "",
        asOf: "",
        confidence: "desconocida",
        notes: "",
      },
    });

    expect(record.ticker).toBe("TSM");
    expect(record.updatedAt).toBe("2026-07-03T10:15:00.000Z");
    expect(record.moatRating).toEqual({
      value: "Alto",
      sourceUrl: "https://example.com/moat",
      asOf: "2026-06-30",
      confidence: "high",
      notes: "ADR con evidencia citada",
    });
    expect(record.ownerThesis).toEqual({
      value: null,
      sourceUrl: null,
      asOf: null,
      confidence: null,
      notes: null,
    });
    expect(record.managementQuality.value).toBeNull();
    expect(record.managementQuality.confidence).toBeNull();
  });

  it("accepts arrays or objects and keys them by uppercase ticker", () => {
    const fromArray = normalizeMoatManualMap([
      { ticker: "msft", moatRating: { value: "Fuerte" } },
      { ticker: "orcl", regulatoryTailwind: { value: "Moderada", confidence: "medium" } },
    ]);
    const fromObject = normalizeMoatManualMap({
      nvda: { moatRating: { value: "Alta", confidence: "low" } },
    });

    expect(Object.keys(fromArray)).toEqual(["MSFT", "ORCL"]);
    expect(fromArray.MSFT.moatRating.value).toBe("Fuerte");
    expect(fromArray.ORCL.regulatoryTailwind.confidence).toBe("medium");
    expect(Object.keys(fromObject)).toEqual(["NVDA"]);
    expect(fromObject.NVDA.moatRating.confidence).toBe("low");
  });

  it("creates an empty record with every manual field present", () => {
    const empty = createEmptyMoatManualRecord("kbh");

    expect(empty.ticker).toBe("KBH");
    expect(empty.updatedAt).toBeNull();
    for (const field of MOAT_MANUAL_FIELDS) {
      expect(empty[field.id]).toEqual(createEmptyMoatManualEntry());
    }
  });

  it("normalizes a single evidence entry defensively", () => {
    expect(normalizeMoatManualEntry({ value: "  ", confidence: "invalid", notes: "  " })).toEqual({
      value: null,
      sourceUrl: null,
      asOf: null,
      confidence: null,
      notes: null,
    });
  });

  it("removes private notes from the public export shape", () => {
    const sanitized = sanitizeMoatManualRecordForPublic({
      ticker: "TSM",
      moatRating: {
        value: "Alta",
        sourceUrl: "https://example.com/moat",
        asOf: "2026-07-03",
        confidence: "high",
        notes: "Solo local",
      },
    });

    expect(sanitized.ticker).toBe("TSM");
    expect(sanitized.moatRating.notes).toBeNull();
    expect(sanitized.moatRating.value).toBe("Alta");
    expect(sanitized.moatRating.sourceUrl).toBe("https://example.com/moat");
  });
});

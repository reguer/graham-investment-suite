import { describe, expect, it } from "vitest";
import {
  BUFFETT_EXPORT_HEADERS,
  buildBuffettExportRow,
  watchlistBuffettSheetData,
} from "../src/lib/watchlistExport.js";

const richItem = {
  ticker: "AAA",
  companyName: "Alpha Corp",
  buffett: {
    ownerEarnings: { ownerEarnings: 120, ownerEarningsPerShare: 1.2 },
    dcf: {
      valuationStatus: "ok",
      mosBuffett: 0.3,
      intrinsicValuePerShareBase: 13.7,
      intrinsicValuePerShareBear: 12,
      intrinsicValuePerShareBull: 15,
    },
    qualityScore: { value: 82, capitalAllocationScore: 75, qualityConfidence: "high", weightStatus: "PENDIENTE-DECISION" },
  },
};

describe("buildBuffettExportRow", () => {
  it("emits a Buffett block with label and placeholder weight status", () => {
    const row = buildBuffettExportRow(richItem);

    expect(row["Etiqueta Buffett"]).toBe("Calidad alta sin evidencia");
    expect(row["Quality Score"]).toBe(82);
    expect(row["Capital Allocation"]).toBe(75);
    expect(row.Confidence).toBe("high");
    expect(row["Estado valuacion"]).toBe("ok");
    expect(row["Estado IA"]).toBe("insufficient_evidence");
    expect(row.Pesos).toBe("PENDIENTE-DECISION");
  });

  it("uses placeholders when the company has no Buffett data", () => {
    const row = buildBuffettExportRow({ ticker: "BBB" });

    expect(row["Etiqueta Buffett"]).toBe("Valuacion insuficiente");
    expect(row["Quality Score"]).toBe("N/D");
    expect(row.Pesos).toBe("APROBADO-2026-07-03");
  });
});

describe("watchlistBuffettSheetData", () => {
  it("builds a header row and aligned data rows", () => {
    const sheet = watchlistBuffettSheetData([richItem]);

    expect(sheet[0]).toEqual(BUFFETT_EXPORT_HEADERS);
    expect(sheet).toHaveLength(2);
    expect(sheet[1]).toHaveLength(BUFFETT_EXPORT_HEADERS.length);
  });

  it("returns only the header row for an empty list", () => {
    const sheet = watchlistBuffettSheetData([]);
    expect(sheet).toHaveLength(1);
  });
});

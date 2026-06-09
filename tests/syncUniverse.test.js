import { describe, expect, it } from "vitest";
import { buildUniverseSyncPayload, mergeUniverseWithPublic, parseArgs, syncUniverse } from "../scripts/sync-universe.js";

describe("sync universe", () => {
  it("builds normalized public companies from ticker universe", () => {
    const payload = buildUniverseSyncPayload([
      { ticker: "ETR", yahooSymbol: "ETR.MX", companyName: "Entergy", market: "BMV SIC" },
      { ticker: "ETR", yahooSymbol: "ETR.MX", companyName: "Entergy duplicate", market: "BMV SIC" },
      { ticker: "QCOM", yahooSymbol: "QCOM.MX", companyName: "QUALCOMM", market: "BMV SIC", tags: ["technology"] },
    ]);

    expect(payload.companies).toHaveLength(2);
    expect(payload.duplicateTickers).toEqual(["ETR"]);
    expect(payload.companies[0].analysisStatus).toBe("pending_fundamentals");
    expect(payload.companies[0].validationStatus).toBe("needs_yahoo_validation");
    expect(payload.companies[1].tags).toContain("technology");
  });

  it("parses dry-run flag", () => {
    expect(parseArgs(["node", "sync-universe.js", "--dry-run"]).dryRun).toBe(true);
  });

  it("supports dry-run without touching public export or PostgreSQL", () => {
    const result = syncUniverse({ dryRun: true });
    expect(result.companies.length).toBeGreaterThan(200);
    expect(result.publicCount).toBe(0);
    expect(result.dbResult.dryRun).toBe(true);
  });

  it("preserves existing analyzed snapshots when syncing catalog metadata", () => {
    const merged = mergeUniverseWithPublic(
      [{ ticker: "AAPL", yahooSymbol: "AAPL.MX", companyName: "Apple", analysisStatus: "pending_fundamentals" }],
      [{ ticker: "AAPL", yahooSymbol: "AAPL.MX", companyName: "Apple", analysisStatus: "analyzed", pe: 20, pb: 3, classificationId: "rejected" }],
    );

    expect(merged[0].analysisStatus).toBe("analyzed");
    expect(merged[0].pe).toBe(20);
    expect(merged[0].classificationId).toBe("rejected");
  });
});

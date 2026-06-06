import { describe, expect, it } from "vitest";
import { analyzedWatchlist, publicCompanies, watchlist, watchlistMeta } from "../src/tools/watchlist/watchlist.js";

describe("watchlist universe merge", () => {
  it("keeps analyzed snapshots on their original quote symbol", () => {
    const lennar = watchlist.find((item) => item.ticker === "LEN");
    expect(lennar.analysisStatus).toBe("analyzed");
    expect(lennar.yahooSymbol).toBe("LEN");
    expect(lennar.market).toBe("US");
  });

  it("keeps all analyzed candidates visible even when they are outside the BMV universe", () => {
    for (const candidate of analyzedWatchlist) {
      expect(watchlist.some((item) => item.ticker === candidate.ticker)).toBe(true);
    }
    expect(watchlistMeta.analyzedCount).toBeGreaterThanOrEqual(analyzedWatchlist.length);
  });

  it("loads persisted companies from the public export", () => {
    expect(publicCompanies.length).toBeGreaterThan(0);
    expect(watchlistMeta.publicExportCount).toBe(publicCompanies.length);

    for (const company of publicCompanies) {
      expect(watchlist.some((item) => item.ticker === company.ticker)).toBe(true);
    }
  });

  it("uses the public export as the persisted source of reviewed metadata", () => {
    const exported = publicCompanies.find((item) => item.ticker === "CTSH");
    const visible = watchlist.find((item) => item.ticker === "CTSH");

    expect(exported).toBeTruthy();
    expect(visible.companyName).toBe(exported.companyName);
    expect(visible.validationStatus).toBe(exported.validationStatus);
  });
});

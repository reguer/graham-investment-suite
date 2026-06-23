import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { analyzedWatchlist, buildWatchlist, buildWatchlistMeta, collectTags, normalizeExportedCompany, normalizeTags } from "../src/tools/watchlist/watchlist.js";

const publicCompanies = JSON.parse(readFileSync("data/public/companies.json", "utf8")).map(normalizeExportedCompany);
const watchlist = buildWatchlist(publicCompanies);
const watchlistMeta = buildWatchlistMeta(watchlist, publicCompanies);

describe("watchlist universe merge", () => {
  it("keeps analyzed snapshots on their original quote symbol", () => {
    const ingredion = watchlist.find((item) => item.ticker === "INGR");
    expect(ingredion.analysisStatus).toBe("analyzed");
    expect(ingredion.yahooSymbol).toBe("INGR");
    expect(ingredion.market).toBe("US");
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
    expect(watchlistMeta.dataUpdatedAt).toBeTruthy();

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

  it("normalizes and collects tags for dashboard filters", () => {
    expect(normalizeTags("core, tech,")).toEqual(["core", "tech"]);
    expect(collectTags([{ tags: ["tech", "core"] }, { tags: "core,manual" }])).toEqual(["core", "manual", "tech"]);
  });
});

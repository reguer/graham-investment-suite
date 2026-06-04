import { describe, expect, it } from "vitest";
import { analyzedWatchlist, watchlist, watchlistMeta } from "../src/tools/watchlist/watchlist.js";

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
    expect(watchlistMeta.analyzedCount).toBe(analyzedWatchlist.length);
  });
});

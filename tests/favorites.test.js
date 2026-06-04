import { describe, expect, it } from "vitest";
import { normalizeFavorites, sortFavoritesFirst, toggleFavorite } from "../src/tools/watchlist/favorites.js";

describe("watchlist favorites", () => {
  it("normalizes unique uppercase tickers", () => {
    expect(normalizeFavorites([" aapl ", "AAPL", "mu", ""])).toEqual(["AAPL", "MU"]);
  });

  it("toggles a favorite ticker", () => {
    expect(toggleFavorite(["AAPL"], "mu")).toEqual(["AAPL", "MU"]);
    expect(toggleFavorite(["AAPL", "MU"], "aapl")).toEqual(["MU"]);
  });

  it("keeps favorite results at the top without changing the remaining order", () => {
    const results = [{ ticker: "AAPL" }, { ticker: "MU" }, { ticker: "TSLA" }];
    expect(sortFavoritesFirst(results, ["TSLA"]).map((item) => item.ticker)).toEqual(["TSLA", "AAPL", "MU"]);
  });
});

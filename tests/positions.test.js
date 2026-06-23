import { describe, expect, it } from "vitest";
import { evaluatePositions, entryPriceInQuoteCurrency, mergePositions, normalizePositions, priceToMxn } from "../src/tools/watchlist/positions.js";

describe("watchlist positions", () => {
  it("normalizes local positions and keeps entry prices in MXN", () => {
    expect(normalizePositions([{ ticker: " mu ", shares: "10", entryPriceMxn: "1,850.50", snapshotPriceMxn: "1,900" }])).toEqual([
      expect.objectContaining({ ticker: "MU", shares: 10, entryPriceMxn: 1850.5, snapshotPriceMxn: 1900 }),
    ]);
  });

  it("merges default positions with stored browser edits", () => {
    const merged = mergePositions(
      [{ ticker: "PYPL", shares: 1, entryPriceMxn: 730 }],
      [{ ticker: "PYPL", shares: 2, entryPriceMxn: 700 }],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual(expect.objectContaining({ ticker: "PYPL", shares: 2, entryPriceMxn: 700 }));
  });

  it("converts entry prices from MXN to the quote currency", () => {
    expect(entryPriceInQuoteCurrency(1850, "USD", 18.5)).toBe(100);
    expect(entryPriceInQuoteCurrency(1850, "MXN", 18.5)).toBe(1850);
    expect(priceToMxn(100, "USD", 18.5)).toBe(1850);
  });

  it("evaluates gain/loss and a defensive buy signal", () => {
    const [position] = evaluatePositions(
      [{ ticker: "INGR", shares: 2, entryPriceMxn: 2000 }],
      [{
        ticker: "INGR",
        companyName: "Ingredion",
        quoteCurrency: "USD",
        livePrice: 90,
        alertLevel: "approved",
        ratios: { maxDefensivePrice: 100 },
      }],
      { usdMxn: 20 },
    );

    expect(position.currentPriceMxn).toBe(1800);
    expect(position.gainPct).toBeCloseTo(-0.1);
    expect(position.marketValueMxn).toBe(3600);
    expect(position.recommendation.action).toBe("Comprar / acumular");
  });

  it("uses captured MXN price when a position is not in the catalog", () => {
    const [position] = evaluatePositions(
      [{ ticker: "ACTIREN B", shares: 3510, entryPriceMxn: 10.652597, snapshotPriceMxn: 10.73204 }],
      [],
    );

    expect(position.currentPriceMxn).toBe(10.73204);
    expect(position.marketValueMxn).toBeCloseTo(37669.46, 1);
    expect(position.company).toBeUndefined();
  });
});

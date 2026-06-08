import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runBacktest } from "../engine.js";
import { calculateBacktestMetrics, calculateMaxDrawdown } from "../metrics.js";
import { renderBacktestMarkdown } from "../report.js";
import { buildRatiosAtPrice, shouldEnterGrahamDefensive } from "../strategies/graham-defensive.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const miniUniverse = JSON.parse(readFileSync(join(__dirname, "fixtures", "mini_universe.json"), "utf8"));

describe("backtesting engine", () => {
  it("recalculates valuation ratios from snapshot fundamentals and live price", () => {
    const ratios = buildRatiosAtPrice(miniUniverse[0], 60);

    expect(ratios.pe).toBeCloseTo(12, 4);
    expect(ratios.pb).toBeCloseTo(1.2, 4);
    expect(ratios.pePb).toBeCloseTo(14.4, 4);
    expect(shouldEnterGrahamDefensive(miniUniverse[0], 50).ok).toBe(true);
  });

  it("buys Graham-approved names and exits on valuation break or stop loss", () => {
    const result = runBacktest({
      universe: miniUniverse,
      initialCapital: 90000,
      maxPositionPct: 0.1,
      commissionPct: 0,
      slippagePct: 0,
      stopLossPct: -0.2,
      exitPePb: 28,
    });

    const byTicker = Object.fromEntries(result.trades.map((trade) => [trade.ticker, trade]));
    expect(result.trades).toHaveLength(3);
    expect(byTicker.SAFE.exitCondition).toBe("Cierre del periodo de backtest.");
    expect(byTicker.EXIT.exitCondition).toContain("P/E x P/B");
    expect(byTicker.DROP.exitCondition).toContain("Stop loss");
    expect(byTicker.EXIT.netReturnPct).toBeGreaterThan(1);
    expect(byTicker.DROP.netReturnPct).toBeLessThan(0);
  });

  it("calculates metrics and renders a markdown report", () => {
    const result = runBacktest({
      universe: miniUniverse,
      initialCapital: 90000,
      maxPositionPct: 0.1,
      commissionPct: 0,
      slippagePct: 0,
    });
    const markdown = renderBacktestMarkdown(result);

    expect(result.metrics.tradeCount).toBe(3);
    expect(result.metrics.finalEquity).toBeGreaterThan(90000);
    expect(result.metrics.maxDrawdown).toBeLessThanOrEqual(0);
    expect(markdown).toContain("# Backtest Graham defensivo");
    expect(markdown).toContain("SAFE");
  });

  it("handles standalone metric calculations", () => {
    const equityCurve = [
      { date: "2024-01-01", equity: 100 },
      { date: "2024-01-02", equity: 120 },
      { date: "2024-01-03", equity: 90 },
    ];

    expect(calculateMaxDrawdown(equityCurve)).toBeCloseTo(-0.25, 4);
    expect(calculateBacktestMetrics({ equityCurve, trades: [], initialCapital: 100 }).totalReturn).toBeCloseTo(-0.1, 4);
  });
});

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findHistoricalCsv, loadBacktestUniverseFromPublic, loadBenchmarkFromHistorical, parseHistoricalCsv } from "../backtesting/data-loader.js";

const roots = [];

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), "graham-backtest-loader-"));
  roots.push(root);
  return root;
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("backtesting data loader", () => {
  it("parses historical csv rows", () => {
    const rows = parseHistoricalCsv("Date,Open,High,Low,Close,Volume\n2024-01-02,1,2,0.5,1.5,100\n", "KBH");

    expect(rows).toEqual([{ ticker: "KBH", date: "2024-01-02", open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 }]);
  });

  it("loads a public company with matching historical prices", () => {
    const root = tempRoot();
    const historicalDir = join(root, "historical");
    const companiesPath = join(root, "companies.json");
    mkdirSync(historicalDir, { recursive: true });
    writeFileSync(companiesPath, JSON.stringify([{ ticker: "KBH", companyName: "KB Home", price: 50, pe: 10, pb: 1, debtRatio: 0.5, currentRatio: 2.5, quickRatio: 1, fcf: 1, epsAllPositive: true }]), "utf8");
    writeFileSync(join(historicalDir, "KBH_2020-01-01_2026-06-08.csv"), "Date,Open,High,Low,Close,Volume\n2024-01-02,1,2,0.5,1.5,100\n", "utf8");

    const universe = loadBacktestUniverseFromPublic({ tickers: ["KBH"], companiesPath, historicalDir });

    expect(findHistoricalCsv("KBH", { historicalDir })).toContain("KBH_2020-01-01_2026-06-08.csv");
    expect(universe[0].prices).toHaveLength(1);
  });

  it("loads benchmark from historical data", () => {
    const root = tempRoot();
    const historicalDir = join(root, "historical");
    mkdirSync(historicalDir, { recursive: true });
    writeFileSync(join(historicalDir, "^GSPC_2020-01-01_2026-06-08.csv"), "Date,Open,High,Low,Close,Volume\n2024-01-02,100,101,99,100,1000\n", "utf8");

    expect(loadBenchmarkFromHistorical("^GSPC", { historicalDir })).toMatchObject({ ticker: "^GSPC", name: "S&P 500" });
  });
});

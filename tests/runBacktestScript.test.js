import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseBacktestArgs, runBacktestFromFile } from "../scripts/run-backtest.js";

const roots = [];

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), "graham-run-backtest-"));
  roots.push(root);
  return root;
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("run-backtest script", () => {
  it("normalizes public universe benchmark aliases", () => {
    const args = parseBacktestArgs(["node", "run-backtest.js", "--universe", "public-10", "--benchmark-ticker", "SP500"]);

    expect(args.universe).toBe("public-10");
    expect(args.benchmarkTicker).toBe("^GSPC");
  });

  it("writes public summary with scenarios for public universe", () => {
    const root = tempRoot();
    const historicalDir = join(root, "historical");
    const reportsDir = join(root, "reports");
    const publicOut = join(root, "public", "backtesting-summary.json");
    const companiesPath = join(root, "companies.json");
    mkdirSync(historicalDir, { recursive: true });
    writeFileSync(companiesPath, JSON.stringify([{ ticker: "KBH", companyName: "KB Home", price: 50, pe: 10, pb: 1, debtRatio: 0.5, currentRatio: 2.5, quickRatio: 1, fcf: 1, epsAllPositive: true }]), "utf8");
    writeFileSync(join(historicalDir, "KBH_2020-01-01_2026-06-08.csv"), "Date,Open,High,Low,Close,Volume\n2024-01-02,50,50,50,50,100\n2024-12-31,60,60,60,60,100\n", "utf8");
    writeFileSync(join(historicalDir, "^GSPC_2020-01-01_2026-06-08.csv"), "Date,Open,High,Low,Close,Volume\n2024-01-02,100,100,100,100,100\n2024-12-31,110,110,110,110,100\n", "utf8");

    runBacktestFromFile({
      ...parseBacktestArgs(["node", "run-backtest.js", "--universe", "public-10", "--tickers", "KBH", "--benchmark-ticker", "SP500"]),
      companiesPath,
      historicalDir,
      outDir: reportsDir,
      publicOut,
    });
    const summary = JSON.parse(readFileSync(publicOut, "utf8"));

    expect(summary.universe).toBe("public-10");
    expect(summary.benchmark.ticker).toBe("^GSPC");
    expect(summary.scenarios.map((scenario) => scenario.id)).toEqual(["base", "conservative", "patient"]);
  });
});

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DEFAULT_BACKTEST_TICKERS, loadBacktestUniverseFromPublic, loadBenchmarkFromHistorical } from "../backtesting/data-loader.js";
import { runBacktest } from "../backtesting/engine.js";
import { renderBacktestMarkdown, renderEquityCurveCsv, renderTradesCsv } from "../backtesting/report.js";

function normalizeBenchmarkTicker(value) {
  const ticker = String(value || "^GSPC").trim().toUpperCase();
  if (ticker === "SP500" || ticker === "GSPC") return "^GSPC";
  return ticker;
}

const SCENARIOS = [
  { id: "base", label: "Base", maxPositionPct: 0.1, stopLossPct: -0.2, exitPePb: 28 },
  { id: "conservative", label: "Conservador", maxPositionPct: 0.07, stopLossPct: -0.15, exitPePb: 24 },
  { id: "patient", label: "Paciente", maxPositionPct: 0.1, stopLossPct: -0.3, exitPePb: 32 },
];

export function parseBacktestArgs(argv) {
  const args = {
    fixture: join(process.cwd(), "backtesting", "tests", "fixtures", "mini_universe.json"),
    benchmark: join(process.cwd(), "backtesting", "tests", "fixtures", "benchmark_sp500.json"),
    universe: "fixture",
    tickers: DEFAULT_BACKTEST_TICKERS,
    benchmarkTicker: "^GSPC",
    historicalDir: join(process.cwd(), "backtesting", "data", "historical"),
    companiesPath: join(process.cwd(), "public", "data", "companies.json"),
    outDir: join(process.cwd(), "backtesting", "reports"),
    publicOut: join(process.cwd(), "public", "data", "backtesting-summary.json"),
    initialCapital: 100000,
    maxPositionPct: 0.1,
    stopLossPct: -0.2,
    exitPePb: 28,
  };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--fixture") args.fixture = String(argv[index + 1] || args.fixture);
    if (argv[index] === "--benchmark") args.benchmark = String(argv[index + 1] || args.benchmark);
    if (argv[index] === "--universe") args.universe = String(argv[index + 1] || args.universe);
    if (argv[index] === "--tickers") args.tickers = String(argv[index + 1] || "").split(",").map((ticker) => ticker.trim().toUpperCase()).filter(Boolean);
    if (argv[index] === "--benchmark-ticker") args.benchmarkTicker = normalizeBenchmarkTicker(argv[index + 1] || args.benchmarkTicker);
    if (argv[index] === "--historical-dir") args.historicalDir = String(argv[index + 1] || args.historicalDir);
    if (argv[index] === "--companies") args.companiesPath = String(argv[index + 1] || args.companiesPath);
    if (argv[index] === "--out") args.outDir = String(argv[index + 1] || args.outDir);
    if (argv[index] === "--public-out") args.publicOut = String(argv[index + 1] || args.publicOut);
    if (argv[index] === "--initial-capital") args.initialCapital = Number(argv[index + 1] || args.initialCapital);
    if (argv[index] === "--max-position-pct") args.maxPositionPct = Number(argv[index + 1] || args.maxPositionPct);
    if (argv[index] === "--stop-loss-pct") args.stopLossPct = Number(argv[index + 1] || args.stopLossPct);
    if (argv[index] === "--exit-pe-pb") args.exitPePb = Number(argv[index + 1] || args.exitPePb);
    if (argv[index] === "--start-date") args.startDate = String(argv[index + 1] || "");
  }
  // Default: no entrar antes de 2022 — los fundamentales snapshot 2026 no son representativos de 2020-2021
  if (!args.startDate) args.startDate = "2022-01-01";
  return args;
}

function summarizeResult(result, scenario) {
  return {
    id: scenario.id,
    label: scenario.label,
    params: {
      maxPositionPct: scenario.maxPositionPct,
      stopLossPct: scenario.stopLossPct,
      exitPePb: scenario.exitPePb,
    },
    metrics: result.metrics,
    benchmark: result.benchmark,
    trades: result.trades,
    equityCurve: result.equityCurve,
  };
}

export function runBacktestFromFile(args) {
  const usePublicUniverse = args.universe === "public-10";
  const universe = usePublicUniverse
    ? loadBacktestUniverseFromPublic({ tickers: args.tickers, companiesPath: args.companiesPath, historicalDir: args.historicalDir })
    : JSON.parse(readFileSync(args.fixture, "utf8"));
  const historicalBenchmark = usePublicUniverse ? loadBenchmarkFromHistorical(normalizeBenchmarkTicker(args.benchmarkTicker), { historicalDir: args.historicalDir }) : null;
  const benchmark = historicalBenchmark || (args.benchmark ? JSON.parse(readFileSync(args.benchmark, "utf8")) : null);
  const scenarioInputs = SCENARIOS.map((scenario) => scenario.id === "base"
    ? { ...scenario, maxPositionPct: args.maxPositionPct, stopLossPct: args.stopLossPct, exitPePb: args.exitPePb }
    : scenario);
  const scenarioResults = scenarioInputs.map((scenario) => {
    const result = runBacktest({
      universe,
      benchmark,
      initialCapital: args.initialCapital,
      maxPositionPct: scenario.maxPositionPct,
      stopLossPct: scenario.stopLossPct,
      exitPePb: scenario.exitPePb,
      startDate: args.startDate,
    });
    return summarizeResult(result, scenario);
  });
  const result = {
    ...runBacktest({
      universe,
      benchmark,
      initialCapital: args.initialCapital,
      startDate: args.startDate,
      maxPositionPct: args.maxPositionPct,
      stopLossPct: args.stopLossPct,
      exitPePb: args.exitPePb,
    }),
    scenarioId: "base",
  };
  mkdirSync(args.outDir, { recursive: true });
  const reportPath = join(args.outDir, "graham-defensive-mini-report.md");
  const summaryPath = join(args.outDir, "graham-defensive-mini-summary.json");
  const tradesCsvPath = join(args.outDir, "graham-defensive-mini-trades.csv");
  const equityCsvPath = join(args.outDir, "graham-defensive-mini-equity.csv");
  const summary = {
    generatedAt: new Date().toISOString(),
    universe: usePublicUniverse ? "public-10" : "fixture",
    tickers: universe.map((company) => company.ticker),
    strategy: result.strategy,
    metrics: result.metrics,
    benchmark: result.benchmark,
    params: { maxPositionPct: args.maxPositionPct, stopLossPct: args.stopLossPct, exitPePb: args.exitPePb },
    scenarios: scenarioResults,
    trades: result.trades,
    equityCurve: result.equityCurve,
    assumptions: result.assumptions,
  };
  writeFileSync(reportPath, renderBacktestMarkdown(result), "utf8");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  writeFileSync(tradesCsvPath, renderTradesCsv(result.trades), "utf8");
  writeFileSync(equityCsvPath, renderEquityCurveCsv(result.equityCurve), "utf8");
  if (args.publicOut) {
    mkdirSync(dirname(args.publicOut), { recursive: true });
    writeFileSync(args.publicOut, JSON.stringify(summary, null, 2) + "\n", "utf8");
  }
  return { reportPath, summaryPath, tradesCsvPath, equityCsvPath, publicOut: args.publicOut, result };
}

const isCli = process.argv[1] && process.argv[1].endsWith("run-backtest.js");
if (isCli) {
  try {
    const output = runBacktestFromFile(parseBacktestArgs(process.argv));
    console.log(`Reporte: ${output.reportPath}`);
    console.log(`Resumen: ${output.summaryPath}`);
    console.log(`Trades CSV: ${output.tradesCsvPath}`);
    console.log(`Equity CSV: ${output.equityCsvPath}`);
    if (output.publicOut) console.log(`Resumen publico: ${output.publicOut}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

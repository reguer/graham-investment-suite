import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { runBacktest } from "../backtesting/engine.js";
import { renderBacktestMarkdown, renderEquityCurveCsv, renderTradesCsv } from "../backtesting/report.js";

export function parseBacktestArgs(argv) {
  const args = {
    fixture: join(process.cwd(), "backtesting", "tests", "fixtures", "mini_universe.json"),
    benchmark: join(process.cwd(), "backtesting", "tests", "fixtures", "benchmark_sp500.json"),
    outDir: join(process.cwd(), "backtesting", "reports"),
    publicOut: join(process.cwd(), "public", "data", "backtesting-summary.json"),
    initialCapital: 100000,
  };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--fixture") args.fixture = String(argv[index + 1] || args.fixture);
    if (argv[index] === "--benchmark") args.benchmark = String(argv[index + 1] || args.benchmark);
    if (argv[index] === "--out") args.outDir = String(argv[index + 1] || args.outDir);
    if (argv[index] === "--public-out") args.publicOut = String(argv[index + 1] || args.publicOut);
    if (argv[index] === "--initial-capital") args.initialCapital = Number(argv[index + 1] || args.initialCapital);
  }
  return args;
}

export function runBacktestFromFile(args) {
  const universe = JSON.parse(readFileSync(args.fixture, "utf8"));
  const benchmark = args.benchmark ? JSON.parse(readFileSync(args.benchmark, "utf8")) : null;
  const result = runBacktest({ universe, benchmark, initialCapital: args.initialCapital });
  mkdirSync(args.outDir, { recursive: true });
  const reportPath = join(args.outDir, "graham-defensive-mini-report.md");
  const summaryPath = join(args.outDir, "graham-defensive-mini-summary.json");
  const tradesCsvPath = join(args.outDir, "graham-defensive-mini-trades.csv");
  const equityCsvPath = join(args.outDir, "graham-defensive-mini-equity.csv");
  const summary = {
    generatedAt: new Date().toISOString(),
    strategy: result.strategy,
    metrics: result.metrics,
    benchmark: result.benchmark,
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

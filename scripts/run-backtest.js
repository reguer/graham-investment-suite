import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runBacktest } from "../backtesting/engine.js";
import { renderBacktestMarkdown } from "../backtesting/report.js";

export function parseBacktestArgs(argv) {
  const args = {
    fixture: join(process.cwd(), "backtesting", "tests", "fixtures", "mini_universe.json"),
    outDir: join(process.cwd(), "backtesting", "reports"),
    initialCapital: 100000,
  };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--fixture") args.fixture = String(argv[index + 1] || args.fixture);
    if (argv[index] === "--out") args.outDir = String(argv[index + 1] || args.outDir);
    if (argv[index] === "--initial-capital") args.initialCapital = Number(argv[index + 1] || args.initialCapital);
  }
  return args;
}

export function runBacktestFromFile(args) {
  const universe = JSON.parse(readFileSync(args.fixture, "utf8"));
  const result = runBacktest({ universe, initialCapital: args.initialCapital });
  mkdirSync(args.outDir, { recursive: true });
  const reportPath = join(args.outDir, "graham-defensive-mini-report.md");
  const summaryPath = join(args.outDir, "graham-defensive-mini-summary.json");
  writeFileSync(reportPath, renderBacktestMarkdown(result), "utf8");
  writeFileSync(summaryPath, JSON.stringify({ metrics: result.metrics, trades: result.trades, assumptions: result.assumptions }, null, 2) + "\n", "utf8");
  return { reportPath, summaryPath, result };
}

const isCli = process.argv[1] && process.argv[1].endsWith("run-backtest.js");
if (isCli) {
  try {
    const output = runBacktestFromFile(parseBacktestArgs(process.argv));
    console.log(`Reporte: ${output.reportPath}`);
    console.log(`Resumen: ${output.summaryPath}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

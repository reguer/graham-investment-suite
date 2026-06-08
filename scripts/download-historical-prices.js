import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchHistoricalPrices } from "../src/tools/watchlist/priceSources.js";

const DEFAULT_TICKERS = ["KBH", "MTH", "TOL", "TMHC", "LEN", "INGR", "CTSH", "MHO", "GRBK", "PHM"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function parseHistoricalArgs(argv) {
  const args = {
    tickers: DEFAULT_TICKERS,
    startDate: "2020-01-01",
    endDate: todayIso(),
    outDir: join(process.cwd(), "backtesting", "data", "historical"),
  };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--tickers") args.tickers = String(argv[index + 1] || "").split(",").map((ticker) => ticker.trim().toUpperCase()).filter(Boolean);
    if (argv[index] === "--start") args.startDate = String(argv[index + 1] || args.startDate);
    if (argv[index] === "--end") args.endDate = String(argv[index + 1] || args.endDate);
    if (argv[index] === "--out") args.outDir = String(argv[index + 1] || args.outDir);
  }
  if (!args.tickers.length) throw new Error("Debes indicar al menos un ticker.");
  return args;
}

export function serializeHistoricalCsv(rows) {
  return ["Date,Open,High,Low,Close,Volume", ...rows.map((row) => [row.date, row.open, row.high, row.low, row.close, row.volume].join(","))].join("\n") + "\n";
}

export async function downloadHistoricalPrices({ tickers, startDate, endDate, outDir, fetchImpl = fetch }) {
  mkdirSync(outDir, { recursive: true });
  const results = [];
  for (const ticker of tickers) {
    const rows = await fetchHistoricalPrices(ticker, { startDate, endDate, fetchImpl });
    const path = join(outDir, `${ticker}_${startDate}_${endDate}.csv`.replace(/:/g, "-"));
    writeFileSync(path, serializeHistoricalCsv(rows), "utf8");
    results.push({ ticker, path, rows: rows.length });
  }
  return results;
}

const isCli = process.argv[1] && process.argv[1].endsWith("download-historical-prices.js");
if (isCli) {
  const args = parseHistoricalArgs(process.argv);
  downloadHistoricalPrices(args).then((results) => {
    for (const result of results) console.log(`${result.ticker}: ${result.rows} filas -> ${result.path}`);
  }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

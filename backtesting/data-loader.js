import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const DEFAULT_BACKTEST_TICKERS = ["KBH", "MTH", "TOL", "TMHC", "LEN", "INGR", "CTSH", "MHO", "GRBK", "PHM"];

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

export function parseHistoricalCsv(text, ticker = "") {
  const lines = String(text || "").trim().split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];
  return lines.slice(1).map((line) => {
    const [date, open, high, low, close, volume] = parseCsvLine(line);
    return {
      ticker,
      date,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
    };
  }).filter((row) => row.date && [row.open, row.high, row.low, row.close].every(Number.isFinite));
}

export function findHistoricalCsv(ticker, { historicalDir = join(process.cwd(), "backtesting", "data", "historical") } = {}) {
  if (!existsSync(historicalDir)) return "";
  const normalized = String(ticker).toUpperCase();
  const files = readdirSync(historicalDir)
    .filter((file) => file.toUpperCase().startsWith(`${normalized}_`) && file.toLowerCase().endsWith(".csv"))
    .sort();
  return files.length ? join(historicalDir, files.at(-1)) : "";
}

export function loadHistoricalPrices(ticker, options = {}) {
  const path = findHistoricalCsv(ticker, options);
  if (!path) return [];
  return parseHistoricalCsv(readFileSync(path, "utf8"), ticker);
}

export function loadBacktestUniverseFromPublic({
  tickers = DEFAULT_BACKTEST_TICKERS,
  companiesPath = join(process.cwd(), "public", "data", "companies.json"),
  historicalDir = join(process.cwd(), "backtesting", "data", "historical"),
} = {}) {
  const companies = JSON.parse(readFileSync(companiesPath, "utf8"));
  return tickers.map((ticker) => {
    const company = companies.find((item) => item.ticker === ticker);
    if (!company) throw new Error(`Ticker ${ticker} no existe en ${companiesPath}`);
    return {
      ticker,
      companyName: company.companyName || ticker,
      price: company.price,
      pe: company.pe,
      pb: company.pb,
      debtRatio: company.debtRatio,
      currentRatio: company.currentRatio,
      quickRatio: company.quickRatio,
      fcf: company.fcf,
      epsAllPositive: company.epsAllPositive,
      epsGrowing: company.epsGrowing,
      prices: loadHistoricalPrices(ticker, { historicalDir }),
    };
  }).filter((company) => company.prices.length);
}

export function loadBenchmarkFromHistorical(ticker = "^GSPC", options = {}) {
  const prices = loadHistoricalPrices(ticker, options);
  return prices.length ? { ticker, name: ticker === "^GSPC" ? "S&P 500" : ticker, prices } : null;
}

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarketQuotes } from "../src/tools/watchlist/priceSources.js";
import { normalizeExportedCompany } from "../src/tools/watchlist/watchlist.js";
import { insertPriceSnapshotSql, PUBLIC_COMPANIES_PATH, runPsql } from "./db-client.js";

const PRICE_SNAPSHOT_DB_CHUNK_SIZE = 25;

export function todayIso(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    requestedOnly: args.has("--requested-only"),
    referencesOnly: args.has("--references-only"),
  };
}

export function loadPublicUniverse(path = PUBLIC_COMPANIES_PATH) {
  return JSON.parse(readFileSync(path, "utf8")).map(normalizeExportedCompany);
}

function savePublicUniverse(records, path = PUBLIC_COMPANIES_PATH) {
  const sorted = records.sort((a, b) => a.ticker.localeCompare(b.ticker));
  writeFileSync(path, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  mkdirSync(join(process.cwd(), "public", "data"), { recursive: true });
  writeFileSync(join(process.cwd(), "public", "data", "companies.json"), `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  return sorted;
}

export function selectRefreshTargets(records, args) {
  let items = records;
  if (args.requestedOnly) items = items.filter((item) => item.priority === "requested");
  if (args.referencesOnly) items = items.filter((item) => item.analysisStatus === "index_reference" || item.validationStatus === "index_reference");
  return items.filter((item) => item.yahooSymbol || item.yahoo_symbol || item.ticker);
}

export function mergeQuotesIntoRecords(records, quotes, { date = new Date() } = {}) {
  const refreshedAt = date.toISOString();
  return records.map((record) => {
    const quote = quotes[record.ticker];
    if (!quote) return record;
    return {
      ...record,
      lastPrice: quote.price,
      lastPriceDate: quote.date || todayIso(date),
      lastPriceUpdatedAt: refreshedAt,
      lastPriceSource: quote.source,
      quoteCurrency: quote.currency || record.currency || "",
    };
  });
}

export function buildRefreshPayload({ records, targets, quotes, args, date = new Date() }) {
  const resolved = targets.filter((item) => quotes[item.ticker]);
  const unresolved = targets.filter((item) => !quotes[item.ticker]);
  return {
    generatedAt: date.toISOString(),
    mode: args.requestedOnly ? "requested-only" : args.referencesOnly ? "references-only" : "all",
    counts: {
      total: targets.length,
      resolved: resolved.length,
      unresolved: unresolved.length,
      publicExport: records.length,
    },
    quotes,
    unresolved: unresolved.map((item) => ({
      ticker: item.ticker,
      yahooSymbol: item.yahooSymbol,
      companyName: item.companyName,
      validationStatus: item.validationStatus,
    })),
  };
}

function persistPriceSnapshots(targets, quotes) {
  const statements = targets
    .filter((item) => quotes[item.ticker])
    .map((item) => insertPriceSnapshotSql({
      ticker: item.ticker,
      yahooSymbol: item.yahooSymbol,
      ...quotes[item.ticker],
      marketTime: [quotes[item.ticker].date, quotes[item.ticker].time].filter(Boolean).join(" "),
    }));
  if (!statements.length) return { ok: true, skipped: false, stdout: "" };
  let dbResult = { ok: true, skipped: false };
  let dbSkipped = false;
  for (let index = 0; index < statements.length; index += PRICE_SNAPSHOT_DB_CHUNK_SIZE) {
    const result = runPsql(statements.slice(index, index + PRICE_SNAPSHOT_DB_CHUNK_SIZE).join("\n"));
    if (result.skipped) dbSkipped = true;
    dbResult = result;
  }
  if (dbSkipped) return { ok: false, skipped: true, reason: "DATABASE_URL no configurado. No se escribio en PostgreSQL." };
  return dbResult;
}

export async function refreshUniversePrices({ argv = process.argv, fetcher = fetchMarketQuotes, date = new Date() } = {}) {
  const args = parseArgs(argv);
  const records = loadPublicUniverse();
  const targets = selectRefreshTargets(records, args);
  const quotes = await fetcher(targets);
  const nextRecords = mergeQuotesIntoRecords(records, quotes, { date });
  savePublicUniverse(nextRecords);

  const payload = buildRefreshPayload({ records: nextRecords, targets, quotes, args, date });
  const cacheDir = join(process.cwd(), "data", "cache");
  mkdirSync(cacheDir, { recursive: true });
  const filePath = join(cacheDir, `yahoo-universe-snapshot-${todayIso(date)}.json`);
  writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");

  const dbResult = persistPriceSnapshots(targets, quotes);
  return { ...payload, filePath, dbSkipped: Boolean(dbResult.skipped) };
}

const isCli = process.argv[1] && process.argv[1].endsWith("refresh-universe.js");
if (isCli) {
  refreshUniversePrices().then((payload) => {
    console.log(`Universo consultado: ${payload.counts.total}`);
    console.log(`Precios resueltos: ${payload.counts.resolved}`);
    console.log(`Pendientes: ${payload.counts.unresolved}`);
    console.log(`Snapshot guardado: ${payload.filePath}`);
    if (payload.dbSkipped) console.log("PostgreSQL omitido: DATABASE_URL no configurado.");
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

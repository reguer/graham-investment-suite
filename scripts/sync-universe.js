import { tickerUniverse } from "../src/tools/watchlist/universe.js";
import { loadPublicCompanies, normalizeCompany, runPsql, savePublicCompanies, upsertCompanySql } from "./db-client.js";

const DEFAULT_DB_CHUNK_SIZE = 25;

export function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
  };
}

export function buildUniverseSyncPayload(items = tickerUniverse) {
  const byTicker = new Map();
  const duplicateTickers = [];
  for (const item of items) {
    const company = normalizeCompany({
      ...item,
      analysisStatus: item.analysisStatus || "pending_fundamentals",
      validationStatus: item.validationStatus || "needs_yahoo_validation",
      source: item.source || "universe.js",
      tags: item.tags?.length ? item.tags : [item.market === "BMV SIC" ? "bmv-sic" : "universe", "pending-analysis"],
      notes: item.notes || "Universo sincronizado para ingesta local Yahoo/PostgreSQL.",
    });
    if (byTicker.has(company.ticker)) {
      duplicateTickers.push(company.ticker);
      continue;
    }
    byTicker.set(company.ticker, company);
  }
  return { companies: [...byTicker.values()], duplicateTickers };
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function isPlaceholderText(value, fallbacks = []) {
  if (isBlank(value)) return true;
  const normalized = String(value).trim().toUpperCase();
  return fallbacks
    .filter((item) => !isBlank(item))
    .some((item) => normalized === String(item).trim().toUpperCase());
}

function preferUniverseText(universeValue, existingValue, fallbacks = []) {
  if (isPlaceholderText(existingValue, fallbacks) && !isBlank(universeValue)) return universeValue;
  return existingValue || universeValue;
}

function preferUniverseYahooSymbol(company, existing) {
  const universeSymbol = company?.yahooSymbol;
  const existingSymbol = existing?.yahooSymbol;
  if (isBlank(universeSymbol)) return existingSymbol || universeSymbol;
  if (isBlank(existingSymbol)) return universeSymbol;

  const placeholderCandidates = [
    existing?.ticker,
    existing?.rawTicker,
    existing?.companyName,
  ];
  if (isPlaceholderText(existingSymbol, placeholderCandidates)) return universeSymbol;
  return existingSymbol;
}

function shouldPreserveSnapshot(existing) {
  return (
    existing?.analysisStatus === "analyzed" ||
    existing?.analysisStatus === "index_reference" ||
    existing?.analysisStatus === "market_reference" ||
    existing?.analysisStatus === "analysis_external_pending" ||
    existing?.validationStatus === "index_reference" ||
    existing?.validationStatus === "market_reference" ||
    existing?.validationStatus === "source_required" ||
    existing?.pe !== undefined ||
    existing?.pb !== undefined ||
    existing?.classificationId
  );
}

export function mergeUniverseWithPublic(companies, existingCompanies = loadPublicCompanies()) {
  const byTicker = new Map(existingCompanies.map((company) => [company.ticker.toUpperCase(), company]));
  for (const company of companies) {
    const existing = byTicker.get(company.ticker.toUpperCase());
    if (shouldPreserveSnapshot(existing)) {
      const PLACEHOLDER_SECTORS = ["Solicitados", "Sin sector", ""];
      const sectorFromUniverse = !PLACEHOLDER_SECTORS.includes(company.sector) ? company.sector : existing.sector;
      const industryFromUniverse = !PLACEHOLDER_SECTORS.includes(company.industry) && company.industry !== "Sin industria" ? company.industry : existing.industry;
      byTicker.set(company.ticker, {
        ...company,
        ...existing,
        yahooSymbol: preferUniverseYahooSymbol(company, existing),
        rawTicker: preferUniverseText(company.rawTicker, existing.rawTicker, [existing.ticker]),
        companyName: preferUniverseText(company.companyName, existing.companyName, [existing.ticker, existing.rawTicker]),
        market: preferUniverseText(company.market, existing.market, ["US"]),
        exchange: preferUniverseText(company.exchange, existing.exchange),
        sector: sectorFromUniverse || existing.sector || company.sector,
        industry: industryFromUniverse || existing.industry || company.industry,
        quoteType: preferUniverseText(company.quoteType, existing.quoteType),
      });
    } else {
      byTicker.set(company.ticker, { ...(existing || {}), ...company });
    }
  }
  return [...byTicker.values()];
}

export function syncUniverse({ dryRun = false } = {}) {
  const { companies, duplicateTickers } = buildUniverseSyncPayload();
  if (dryRun) return { companies, duplicateTickers, publicCount: 0, dbResult: { dryRun: true } };

  const publicCompanies = savePublicCompanies(mergeUniverseWithPublic(companies));
  let dbResult = { ok: true, skipped: false };
  let dbSkipped = false;
  for (let index = 0; index < companies.length; index += DEFAULT_DB_CHUNK_SIZE) {
    const chunk = companies.slice(index, index + DEFAULT_DB_CHUNK_SIZE);
    const result = runPsql(chunk.map(upsertCompanySql).join("\n"));
    if (result.skipped) dbSkipped = true;
    dbResult = result;
  }
  if (dbSkipped) dbResult = { ok: false, skipped: true, reason: "DATABASE_URL no configurado. No se escribio en PostgreSQL." };
  return { companies, duplicateTickers, publicCount: publicCompanies.length, dbResult };
}

const isCli = process.argv[1] && process.argv[1].endsWith("sync-universe.js");
if (isCli) {
  try {
    const args = parseArgs(process.argv);
    const result = syncUniverse(args);
    console.log(`Universo sincronizado: ${result.companies.length}`);
    console.log(`Export publico: ${result.publicCount}`);
    if (result.duplicateTickers.length) console.log(`Duplicados omitidos: ${result.duplicateTickers.join(", ")}`);
    if (result.dbResult.skipped) console.log(result.dbResult.reason);
  } catch (error) {
    console.error(`No se pudo sincronizar universo: ${error.message}`);
    process.exit(1);
  }
}

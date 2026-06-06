import { readFileSync, writeFileSync } from "node:fs";
import { classify } from "../src/tools/graham-analyzer/classify.js";
import { fetchMarketQuotes } from "../src/tools/watchlist/priceSources.js";
import { buildSecGrahamSnapshot, fetchSecCompanyFacts, fetchSecTickerMap, hasMinimumGrahamSnapshot } from "../src/tools/watchlist/secFundamentals.js";
import { watchlist } from "../src/tools/watchlist/watchlist.js";
import { PUBLIC_COMPANIES_PATH, normalizeCompany, runPsql, upsertCompanySql, upsertFinancialSnapshotSql } from "./db-client.js";

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function parseArgs(argv) {
  const args = { mode: "pending", limit: Infinity };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--all") args.mode = "all";
    if (argv[index] === "--pending") args.mode = "pending";
    if (argv[index] === "--ticker") args.ticker = String(argv[index + 1] || "").toUpperCase();
    if (argv[index] === "--limit") args.limit = Number(argv[index + 1] || Infinity);
  }
  return args;
}

function selectTargets(items, args) {
  let targets = items;
  if (args.ticker) targets = targets.filter((item) => item.ticker.toUpperCase() === args.ticker);
  if (args.mode === "pending") targets = targets.filter((item) => item.analysisStatus !== "analyzed");
  return targets.slice(0, args.limit);
}

function loadPublicRecords() {
  try {
    return JSON.parse(readFileSync(PUBLIC_COMPANIES_PATH, "utf8"));
  } catch {
    return [];
  }
}

function savePublicRecords(records) {
  const sorted = records.sort((a, b) => a.ticker.localeCompare(b.ticker));
  writeFileSync(PUBLIC_COMPANIES_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  return sorted;
}

function mergePublicAnalysis(results) {
  const byTicker = new Map(loadPublicRecords().map((item) => [item.ticker.toUpperCase(), item]));
  for (const result of results) {
    const base = byTicker.get(result.ticker.toUpperCase()) || normalizeCompany(result);
    byTicker.set(result.ticker.toUpperCase(), {
      ...base,
      ...result.publicRecord,
    });
  }
  return savePublicRecords([...byTicker.values()]);
}

function persistDatabase(results) {
  let skipped = false;
  for (const result of results) {
    const statements = [upsertCompanySql(result.publicRecord)];
    if (result.snapshot) {
      statements.push(upsertFinancialSnapshotSql({
        ticker: result.ticker,
        snapshotDate: result.snapshot.sourceDate,
        ...result.snapshot,
        classificationId: result.classification?.id,
        classificationLabel: result.classification?.label,
        source: result.snapshot.source,
        notes: result.publicRecord.notes,
      }));
    }
    const dbResult = runPsql(statements.join("\n"));
    if (dbResult.skipped) skipped = true;
  }
  return { ok: !skipped, skipped };
}

function unsupportedResult(item, reason) {
  return {
    ticker: item.ticker,
    status: "unsupported",
    publicRecord: {
      ...item,
      analysisStatus: "analysis_unsupported",
      validationStatus: "unsupported_sec_analysis",
      source: item.source || "watchlist",
      sourceDate: todayIso(),
      notes: reason,
      watchReason: reason,
    },
  };
}

export async function analyzeWatchlist({ argv = process.argv, fetchImpl = fetch } = {}) {
  const args = parseArgs(argv);
  const targets = selectTargets(watchlist, args);
  const secMap = await fetchSecTickerMap(fetchImpl);
  const quoteTargets = targets
    .filter((item) => item.quoteType === "EQUITY" && secMap.has(item.ticker.toUpperCase()))
    .map((item) => ({ ticker: item.ticker, yahooSymbol: item.ticker }));
  const quotes = await fetchMarketQuotes(quoteTargets, fetchImpl);
  const results = [];

  for (const item of targets) {
    const ticker = item.ticker.toUpperCase();
    if (item.quoteType !== "EQUITY") {
      results.push(unsupportedResult(item, `No se analiza con Graham automatico: quoteType=${item.quoteType}.`));
      continue;
    }
    const secCompany = secMap.get(ticker);
    if (!secCompany) {
      results.push(unsupportedResult(item, "No se encontro CIK en SEC para analisis automatico."));
      continue;
    }
    const quote = quotes[ticker];
    if (!quote?.price) {
      results.push(unsupportedResult(item, "No se obtuvo precio USD del ticker base para analisis automatico."));
      continue;
    }

    try {
      const facts = await fetchSecCompanyFacts(secCompany.cik, fetchImpl);
      const snapshot = buildSecGrahamSnapshot(facts, quote.price);
      if (!hasMinimumGrahamSnapshot(snapshot)) {
        results.push(unsupportedResult(item, "SEC no devolvio campos minimos para ratios Graham."));
        continue;
      }
      const classification = classify(snapshot);
      results.push({
        ticker,
        status: "analyzed",
        snapshot,
        classification,
        publicRecord: {
          ...item,
          companyName: item.companyName || secCompany.title,
          yahooSymbol: ticker,
          market: "US",
          currency: "USD",
          source: snapshot.source,
          sourceDate: snapshot.sourceDate,
          analysisStatus: "analyzed",
          validationStatus: "sec_auto_snapshot",
          price: snapshot.price,
          pe: snapshot.pe,
          pb: snapshot.pb,
          pePb: snapshot.pePb,
          debtRatio: snapshot.debtRatio,
          currentRatio: snapshot.currentRatio,
          quickRatio: snapshot.quickRatio,
          fcf: snapshot.fcf,
          epsAllPositive: snapshot.epsAllPositive,
          epsGrowing: snapshot.epsGrowing,
          classificationId: classification.id,
          classificationLabel: classification.label,
          notes: classification.reason,
          watchReason: classification.reason,
          secSnapshot: snapshot.sec,
          epsHistory: snapshot.epsHistory,
        },
      });
    } catch (error) {
      results.push(unsupportedResult(item, `Fallo analisis SEC: ${error.message}`));
    }
  }

  mergePublicAnalysis(results);
  const dbResult = persistDatabase(results);
  return {
    total: targets.length,
    analyzed: results.filter((item) => item.status === "analyzed").length,
    unsupported: results.filter((item) => item.status === "unsupported").length,
    dbSkipped: Boolean(dbResult.skipped),
    results,
  };
}

const isCli = process.argv[1] && process.argv[1].endsWith("analyze-watchlist.js");
if (isCli) {
  analyzeWatchlist().then((summary) => {
    console.log(`Empresas procesadas: ${summary.total}`);
    console.log(`Analizadas: ${summary.analyzed}`);
    console.log(`No soportadas/fallidas: ${summary.unsupported}`);
    if (summary.dbSkipped) console.log("PostgreSQL omitido: DATABASE_URL no configurado.");
  }).catch((error) => {
    console.error(`No se pudo analizar watchlist: ${error.message}`);
    process.exit(1);
  });
}

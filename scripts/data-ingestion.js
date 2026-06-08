import { readFileSync, writeFileSync } from "node:fs";
import { classify } from "../src/tools/graham-analyzer/classify.js";
import { fetchYahooFundamentals, buildYahooSupplementalSnapshot } from "../src/tools/watchlist/yahooFundamentals.js";
import { PUBLIC_COMPANIES_PATH, normalizeCompany, runPsql, upsertCompanySql, upsertFinancialSnapshotSql } from "./db-client.js";

export function parseArgs(argv) {
  const args = { mode: "unsupported", limit: Infinity, expectedCurrency: "USD" };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--all-unsupported") args.mode = "unsupported";
    if (argv[index] === "--ticker") args.ticker = String(argv[index + 1] || "").toUpperCase();
    if (argv[index] === "--limit") args.limit = Number(argv[index + 1] || Infinity);
    if (argv[index] === "--expected-currency") args.expectedCurrency = String(argv[index + 1] || "USD").toUpperCase();
  }
  return args;
}

function loadPublicRecords() {
  return JSON.parse(readFileSync(PUBLIC_COMPANIES_PATH, "utf8"));
}

function savePublicRecords(records) {
  const sorted = records.sort((a, b) => a.ticker.localeCompare(b.ticker));
  writeFileSync(PUBLIC_COMPANIES_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  return sorted;
}

function selectTargets(records, args) {
  let targets = records;
  if (args.ticker) targets = targets.filter((item) => item.ticker.toUpperCase() === args.ticker);
  if (!args.ticker && args.mode === "unsupported") {
    targets = targets.filter((item) => item.analysisStatus === "analysis_unsupported");
  }
  return targets
    .filter((item) => item.quoteType === "EQUITY")
    .slice(0, args.limit);
}

function persist(result) {
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
  return runPsql(statements.join("\n"));
}

export async function ingestYahooSupplemental({ argv = process.argv, fetcher = fetchYahooFundamentals } = {}) {
  const args = parseArgs(argv);
  const records = loadPublicRecords();
  const byTicker = new Map(records.map((item) => [item.ticker.toUpperCase(), item]));
  const targets = selectTargets(records, args);
  const results = [];
  let dbSkipped = false;

  for (const item of targets) {
    const ticker = item.ticker.toUpperCase();
    const symbol = item.yahooSymbol || item.yahoo_symbol || ticker;
    try {
      const raw = await fetcher(symbol);
      const built = buildYahooSupplementalSnapshot(raw, { symbol, expectedCurrency: args.expectedCurrency });
      if (!built.ok) {
        const next = {
          ...item,
          sourceDate: new Date().toISOString().slice(0, 10),
          validationStatus: built.currency?.ok === false ? "currency_rejected" : "yahoo_partial_incomplete",
          notes: built.reason,
          watchReason: built.reason,
        };
        byTicker.set(ticker, next);
        results.push({ ticker, status: "skipped", reason: built.reason });
        persist({ ticker, publicRecord: next });
        continue;
      }

      const classification = classify(built.snapshot);
      const notes = [
        built.reason,
        ...built.warnings,
        classification.reason,
      ].filter(Boolean).join(" ");
      const normalized = normalizeCompany({
        ...item,
        ticker,
        yahooSymbol: symbol,
        source: built.snapshot.source,
        sourceDate: built.snapshot.sourceDate,
        analysisStatus: "analysis_partial_yahoo",
        validationStatus: "yahoo_partial_usd",
      });
      const publicRecord = {
        ...item,
        ...normalized,
        price: built.snapshot.price,
        pe: built.snapshot.pe,
        pb: built.snapshot.pb,
        pePb: built.snapshot.pePb,
        debtRatio: built.snapshot.debtRatio,
        currentRatio: built.snapshot.currentRatio,
        quickRatio: built.snapshot.quickRatio,
        fcf: built.snapshot.fcf,
        epsAllPositive: built.snapshot.epsAllPositive,
        epsGrowing: built.snapshot.epsGrowing,
        classificationId: classification.id,
        classificationLabel: classification.label,
        notes,
        watchReason: notes,
      };
      byTicker.set(ticker, publicRecord);
      const dbResult = persist({ ticker, snapshot: built.snapshot, classification, publicRecord });
      if (dbResult.skipped) dbSkipped = true;
      results.push({ ticker, status: "partial", classification: classification.id });
    } catch (error) {
      const next = {
        ...item,
        sourceDate: new Date().toISOString().slice(0, 10),
        validationStatus: "yahoo_fetch_failed",
        notes: `Yahoo complementario fallo: ${error.message}`,
        watchReason: `Yahoo complementario fallo: ${error.message}`,
      };
      byTicker.set(ticker, next);
      results.push({ ticker, status: "failed", reason: error.message });
      const dbResult = persist({ ticker, publicRecord: next });
      if (dbResult.skipped) dbSkipped = true;
    }
  }

  savePublicRecords([...byTicker.values()]);
  return {
    total: targets.length,
    partial: results.filter((item) => item.status === "partial").length,
    skipped: results.filter((item) => item.status === "skipped").length,
    failed: results.filter((item) => item.status === "failed").length,
    dbSkipped,
    results,
  };
}

const isCli = process.argv[1] && process.argv[1].endsWith("data-ingestion.js");
if (isCli) {
  ingestYahooSupplemental().then((summary) => {
    console.log(`Yahoo complementario procesado: ${summary.total}`);
    console.log(`Snapshots parciales USD: ${summary.partial}`);
    console.log(`Omitidas por datos/moneda: ${summary.skipped}`);
    console.log(`Fallidas: ${summary.failed}`);
    if (summary.dbSkipped) console.log("PostgreSQL omitido: DATABASE_URL no configurado.");
  }).catch((error) => {
    console.error(`No se pudo correr ingesta Yahoo: ${error.message}`);
    process.exit(1);
  });
}

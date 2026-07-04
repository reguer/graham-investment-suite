import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { classify } from "../src/tools/graham-analyzer/classify.js";
import { detectSector } from "../src/tools/graham-analyzer/detectSector.js";
import { getSectorProfile } from "../src/tools/graham-analyzer/sectorProfiles.js";
import { actionableReason } from "../src/tools/graham-analyzer/failingCriteria.js";
import { fetchYahooFundamentals, fetchYahooDeepFundamentals, buildYahooSupplementalSnapshot, buildYahooDeepSnapshot } from "../src/tools/watchlist/yahooFundamentals.js";
import { fetchSecTickerMap, fetchSecCompanyFacts, buildSecGrahamSnapshot, hasMinimumGrahamSnapshot, fetchSecSicCode } from "../src/tools/watchlist/secFundamentals.js";
import { fetchYahooChartQuote } from "../src/tools/watchlist/priceSources.js";
import { businessNoteFor } from "../src/tools/watchlist/notes.js";
import { PUBLIC_COMPANIES_PATH, normalizeCompany, runPsql, upsertCompanySql, upsertFinancialSnapshotSql } from "./db-client.js";

export function parseArgs(argv) {
  const args = { mode: "incomplete", limit: Infinity, expectedCurrency: "USD" };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--all-unsupported") args.mode = "incomplete";
    if (argv[index] === "--unsupported-only") args.mode = "unsupported";
    // --all (alias --refresh-analyzed): re-procesa TODO el universo, incluidas las
    // empresas ya "analyzed" — necesario para rellenar roe/roa/tie/sicCode que
    // quedaron vacíos en registros analizados antes del fix de persistencia.
    if (argv[index] === "--all" || argv[index] === "--refresh-analyzed") args.mode = "all";
    if (argv[index] === "--ticker") args.ticker = String(argv[index + 1] || "").toUpperCase();
    if (argv[index] === "--limit") args.limit = Number(argv[index + 1] || Infinity);
    if (argv[index] === "--expected-currency") args.expectedCurrency = String(argv[index + 1] || "USD").toUpperCase();
  }
  return args;
}

// Resolve the sector profile and classify a snapshot the same way the manual
// analyzer and the runtime screen do, so the persisted verdict is sector-aware
// (not industrial defaults applied to banks/utilities/tech).
function classifyWithSector(item, snapshot) {
  const profile = getSectorProfile(
    detectSector({ sector: item.sector, industry: item.industry, sicCode: snapshot.sicCode ?? item.sicCode }),
  );
  return { profile, classification: classify(snapshot, profile) };
}

// Single source of truth for the persisted financial fields, so every ingestion
// branch writes the FULL set — including roe/roa/tie/sicCode, which were computed
// upstream but never persisted (hence 100% empty in companies.json). Missing
// numeric fields stay null (honest N/D) rather than being dropped from the record.
function financialFields(snapshot) {
  return {
    price: snapshot.price ?? null,
    pe: snapshot.pe ?? null,
    pb: snapshot.pb ?? null,
    pePb: snapshot.pePb ?? null,
    pbTangible: snapshot.pbTangible ?? null,
    pePbTangible: snapshot.pePbTangible ?? null,
    tangibleBvps: snapshot.tangibleBvps ?? null,
    debtRatio: snapshot.debtRatio ?? null,
    currentRatio: snapshot.currentRatio ?? null,
    quickRatio: snapshot.quickRatio ?? null,
    fcf: snapshot.fcf ?? null,
    roe: snapshot.roe ?? null,
    roa: snapshot.roa ?? null,
    tie: snapshot.tie === Infinity ? null : snapshot.tie ?? null,
    epsAllPositive: snapshot.epsAllPositive ?? null,
    epsGrowing: snapshot.epsGrowing ?? null,
    epsHistory: snapshot.epsHistory ?? [],
    sicCode: snapshot.sicCode ?? null,
    marketCap: snapshot.marketCap ?? null,
    avgVolume: snapshot.avgVolume ?? null,
    hasNegativeEquity: snapshot.hasNegativeEquity ?? null,
    sourcePeriod: snapshot.sourcePeriod || null,
  };
}

function loadPublicRecords() {
  return JSON.parse(readFileSync(PUBLIC_COMPANIES_PATH, "utf8"));
}

function savePublicRecords(records) {
  const sorted = records.sort((a, b) => a.ticker.localeCompare(b.ticker));
  writeFileSync(PUBLIC_COMPANIES_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  mkdirSync(join(process.cwd(), "public", "data"), { recursive: true });
  writeFileSync(join(process.cwd(), "public", "data", "companies.json"), `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  return sorted;
}

function selectTargets(records, args) {
  let targets = records;
  if (args.ticker) targets = targets.filter((item) => item.ticker.toUpperCase() === args.ticker);
  if (!args.ticker && args.mode === "unsupported") {
    targets = targets.filter((item) => item.analysisStatus === "analysis_unsupported");
  } else if (!args.ticker && args.mode === "incomplete") {
    targets = targets.filter((item) => item.analysisStatus !== "analyzed");
  }
  // mode === "all": no status filter — re-procesa también las "analyzed".
  return targets
    .filter((item) => item.quoteType === "EQUITY")
    .slice(0, args.limit);
}

export function buildSymbolCandidates(item, ticker) {
  return [...new Set([
    item.yahooSymbol || item.yahoo_symbol || ticker,
    ticker,
  ].filter(Boolean))];
}

async function fetchBuiltSnapshot(symbols, { fetcher, deepFetcher, expectedCurrency }) {
  let lastError = null;
  for (const symbol of symbols) {
    try {
      try {
        return {
          symbol,
          built: buildYahooDeepSnapshot(await deepFetcher(symbol, { expectedCurrency })),
        };
      } catch (deepError) {
        lastError = deepError;
        const raw = await fetcher(symbol);
        return {
          symbol,
          built: buildYahooSupplementalSnapshot(raw, { symbol, expectedCurrency }),
        };
      }
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No se pudo consultar Yahoo Finance.");
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

// Intenta obtener fundamentales desde SEC EDGAR + precio Yahoo Chart cuando Yahoo falló o entregó datos incompletos.
// Devuelve { snapshot, notes } si tuvo éxito, o null si SEC tampoco tiene datos suficientes.
async function trySecFallback(ticker, yahooSymbol) {
  try {
    const secTickerMap = await fetchSecTickerMap();
    const secEntry = secTickerMap.get(ticker.toUpperCase());
    if (!secEntry) return null;

    const priceResult = await fetchYahooChartQuote({ ticker, yahooSymbol: yahooSymbol || ticker });
    const price = priceResult?.price;
    if (!price || !Number.isFinite(price)) return null;

    const companyFacts = await fetchSecCompanyFacts(secEntry.cik);
    // Pull the real SIC code (sector signal) from SEC submissions; tolerate failure.
    const sicCode = await fetchSecSicCode(secEntry.cik).catch(() => null);
    const snapshot = buildSecGrahamSnapshot(companyFacts, price, { sicCode });
    if (!hasMinimumGrahamSnapshot(snapshot) && !snapshot.pe && !snapshot.pb) return null;

    return {
      snapshot,
      notes: `Fundamentales SEC EDGAR (${secEntry.cik}); precio Yahoo Chart. ${snapshot.source}`,
    };
  } catch {
    return null;
  }
}

export async function ingestYahooSupplemental({ argv = process.argv, fetcher = fetchYahooFundamentals, deepFetcher = fetchYahooDeepFundamentals } = {}) {
  const args = parseArgs(argv);
  const records = loadPublicRecords();
  const byTicker = new Map(records.map((item) => [item.ticker.toUpperCase(), item]));
  const targets = selectTargets(records, args);
  const results = [];
  let dbSkipped = false;

  for (const item of targets) {
    const ticker = item.ticker.toUpperCase();
    let symbol = item.yahooSymbol || item.yahoo_symbol || ticker;
    try {
      const fetched = await fetchBuiltSnapshot(buildSymbolCandidates(item, ticker), {
        fetcher,
        deepFetcher,
        expectedCurrency: args.expectedCurrency,
      });
      symbol = fetched.symbol;
      const built = fetched.built;
      if (!built.ok) {
        const snapshot = built.snapshot || null;
        const hasDisqualifyingSnapshot = snapshot?.price && (
          snapshot.pe === null ||
          snapshot.pb === null ||
          snapshot.currentRatio === null ||
          snapshot.debtRatio === null
        );
        if (hasDisqualifyingSnapshot) {
          // Intentar completar los datos faltantes con SEC EDGAR antes de rechazar
          const secResult = await trySecFallback(ticker, item.yahooSymbol || item.yahoo_symbol);
          if (secResult) {
            // Fill missing fields from SEC (alternate source): ratios AND the
            // quality/sector signals (roe/roa/tie/sicCode) Yahoo may have left null.
            const merged = {
              ...snapshot,
              debtRatio: snapshot.debtRatio ?? secResult.snapshot.debtRatio,
              currentRatio: snapshot.currentRatio ?? secResult.snapshot.currentRatio,
              quickRatio: snapshot.quickRatio ?? secResult.snapshot.quickRatio,
              fcf: snapshot.fcf ?? secResult.snapshot.fcf,
              roe: snapshot.roe ?? secResult.snapshot.roe,
              roa: snapshot.roa ?? secResult.snapshot.roa,
              tie: snapshot.tie ?? secResult.snapshot.tie,
              pbTangible: snapshot.pbTangible ?? secResult.snapshot.pbTangible,
              pePbTangible: snapshot.pePbTangible ?? secResult.snapshot.pePbTangible,
              tangibleBvps: snapshot.tangibleBvps ?? secResult.snapshot.tangibleBvps,
              sicCode: snapshot.sicCode ?? secResult.snapshot.sicCode,
              epsAllPositive: snapshot.epsAllPositive ?? secResult.snapshot.epsAllPositive,
              epsGrowing: snapshot.epsGrowing ?? secResult.snapshot.epsGrowing,
              epsHistory: (snapshot.epsHistory?.length > 0 ? snapshot.epsHistory : secResult.snapshot.epsHistory) || [],
              source: `${snapshot.source || "Yahoo"} + ${secResult.snapshot.source}`,
            };
            const { profile, classification } = classifyWithSector(item, merged);
            const watchReason = actionableReason(merged, profile);
            const publicRecord = {
              ...item,
              ...financialFields(merged),
              source: merged.source,
              sourceDate: merged.sourceDate || new Date().toISOString().slice(0, 10),
              analysisStatus: "analyzed",
              validationStatus: "yahoo_sec_merged",
              sectorProfileId: profile.id,
              classificationId: classification.id,
              classificationLabel: classification.label,
              watchReason,
              notes: watchReason,
              autoAnalysisNote: undefined,
            };
            byTicker.set(ticker, publicRecord);
            const dbResult = persist({ ticker, snapshot: merged, classification, publicRecord });
            if (dbResult.skipped) dbSkipped = true;
            results.push({ ticker, status: "sec_merged", classification: classification.id });
            continue;
          }
          const { profile, classification } = classifyWithSector(item, snapshot);
          const watchReason = actionableReason(snapshot, profile);
          const publicRecord = {
            ...item,
            ...financialFields(snapshot),
            source: snapshot.source,
            sourceDate: snapshot.sourceDate,
            analysisStatus: "analyzed",
            validationStatus: "yahoo_model_rejected",
            sectorProfileId: profile.id,
            classificationId: classification.id,
            classificationLabel: classification.label,
            watchReason,
            notes: watchReason,
            autoAnalysisNote: undefined,
          };
          byTicker.set(ticker, publicRecord);
          const dbResult = persist({ ticker, snapshot, classification, publicRecord });
          if (dbResult.skipped) dbSkipped = true;
          results.push({ ticker, status: "rejected", reason: classification.reason });
          continue;
        }
        const note = businessNoteFor({ ...item, analysisStatus: "analysis_pending", watchReason: built.reason, notes: built.reason });
        const next = {
          ...item,
          sourceDate: new Date().toISOString().slice(0, 10),
          validationStatus: built.currency?.ok === false ? "currency_rejected" : "yahoo_partial_incomplete",
          notes: note,
          watchReason: note,
          autoAnalysisNote: built.reason,
        };
        byTicker.set(ticker, next);
        results.push({ ticker, status: "skipped", reason: built.reason });
        persist({ ticker, publicRecord: next });
        continue;
      }

      const { profile, classification } = classifyWithSector(item, built.snapshot);
      const watchReason = actionableReason(built.snapshot, profile);
      const normalized = normalizeCompany({
        ...item,
        ticker,
        yahooSymbol: item.yahooSymbol || item.yahoo_symbol || symbol,
        source: built.snapshot.source,
        sourceDate: built.snapshot.sourceDate,
        analysisStatus: built.snapshot?.epsHistory?.length >= 2 ? "analyzed" : "analysis_partial_yahoo",
        validationStatus: built.snapshot?.epsHistory?.length >= 2 ? "yahoo_full_fx" : "yahoo_partial_usd",
      });
      const publicRecord = {
        ...item,
        ...normalized,
        ...financialFields(built.snapshot),
        sectorProfileId: profile.id,
        classificationId: classification.id,
        classificationLabel: classification.label,
        watchReason,
        notes: watchReason,
        autoAnalysisNote: undefined,
      };
      byTicker.set(ticker, publicRecord);
      const dbResult = persist({ ticker, snapshot: built.snapshot, classification, publicRecord });
      if (dbResult.skipped) dbSkipped = true;
      results.push({ ticker, status: "partial", classification: classification.id });
    } catch (error) {
      // Yahoo falló completamente — intentar SEC EDGAR como fuente alternativa
      const secResult = await trySecFallback(ticker, item.yahooSymbol || item.yahoo_symbol);
      if (secResult) {
        const { profile, classification } = classifyWithSector(item, secResult.snapshot);
        const watchReason = actionableReason(secResult.snapshot, profile);
        const publicRecord = {
          ...item,
          ...financialFields(secResult.snapshot),
          source: secResult.snapshot.source,
          sourceDate: secResult.snapshot.sourceDate,
          analysisStatus: secResult.snapshot.epsHistory?.length >= 2 ? "analyzed" : "analysis_partial_sec",
          validationStatus: "sec_edgar_fallback",
          sectorProfileId: profile.id,
          classificationId: classification.id,
          classificationLabel: classification.label,
          secSnapshot: secResult.snapshot.sec,
          watchReason,
          notes: watchReason,
          autoAnalysisNote: undefined,
        };
        byTicker.set(ticker, publicRecord);
        results.push({ ticker, status: "sec_fallback", classification: classification.id });
        const dbResult = persist({ ticker, snapshot: secResult.snapshot, classification, publicRecord });
        if (dbResult.skipped) dbSkipped = true;
        continue;
      }
      const technicalNote = `Yahoo y SEC EDGAR sin datos suficientes: ${error.message}`;
      const note = businessNoteFor({ ...item, analysisStatus: "analysis_pending", watchReason: technicalNote, notes: technicalNote });
      const next = {
        ...item,
        sourceDate: new Date().toISOString().slice(0, 10),
        validationStatus: "yahoo_fetch_failed",
        notes: note,
        watchReason: note,
        autoAnalysisNote: technicalNote,
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
    analyzed: results.filter((item) => item.status === "partial" || item.status === "sec_fallback" || item.status === "sec_merged").length,
    partial: results.filter((item) => item.status === "partial").length,
    secFallback: results.filter((item) => item.status === "sec_fallback").length,
    secMerged: results.filter((item) => item.status === "sec_merged").length,
    rejected: results.filter((item) => item.status === "rejected").length,
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
    console.log(`Snapshots Yahoo USD/FX: ${summary.partial}`);
    if (summary.secFallback) console.log(`Recuperadas via SEC EDGAR (fallback): ${summary.secFallback}`);
    if (summary.secMerged) console.log(`Completadas Yahoo+SEC EDGAR (merge): ${summary.secMerged}`);
    console.log(`Rechazadas por modelo (ambas fuentes): ${summary.rejected}`);
    console.log(`Omitidas por datos/moneda: ${summary.skipped}`);
    console.log(`Fallidas: ${summary.failed}`);
    if (summary.dbSkipped) console.log("PostgreSQL omitido: DATABASE_URL no configurado.");
  }).catch((error) => {
    console.error(`No se pudo correr ingesta Yahoo: ${error.message}`);
    process.exit(1);
  });
}

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { classify } from "../src/tools/graham-analyzer/classify.js";
import { fetchYahooFundamentals, fetchYahooDeepFundamentals, buildYahooSupplementalSnapshot, buildYahooDeepSnapshot } from "../src/tools/watchlist/yahooFundamentals.js";
import { fetchSecTickerMap, fetchSecCompanyFacts, buildSecGrahamSnapshot, hasMinimumGrahamSnapshot } from "../src/tools/watchlist/secFundamentals.js";
import { fetchYahooChartQuote } from "../src/tools/watchlist/priceSources.js";
import { PUBLIC_COMPANIES_PATH, normalizeCompany, runPsql, upsertCompanySql, upsertFinancialSnapshotSql } from "./db-client.js";

export function parseArgs(argv) {
  const args = { mode: "incomplete", limit: Infinity, expectedCurrency: "USD" };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--all-unsupported") args.mode = "incomplete";
    if (argv[index] === "--unsupported-only") args.mode = "unsupported";
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
    const snapshot = buildSecGrahamSnapshot(companyFacts, price);
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
            const merged = {
              ...snapshot,
              debtRatio: snapshot.debtRatio ?? secResult.snapshot.debtRatio,
              currentRatio: snapshot.currentRatio ?? secResult.snapshot.currentRatio,
              quickRatio: snapshot.quickRatio ?? secResult.snapshot.quickRatio,
              fcf: snapshot.fcf ?? secResult.snapshot.fcf,
              epsAllPositive: snapshot.epsAllPositive ?? secResult.snapshot.epsAllPositive,
              epsGrowing: snapshot.epsGrowing ?? secResult.snapshot.epsGrowing,
              epsHistory: (snapshot.epsHistory?.length > 0 ? snapshot.epsHistory : secResult.snapshot.epsHistory) || [],
              source: `${snapshot.source || "Yahoo"} + ${secResult.snapshot.source}`,
            };
            const classification = classify(merged);
            const notes = [built.reason, secResult.notes, classification.reason].filter(Boolean).join(" ");
            const publicRecord = {
              ...item,
              source: merged.source,
              sourceDate: merged.sourceDate || new Date().toISOString().slice(0, 10),
              analysisStatus: "analyzed",
              validationStatus: "yahoo_sec_merged",
              price: merged.price,
              pe: merged.pe,
              pb: merged.pb,
              pePb: merged.pePb,
              debtRatio: merged.debtRatio,
              currentRatio: merged.currentRatio,
              quickRatio: merged.quickRatio,
              fcf: merged.fcf,
              epsAllPositive: merged.epsAllPositive,
              epsGrowing: merged.epsGrowing,
              epsHistory: merged.epsHistory,
              classificationId: classification.id,
              classificationLabel: classification.label,
              notes,
              watchReason: notes,
            };
            byTicker.set(ticker, publicRecord);
            const dbResult = persist({ ticker, snapshot: merged, classification, publicRecord });
            if (dbResult.skipped) dbSkipped = true;
            results.push({ ticker, status: "sec_merged", classification: classification.id });
            continue;
          }
          const classification = classify(snapshot);
          const notes = [
            built.reason,
            ...(built.warnings || []),
            "Yahoo y SEC EDGAR sin ratios completos para aprobacion Graham defensiva.",
            classification.reason,
          ].filter(Boolean).join(" ");
          const publicRecord = {
            ...item,
            source: snapshot.source,
            sourceDate: snapshot.sourceDate,
            analysisStatus: "analyzed",
            validationStatus: "yahoo_model_rejected",
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
            notes,
            watchReason: notes,
          };
          byTicker.set(ticker, publicRecord);
          const dbResult = persist({ ticker, snapshot, classification, publicRecord });
          if (dbResult.skipped) dbSkipped = true;
          results.push({ ticker, status: "rejected", reason: built.reason });
          continue;
        }
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
        symbol !== (item.yahooSymbol || item.yahoo_symbol || ticker) ? `Fundamentales obtenidos con simbolo Yahoo base ${symbol}.` : "",
      ].filter(Boolean).join(" ");
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
      // Yahoo falló completamente — intentar SEC EDGAR como fuente alternativa
      const secResult = await trySecFallback(ticker, item.yahooSymbol || item.yahoo_symbol);
      if (secResult) {
        const classification = classify(secResult.snapshot);
        const notes = [`Yahoo fallo: ${error.message}.`, secResult.notes, classification.reason].filter(Boolean).join(" ");
        const publicRecord = {
          ...item,
          source: secResult.snapshot.source,
          sourceDate: secResult.snapshot.sourceDate,
          analysisStatus: secResult.snapshot.epsHistory?.length >= 2 ? "analyzed" : "analysis_partial_sec",
          validationStatus: "sec_edgar_fallback",
          price: secResult.snapshot.price,
          pe: secResult.snapshot.pe,
          pb: secResult.snapshot.pb,
          pePb: secResult.snapshot.pePb,
          debtRatio: secResult.snapshot.debtRatio,
          currentRatio: secResult.snapshot.currentRatio,
          quickRatio: secResult.snapshot.quickRatio,
          fcf: secResult.snapshot.fcf,
          epsAllPositive: secResult.snapshot.epsAllPositive,
          epsGrowing: secResult.snapshot.epsGrowing,
          epsHistory: secResult.snapshot.epsHistory || [],
          classificationId: classification.id,
          classificationLabel: classification.label,
          secSnapshot: secResult.snapshot.sec,
          notes,
          watchReason: notes,
        };
        byTicker.set(ticker, publicRecord);
        results.push({ ticker, status: "sec_fallback", classification: classification.id });
        const dbResult = persist({ ticker, snapshot: secResult.snapshot, classification, publicRecord });
        if (dbResult.skipped) dbSkipped = true;
        continue;
      }
      const next = {
        ...item,
        sourceDate: new Date().toISOString().slice(0, 10),
        validationStatus: "yahoo_fetch_failed",
        notes: `Yahoo y SEC EDGAR sin datos suficientes: ${error.message}`,
        watchReason: `Yahoo y SEC EDGAR sin datos suficientes: ${error.message}`,
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

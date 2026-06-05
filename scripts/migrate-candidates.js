import { grahamCandidates } from "../src/tools/graham-analyzer/candidates.js";
import { classify } from "../src/tools/graham-analyzer/classify.js";
import { runPsql, upsertCompanySql, upsertFinancialSnapshotSql, upsertPublicCompanies } from "./db-client.js";

function candidateToCompany(candidate) {
  return {
    ticker: candidate.ticker,
    yahooSymbol: candidate.yahooSymbol || candidate.ticker,
    companyName: candidate.companyName,
    market: candidate.market || "US",
    country: candidate.country || "USA",
    currency: candidate.currency || "USD",
    quoteType: "EQUITY",
    sector: candidate.sector,
    source: candidate.source,
    sourceDate: candidate.sourceDate,
    analysisStatus: "analyzed",
    validationStatus: "manual_snapshot",
    tags: candidate.tags || ["graham-approved"],
    notes: candidate.note,
  };
}

function candidateToSnapshot(candidate) {
  const classification = classify({
    pe: candidate.pe,
    pb: candidate.pb,
    pePb: candidate.pePb,
    debtRatio: candidate.debtRatio,
    currentRatio: candidate.currentRatio,
    quickRatio: candidate.quickRatio,
    fcf: candidate.fcf,
    epsAllPositive: candidate.epsAllPositive,
  });
  return {
    ...candidate,
    snapshotDate: candidate.sourceDate,
    classificationId: classification.id,
    classificationLabel: classification.label,
    notes: candidate.note,
  };
}

export function migrateCandidates({ dryRun = false } = {}) {
  const companies = grahamCandidates.map(candidateToCompany);
  const snapshots = grahamCandidates.map(candidateToSnapshot);
  const sql = [
    ...companies.map(upsertCompanySql),
    ...snapshots.map(upsertFinancialSnapshotSql),
  ].join("\n");
  const dbResult = runPsql(sql, { dryRun });
  const publicCompanies = dryRun ? [] : upsertPublicCompanies(companies);
  return { companies, snapshots, dbResult, publicCount: publicCompanies.length };
}

const isCli = process.argv[1] && process.argv[1].endsWith("migrate-candidates.js");
if (isCli) {
  try {
    const result = migrateCandidates({ dryRun: process.argv.includes("--dry-run") });
    console.log(`Candidatas migradas: ${result.companies.length}`);
    if (result.dbResult.skipped) console.log(result.dbResult.reason);
  } catch (error) {
    console.error(`No se pudo migrar candidates.js: ${error.message}`);
    process.exit(1);
  }
}

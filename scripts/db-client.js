import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

export const PUBLIC_COMPANIES_PATH = join(process.cwd(), "data", "public", "companies.json");

export function loadEnvLocal(path = ".env.local") {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

export function getDatabaseUrl(env = process.env) {
  return env.DATABASE_URL || loadEnvLocal().DATABASE_URL || "";
}

export function findPsqlPath(env = process.env) {
  if (env.PSQL_PATH && existsSync(env.PSQL_PATH)) return env.PSQL_PATH;
  const candidates = [
    "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
    "psql",
  ];
  return candidates.find((candidate) => candidate === "psql" || existsSync(candidate)) || "psql";
}

export function runPsql(sql, { databaseUrl = getDatabaseUrl(), psqlPath = findPsqlPath(), dryRun = false } = {}) {
  if (!databaseUrl) {
    return { ok: false, skipped: true, reason: "DATABASE_URL no configurado. No se escribio en PostgreSQL." };
  }
  if (dryRun) return { ok: true, dryRun: true, sql };

  const result = spawnSync(psqlPath, [databaseUrl, "-v", "ON_ERROR_STOP=1", "-c", sql], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, PGCLIENTENCODING: process.platform === "win32" ? "WIN1252" : "UTF8" },
    stdio: "pipe",
    shell: false,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return { ok: true, stdout: result.stdout };
}

export function getDatabaseName(databaseUrl = getDatabaseUrl()) {
  if (!databaseUrl) return "";
  return new URL(databaseUrl).pathname.replace(/^\//, "");
}

export function getMaintenanceDatabaseUrl(databaseUrl = getDatabaseUrl()) {
  if (!databaseUrl) return "";
  const url = new URL(databaseUrl);
  url.pathname = "/postgres";
  return url.toString();
}

export function createDatabaseIfMissing({ databaseUrl = getDatabaseUrl(), psqlPath = findPsqlPath(), dryRun = false } = {}) {
  const databaseName = getDatabaseName(databaseUrl);
  if (!databaseUrl || !databaseName) {
    return { ok: false, skipped: true, reason: "DATABASE_URL no configurado. No se creo la base." };
  }
  if (!/^[A-Za-z0-9_-]+$/.test(databaseName)) throw new Error(`Nombre de base invalido: ${databaseName}`);
  if (dryRun) return { ok: true, dryRun: true, databaseName };

  const maintenanceUrl = getMaintenanceDatabaseUrl(databaseUrl);
  const existsResult = spawnSync(psqlPath, [maintenanceUrl, "-v", "ON_ERROR_STOP=1", "-tAc", `SELECT 1 FROM pg_database WHERE datname = ${sqlString(databaseName)}`], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, PGCLIENTENCODING: process.platform === "win32" ? "WIN1252" : "UTF8" },
    stdio: "pipe",
    shell: false,
  });
  if (existsResult.error) throw existsResult.error;
  if (existsResult.status !== 0) throw new Error(existsResult.stderr || existsResult.stdout);
  if (existsResult.stdout.trim() === "1") return { ok: true, existed: true, databaseName };

  const createResult = spawnSync(psqlPath, [maintenanceUrl, "-v", "ON_ERROR_STOP=1", "-c", `CREATE DATABASE ${databaseName}`], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, PGCLIENTENCODING: process.platform === "win32" ? "WIN1252" : "UTF8" },
    stdio: "pipe",
    shell: false,
  });
  if (createResult.error) throw createResult.error;
  if (createResult.status !== 0) throw new Error(createResult.stderr || createResult.stdout);
  return { ok: true, created: true, databaseName };
}

export function sqlString(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function sqlNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "NULL";
}

export function normalizeCompany(input) {
  const ticker = String(input.ticker || input.rawTicker || "").trim().toUpperCase();
  if (!/^[A-Z0-9.^=_-]{1,24}$/.test(ticker)) throw new Error(`Ticker invalido: ${input.ticker || ""}`);
  return {
    ticker,
    yahooSymbol: input.yahooSymbol || input.yahoo_symbol || ticker,
    companyName: input.companyName || input.company_name || input.name || ticker,
    exchange: input.exchange || "",
    market: input.market || "",
    country: input.country || "",
    currency: input.currency || "",
    quoteType: input.quoteType || input.quote_type || "EQUITY",
    sector: input.sector || "",
    industry: input.industry || "",
    source: input.source || "manual",
    sourceDate: input.sourceDate || input.source_date || new Date().toISOString().slice(0, 10),
    analysisStatus: input.analysisStatus || input.analysis_status || "pending_fundamentals",
    validationStatus: input.validationStatus || input.validation_status || "needs_manual_review",
    tags: Array.isArray(input.tags) ? input.tags : String(input.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    notes: input.notes || input.note || "",
  };
}

export function upsertCompanySql(companyInput) {
  const company = normalizeCompany(companyInput);
  return `
INSERT INTO companies (
  ticker, yahoo_symbol, company_name, exchange, market, country, currency, quote_type,
  sector, industry, source, source_date, analysis_status, validation_status, tags, notes, updated_at
) VALUES (
  ${sqlString(company.ticker)}, ${sqlString(company.yahooSymbol)}, ${sqlString(company.companyName)},
  ${sqlString(company.exchange)}, ${sqlString(company.market)}, ${sqlString(company.country)},
  ${sqlString(company.currency)}, ${sqlString(company.quoteType)}, ${sqlString(company.sector)},
  ${sqlString(company.industry)}, ${sqlString(company.source)}, ${sqlString(company.sourceDate)},
  ${sqlString(company.analysisStatus)}, ${sqlString(company.validationStatus)},
  ${sqlString(JSON.stringify(company.tags))}, ${sqlString(company.notes)}, CURRENT_TIMESTAMP
)
ON CONFLICT (ticker) DO UPDATE SET
  yahoo_symbol = EXCLUDED.yahoo_symbol,
  company_name = EXCLUDED.company_name,
  exchange = EXCLUDED.exchange,
  market = EXCLUDED.market,
  country = EXCLUDED.country,
  currency = EXCLUDED.currency,
  quote_type = EXCLUDED.quote_type,
  sector = EXCLUDED.sector,
  industry = EXCLUDED.industry,
  source = EXCLUDED.source,
  source_date = EXCLUDED.source_date,
  analysis_status = EXCLUDED.analysis_status,
  validation_status = EXCLUDED.validation_status,
  tags = EXCLUDED.tags,
  notes = EXCLUDED.notes,
  updated_at = CURRENT_TIMESTAMP;`.trim();
}

export function upsertFinancialSnapshotSql(snapshot) {
  return `
INSERT INTO financial_snapshots (
  ticker, snapshot_date, price, pe, pb, pe_pb, debt_ratio, current_ratio, quick_ratio,
  fcf, eps_all_positive, eps_growing, classification_id, classification_label, source, notes
) VALUES (
  ${sqlString(snapshot.ticker)}, ${sqlString(snapshot.snapshotDate || snapshot.sourceDate)},
  ${sqlNumber(snapshot.price)}, ${sqlNumber(snapshot.pe)}, ${sqlNumber(snapshot.pb)},
  ${sqlNumber(snapshot.pePb)}, ${sqlNumber(snapshot.debtRatio)}, ${sqlNumber(snapshot.currentRatio)},
  ${sqlNumber(snapshot.quickRatio)}, ${sqlNumber(snapshot.fcf)}, ${snapshot.epsAllPositive === true ? "TRUE" : snapshot.epsAllPositive === false ? "FALSE" : "NULL"},
  ${snapshot.epsGrowing === true ? "TRUE" : snapshot.epsGrowing === false ? "FALSE" : "NULL"},
  ${sqlString(snapshot.classificationId)}, ${sqlString(snapshot.classificationLabel)},
  ${sqlString(snapshot.source)}, ${sqlString(snapshot.notes || snapshot.note)}
)
ON CONFLICT (ticker, snapshot_date, source) DO UPDATE SET
  price = EXCLUDED.price,
  pe = EXCLUDED.pe,
  pb = EXCLUDED.pb,
  pe_pb = EXCLUDED.pe_pb,
  debt_ratio = EXCLUDED.debt_ratio,
  current_ratio = EXCLUDED.current_ratio,
  quick_ratio = EXCLUDED.quick_ratio,
  fcf = EXCLUDED.fcf,
  eps_all_positive = EXCLUDED.eps_all_positive,
  eps_growing = EXCLUDED.eps_growing,
  classification_id = EXCLUDED.classification_id,
  classification_label = EXCLUDED.classification_label,
  notes = EXCLUDED.notes;`.trim();
}

export function loadPublicCompanies(path = PUBLIC_COMPANIES_PATH) {
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, "utf8"));
}

export function savePublicCompanies(companies, path = PUBLIC_COMPANIES_PATH) {
  mkdirSync(join(process.cwd(), "data", "public"), { recursive: true });
  const normalized = companies.map(normalizeCompany).sort((a, b) => a.ticker.localeCompare(b.ticker));
  writeFileSync(path, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

export function upsertPublicCompanies(newCompanies, path = PUBLIC_COMPANIES_PATH) {
  const byTicker = new Map(loadPublicCompanies(path).map((company) => [company.ticker, company]));
  for (const item of newCompanies) {
    const company = normalizeCompany(item);
    byTicker.set(company.ticker, { ...(byTicker.get(company.ticker) || {}), ...company });
  }
  return savePublicCompanies([...byTicker.values()], path);
}

import { runPsql, normalizeCompany, upsertCompanySql, upsertPublicCompanies } from "./db-client.js";

export function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) continue;
    args[key.slice(2)] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[index + 1] : true;
  }
  return args;
}

export function companyFromArgs(args) {
  return normalizeCompany({
    ticker: args.ticker,
    yahooSymbol: args.yahoo || args.yahooSymbol,
    companyName: args.name || args.companyName,
    exchange: args.exchange,
    market: args.market,
    country: args.country,
    currency: args.currency,
    quoteType: args.type || args.quoteType,
    sector: args.sector,
    industry: args.industry,
    source: args.source || "manual-cli",
    tags: args.tags,
    notes: args.notes,
  });
}

export function addCompany(companyInput, { dryRun = false } = {}) {
  const company = normalizeCompany(companyInput);
  const sql = upsertCompanySql(company);
  // JSON catalog is the source of truth; a DB failure must not block the JSON write.
  let dbResult;
  try {
    dbResult = runPsql(sql, { dryRun });
  } catch (error) {
    dbResult = { ok: false, skipped: true, reason: `PostgreSQL no disponible (${error.message}). Catálogo JSON actualizado igualmente.` };
  }
  const publicCompanies = dryRun ? [] : upsertPublicCompanies([company]);
  return { company, dbResult, publicCount: publicCompanies.length };
}

const isCli = process.argv[1] && process.argv[1].endsWith("add-company.js");
if (isCli) {
  try {
    const args = parseArgs(process.argv);
    const result = addCompany(companyFromArgs(args), { dryRun: Boolean(args["dry-run"]) });
    console.log(`Empresa procesada: ${result.company.ticker} - ${result.company.companyName}`);
    if (result.dbResult.skipped) console.log(result.dbResult.reason);
  } catch (error) {
    console.error(`No se pudo agregar empresa: ${error.message}`);
    process.exit(1);
  }
}

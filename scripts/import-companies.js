import { readFileSync } from "node:fs";
import { normalizeCompany, runPsql, upsertCompanySql, upsertPublicCompanies } from "./db-client.js";

export function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--file") args.file = argv[index + 1];
    if (argv[index] === "--dry-run") args.dryRun = true;
  }
  return args;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function parseImportFile(path) {
  const raw = readFileSync(path, "utf8");
  if (path.endsWith(".json")) return JSON.parse(raw).map(normalizeCompany);
  if (!path.endsWith(".csv")) throw new Error("Formato no soportado. Usa .json o .csv");
  const [headerLine, ...rows] = raw.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(headerLine);
  return rows.map((line) => {
    const values = parseCsvLine(line);
    return normalizeCompany(Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
  });
}

export function importCompanies(path, { dryRun = false } = {}) {
  const companies = parseImportFile(path);
  const sql = companies.map(upsertCompanySql).join("\n");
  const dbResult = runPsql(sql, { dryRun });
  const publicCompanies = dryRun ? [] : upsertPublicCompanies(companies);
  return { companies, dbResult, publicCount: publicCompanies.length };
}

const isCli = process.argv[1] && process.argv[1].endsWith("import-companies.js");
if (isCli) {
  try {
    const args = parseArgs(process.argv);
    if (!args.file) throw new Error("Falta --file");
    const result = importCompanies(args.file, { dryRun: args.dryRun });
    console.log(`Empresas importadas: ${result.companies.length}`);
    if (result.dbResult.skipped) console.log(result.dbResult.reason);
  } catch (error) {
    console.error(`No se pudo importar: ${error.message}`);
    process.exit(1);
  }
}

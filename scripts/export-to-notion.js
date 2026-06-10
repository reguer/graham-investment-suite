import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadEnvLocal } from "./db-client.js";

const DEFAULT_INPUT = join(process.cwd(), "public", "data", "companies.json");
const DEFAULT_OUT = join(process.cwd(), "data", "export", "notion-watchlist-payload.json");

export function parseNotionExportArgs(argv) {
  const args = { input: DEFAULT_INPUT, out: DEFAULT_OUT, dryRun: false, limit: 100 };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--input") args.input = String(argv[index + 1] || args.input);
    if (argv[index] === "--out") args.out = String(argv[index + 1] || args.out);
    if (argv[index] === "--limit") args.limit = Number(argv[index + 1] || args.limit);
    if (argv[index] === "--dry-run") args.dryRun = true;
  }
  return args;
}

function asTitle(value) {
  return [{ type: "text", text: { content: String(value || "Sin titulo").slice(0, 2000) } }];
}

function asRichText(value) {
  return [{ type: "text", text: { content: String(value || "").slice(0, 2000) } }];
}

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function tags(value) {
  return (Array.isArray(value) ? value : String(value || "").split(",")).map((tag) => String(tag).trim()).filter(Boolean).slice(0, 20);
}

export function buildNotionCompanyPage(company) {
  return {
    properties: {
      Ticker: { title: asTitle(company.ticker) },
      Empresa: { rich_text: asRichText(company.companyName) },
      Estado: { select: { name: company.classificationLabel || company.analysisStatus || "Sin estado" } },
      Mercado: { select: { name: company.market || "N/A" } },
      Precio: { number: asNumber(company.lastPrice ?? company.price) },
      "P/E": { number: asNumber(company.pe) },
      "P/B": { number: asNumber(company.pb) },
      "P/E x P/B": { number: asNumber(company.pePb) },
      "Current Ratio": { number: asNumber(company.currentRatio) },
      "Debt Ratio": { number: asNumber(company.debtRatio) },
      Tags: { multi_select: tags(company.tags).map((name) => ({ name })) },
      Nota: { rich_text: asRichText(company.notes) },
    },
  };
}

export function buildNotionPayload(companies, { databaseId, limit = 100 } = {}) {
  const filtered = companies
    .filter((company) => company?.ticker)
    .slice(0, limit)
    .map((company) => ({
      parent: { database_id: databaseId || "NOTION_DATABASE_ID" },
      ...buildNotionCompanyPage(company),
    }));
  return { databaseId: databaseId || "", count: filtered.length, pages: filtered };
}

export async function exportToNotion(args, { fetchImpl = fetch, env = { ...loadEnvLocal(), ...process.env } } = {}) {
  if (!existsSync(args.input)) throw new Error(`No existe input: ${args.input}`);
  const companies = JSON.parse(readFileSync(args.input, "utf8"));
  const databaseId = env.NOTION_DATABASE_ID || env.NOTION_WATCHLIST_DATABASE_ID || "";
  const token = env.NOTION_TOKEN || env.NOTION_API_KEY || "";
  const payload = buildNotionPayload(companies, { databaseId, limit: args.limit });
  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, JSON.stringify(payload, null, 2) + "\n", "utf8");

  if (args.dryRun || !databaseId || !token) {
    return {
      ok: false,
      dryRun: true,
      out: args.out,
      count: payload.count,
      reason: args.dryRun ? "Dry-run solicitado." : "NOTION_DATABASE_ID/NOTION_TOKEN no configurados.",
    };
  }

  let sent = 0;
  for (const page of payload.pages) {
    const response = await fetchImpl("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "notion-version": "2022-06-28",
      },
      body: JSON.stringify(page),
    });
    if (!response.ok) throw new Error(`Notion devolvio ${response.status}: ${await response.text()}`);
    sent += 1;
  }
  return { ok: true, out: args.out, count: payload.count, sent };
}

const isCli = process.argv[1] && process.argv[1].endsWith("export-to-notion.js");
if (isCli) {
  exportToNotion(parseNotionExportArgs(process.argv)).then((result) => {
    console.log(result.ok ? `Notion exportado: ${result.sent} paginas.` : `Notion no enviado: ${result.reason}`);
    console.log(`Payload: ${result.out}`);
  }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

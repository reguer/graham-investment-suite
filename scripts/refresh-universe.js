import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tickerUniverse, universeMeta } from "../src/tools/watchlist/universe.js";
import { fetchMarketQuotes } from "../src/tools/watchlist/priceSources.js";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    requestedOnly: args.has("--requested-only"),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const items = args.requestedOnly ? tickerUniverse.filter((item) => item.priority === "requested") : tickerUniverse;
  const quotes = await fetchMarketQuotes(items);
  const resolved = items.filter((item) => quotes[item.ticker]);
  const unresolved = items.filter((item) => !quotes[item.ticker]);

  const payload = {
    generatedAt: new Date().toISOString(),
    mode: args.requestedOnly ? "requested-only" : "all",
    meta: universeMeta,
    counts: {
      requested: universeMeta.requestedCount,
      bmvSic: universeMeta.bmvSicCount,
      total: items.length,
      resolved: resolved.length,
      unresolved: unresolved.length,
    },
    quotes,
    unresolved: unresolved.map((item) => ({
      ticker: item.ticker,
      yahooSymbol: item.yahooSymbol,
      companyName: item.companyName,
      validationStatus: item.validationStatus,
    })),
  };

  const cacheDir = join(process.cwd(), "data", "cache");
  mkdirSync(cacheDir, { recursive: true });
  const filePath = join(cacheDir, `yahoo-universe-snapshot-${todayIso()}.json`);
  writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");

  console.log(`Universo consultado: ${items.length}`);
  console.log(`Precios resueltos: ${resolved.length}`);
  console.log(`Pendientes: ${unresolved.length}`);
  console.log(`Snapshot guardado: ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

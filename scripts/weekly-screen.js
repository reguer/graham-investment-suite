import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { watchlist } from "../src/tools/watchlist/watchlist.js";
import { fetchStooqQuotes } from "../src/tools/watchlist/priceSources.js";
import { screenWatchlist, summarizeScreen } from "../src/tools/watchlist/screen.js";
import { fmt, pct } from "../src/lib/formatters.js";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function renderRows(results) {
  return results
    .map((item) => `| ${item.ticker} | ${item.companyName} | ${fmt(item.livePrice)} | ${fmt(item.ratios.maxDefensivePrice)} | ${fmt(item.ratios.pe)} | ${fmt(item.ratios.pb)} | ${fmt(item.ratios.pePb)} | ${fmt(item.ratios.debtRatio)} | ${fmt(item.ratios.currentRatio)} | ${pct(item.ratios.marginOfSafety)} | ${item.alertLabel} |`)
    .join("\n");
}

function renderSection(title, results, emptyText) {
  if (!results.length) return `## ${title}\n\n${emptyText}\n`;
  return `## ${title}\n\n| Ticker | Empresa | Precio | Max defensivo | P/E | P/B | P/E x P/B | Debt | Current | MoS | Estado |\n|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|\n${renderRows(results)}\n`;
}

function renderReport(results, quoteStatus) {
  const summary = summarizeScreen(results);
  const date = todayIso();
  const quoteLine = quoteStatus.ok
    ? `Precios actualizados via ${quoteStatus.source}.`
    : `Precios no actualizados: ${quoteStatus.error}. Se uso el snapshot local.`;

  return `# Oportunidades Graham - ${date}

${quoteLine}

No es asesoria financiera. Este reporte usa el snapshot financiero de la watchlist y actualiza solo precios cuando la fuente responde.

- Aprobadas: ${summary.approved.length}
- Cerca de aprobar: ${summary.near.length}
- En observacion: ${summary.watch.length}
- Universo: ${results.length}

${renderSection("Aprobadas Graham", summary.approved, "No hay companias aprobadas esta semana.")}

${renderSection("Cerca de Aprobar", summary.near, "No hay companias cerca del rango esta semana.")}

${renderSection("En Observacion", summary.watch, "No hay companias en observacion.")}

## Notas

${results.map((item) => `- **${item.ticker}**: ${item.watchReason}`).join("\n")}
`;
}

async function main() {
  let quotes = {};
  let quoteStatus = { ok: false, error: "sin intento de precios", source: "snapshot" };

  try {
    quotes = await fetchStooqQuotes(watchlist.map((item) => item.ticker));
    quoteStatus = { ok: Object.keys(quotes).length > 0, error: "", source: "Stooq" };
    if (!quoteStatus.ok) quoteStatus.error = "Stooq no devolvio precios validos";
  } catch (error) {
    quoteStatus = { ok: false, error: error.message, source: "snapshot" };
  }

  const results = screenWatchlist(watchlist, quotes);
  const report = renderReport(results, quoteStatus);
  const reportDir = join(process.cwd(), "reports", "weekly");
  mkdirSync(reportDir, { recursive: true });
  const reportPath = join(reportDir, `${todayIso()}.md`);
  writeFileSync(reportPath, report, "utf8");

  console.log(report);
  console.log(`\nReporte guardado: ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

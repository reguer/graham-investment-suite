import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { watchlist, watchlistMeta } from "../src/tools/watchlist/watchlist.js";
import { fetchMarketQuotes } from "../src/tools/watchlist/priceSources.js";
import { screenWatchlist, summarizeScreen } from "../src/tools/watchlist/screen.js";
import { fmt, pct } from "../src/lib/formatters.js";

export function todayIso(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getReportCadence(date = new Date()) {
  const day = date.getDay();
  if (day === 1) {
    return {
      type: "formal_monday",
      label: "Alerta formal de lunes",
      description: "Arranque de semana: revisar nuevas aprobadas y empresas cerca de precio defensivo.",
      includeWeeklySummary: true,
    };
  }
  if (day === 5) {
    return {
      type: "formal_friday",
      label: "Alerta formal de viernes",
      description: "Cierre semanal: revisar aprobadas vigentes, salidas del rango y pendientes criticos.",
      includeWeeklySummary: true,
    };
  }
  return {
    type: "daily_light",
    label: "Revision ligera",
    description: "Seguimiento operativo entre alertas formales.",
    includeWeeklySummary: false,
  };
}

export function renderRows(results) {
  return results
    .map((item) => `| ${item.ticker} | ${item.yahooSymbol || item.ticker} | ${item.companyName} | ${fmt(item.livePrice)} | ${fmt(item.ratios?.maxDefensivePrice)} | ${fmt(item.ratios?.pe)} | ${fmt(item.ratios?.pb)} | ${fmt(item.ratios?.pePb)} | ${fmt(item.ratios?.debtRatio)} | ${fmt(item.ratios?.currentRatio)} | ${pct(item.ratios?.marginOfSafety)} | ${item.alertLabel} |`)
    .join("\n");
}

export function renderSection(title, results, emptyText) {
  if (!results.length) return `## ${title}\n\n${emptyText}\n`;
  return `## ${title}\n\n| Ticker | Yahoo | Empresa | Precio | Max defensivo | P/E | P/B | P/E x P/B | Debt | Current | MoS | Estado |\n|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|\n${renderRows(results)}\n`;
}

function renderWeeklySummary(summary, cadence) {
  if (!cadence.includeWeeklySummary) return "";
  const topApproved = summary.approved.slice(0, 5).map((item) => item.ticker).join(", ") || "Sin aprobadas";
  const topNear = summary.near.slice(0, 5).map((item) => item.ticker).join(", ") || "Sin candidatas cerca";
  const actionLine = cadence.type === "formal_friday"
    ? "Accion sugerida: cerrar bitacora semanal y preparar altas manuales para el lunes."
    : "Accion sugerida: priorizar captura manual de fundamentales para pendientes con precio disponible.";

  return `## Resumen Semanal

- Tipo: ${cadence.label}
- Foco: ${cadence.description}
- Aprobadas destacadas: ${topApproved}
- Cerca de aprobar: ${topNear}
- ${actionLine}
`;
}

export function renderReport(results, quoteStatus, { date = new Date() } = {}) {
  const summary = summarizeScreen(results);
  const reportDate = todayIso(date);
  const cadence = getReportCadence(date);
  const quoteLine = quoteStatus.ok
    ? `Precios actualizados via ${quoteStatus.source}.`
    : `Precios no actualizados: ${quoteStatus.error}. Se uso el snapshot local.`;

  return `# Oportunidades Graham - ${reportDate}

${quoteLine}

${cadence.label}: ${cadence.description}

No es asesoria financiera. Este reporte usa el snapshot financiero de la watchlist y actualiza solo precios cuando la fuente responde.

- Aprobadas: ${summary.approved.length}
- Cerca de aprobar: ${summary.near.length}
- En observacion: ${summary.watch.length}
- Pendientes de primer analisis: ${summary.pending.length}
- Analizadas: ${watchlistMeta.analyzedCount}
- BMV/SIC validadas en catalogo: ${watchlistMeta.bmvSicCount}
- Universo: ${results.length}

${renderWeeklySummary(summary, cadence)}

${renderSection("Aprobadas Graham", summary.approved, "No hay companias aprobadas esta semana.")}

${renderSection("Cerca de Aprobar", summary.near, "No hay companias cerca del rango esta semana.")}

${renderSection("En Observacion", summary.watch, "No hay companias en observacion.")}

${renderSection("Pendientes de Primer Analisis", summary.pending, "No hay companias pendientes.")}

## Notas

${results.map((item) => `- **${item.ticker}**: ${item.watchReason}`).join("\n")}
`;
}

async function main() {
  let quotes = {};
  let quoteStatus = { ok: false, error: "sin intento de precios", source: "snapshot" };

  try {
    quotes = await fetchMarketQuotes(watchlist);
    quoteStatus = { ok: Object.keys(quotes).length > 0, error: "", source: "Yahoo Finance Chart + Stooq fallback" };
    if (!quoteStatus.ok) quoteStatus.error = "Yahoo/Stooq no devolvieron precios validos";
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

const isCli = process.argv[1] && process.argv[1].endsWith("weekly-screen.js");
if (isCli) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

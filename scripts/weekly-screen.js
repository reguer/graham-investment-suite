import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildWatchlist, buildWatchlistMeta, normalizeExportedCompany } from "../src/tools/watchlist/watchlist.js";
import { fetchMarketQuotes } from "../src/tools/watchlist/priceSources.js";
import { screenWatchlist, summarizeScreen } from "../src/tools/watchlist/screen.js";
import { fmt, pct } from "../src/lib/formatters.js";
import { loadEnvLocal, PUBLIC_COMPANIES_PATH } from "./db-client.js";
import { dispatchTelegramReport } from "./alert-dispatcher.js";
import { getDeviceLabel, initRuntime } from "./init-runtime.js";

export function parseArgs(argv) {
  const args = { format: "md", ticker: "", verbose: false, noTelegram: false };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--ticker") args.ticker = String(argv[index + 1] || "").trim().toUpperCase();
    if (argv[index] === "--format") args.format = String(argv[index + 1] || "md").trim().toLowerCase();
    if (argv[index] === "--verbose") args.verbose = true;
    if (argv[index] === "--no-telegram") args.noTelegram = true;
  }
  if (!["md", "csv", "html"].includes(args.format)) throw new Error("Formato no soportado. Usa md, csv o html.");
  return args;
}

function loadWatchlist() {
  const publicCompanies = JSON.parse(readFileSync(PUBLIC_COMPANIES_PATH, "utf8")).map(normalizeExportedCompany);
  const watchlist = buildWatchlist(publicCompanies);
  return { watchlist, watchlistMeta: buildWatchlistMeta(watchlist, publicCompanies) };
}

function filterResults(results, args) {
  if (!args.ticker) return results;
  return results.filter((item) => [item.ticker, item.yahooSymbol].filter(Boolean).map((value) => String(value).toUpperCase()).includes(args.ticker));
}

export function todayIso(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function renderCsv(results) {
  const headers = ["ticker", "yahoo", "empresa", "precio", "max_defensivo", "pe", "pb", "pe_pb", "debt", "current", "mos", "estado", "estado_sistema", "tags", "nota"];
  const rows = results.map((item) => [
    item.ticker,
    item.yahooSymbol || item.ticker,
    item.companyName,
    item.livePrice,
    item.ratios?.maxDefensivePrice,
    item.ratios?.pe,
    item.ratios?.pb,
    item.ratios?.pePb,
    item.ratios?.debtRatio,
    item.ratios?.currentRatio,
    item.ratios?.marginOfSafety,
    item.alertLabel,
    item.systemStatus?.label,
    Array.isArray(item.tags) ? item.tags.join("|") : item.tags || "",
    item.watchReason || "",
  ]);
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
}

export function renderHtml(results, quoteStatus, options = {}) {
  const markdown = renderReport(results, quoteStatus, options);
  const escaped = markdown.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reporte Graham</title>
  <style>body{font-family:system-ui,sans-serif;background:#060911;color:#e5e7eb;margin:24px}pre{white-space:pre-wrap;line-height:1.5}</style>
</head>
<body><pre>${escaped}</pre></body>
</html>
`;
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

export function buildAlertItems(summary, cadence) {
  const alerts = [];
  for (const item of summary.approved.slice(0, 12)) {
    alerts.push({
      severity: "alta",
      type: "aprobada_graham",
      ticker: item.ticker,
      message: `${item.ticker} esta dentro del rango Graham defensivo. Revisar liquidez, deuda y precio antes de operar.`,
    });
  }
  for (const item of summary.near.slice(0, 12)) {
    alerts.push({
      severity: "media",
      type: "cerca_de_aprobar",
      ticker: item.ticker,
      message: `${item.ticker} esta cerca del rango defensivo. Vigilar precio vivo y margen de seguridad.`,
    });
  }
  if (cadence.type === "formal_friday" && summary.pending.length) {
    alerts.push({
      severity: "media",
      type: "pendientes_semana",
      ticker: "PENDIENTES",
      message: `${summary.pending.length} instrumentos siguen pendientes/no soportados. Cerrar la semana depurando captura manual o exclusion.`,
    });
  }
  if (cadence.type === "formal_monday" && summary.watch.length) {
    alerts.push({
      severity: "baja",
      type: "revision_observacion",
      ticker: "OBSERVACION",
      message: `${summary.watch.length} empresas estan en observacion. Priorizar solo las que tengan catalizador o mejora de precio.`,
    });
  }
  return alerts;
}

export function renderAlertsSection(summary, cadence) {
  const alerts = buildAlertItems(summary, cadence);
  if (!alerts.length) return "## Alertas Accionables\n\nNo hay alertas accionables nuevas bajo las reglas actuales.\n";
  return `## Alertas Accionables

| Severidad | Tipo | Ticker | Senal |
|---|---|---|---|
${alerts.map((alert) => `| ${alert.severity} | ${alert.type} | ${alert.ticker} | ${alert.message} |`).join("\n")}
`;
}

export function renderReport(results, quoteStatus, { date = new Date(), device = null } = {}) {
  const { watchlistMeta } = loadWatchlist();
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

${renderAlertsSection(summary, cadence)}

${renderSection("Aprobadas Graham", summary.approved, "No hay companias aprobadas esta semana.")}

${renderSection("Cerca de Aprobar", summary.near, "No hay companias cerca del rango esta semana.")}

${renderSection("En Observacion", summary.watch, "No hay companias en observacion.")}

${renderSection("Pendientes de Primer Analisis", summary.pending, "No hay companias pendientes.")}

## Notas

${results.map((item) => `- **${item.ticker}**: ${item.watchReason}`).join("\n")}

## Origen

Generado desde: ${device ? getDeviceLabel(device) : "Equipo local sin device.json"}
`;
}

export function buildCapturePayload(results, quoteStatus, { date = new Date(), device = null } = {}) {
  const summary = summarizeScreen(results);
  const { watchlistMeta } = loadWatchlist();
  return {
    generatedAt: date.toISOString(),
    reportDate: todayIso(date),
    quoteStatus,
    device,
    counts: {
      approved: summary.approved.length,
      near: summary.near.length,
      watch: summary.watch.length,
      reference: summary.reference.length,
      pending: summary.pending.length,
      analyzed: watchlistMeta.analyzedCount,
      publicExport: watchlistMeta.publicExportCount,
      bmvSic: watchlistMeta.bmvSicCount,
      total: results.length,
    },
    companies: results.map((item) => ({
      ticker: item.ticker,
      yahooSymbol: item.yahooSymbol || item.ticker,
      companyName: item.companyName,
      market: item.market || "",
      sector: item.sector || "",
      analysisStatus: item.analysisStatus || "",
      alertLevel: item.alertLevel,
      alertLabel: item.alertLabel,
      livePrice: item.livePrice,
      quote: item.quote || null,
      ratios: item.ratios || null,
      classification: item.classification || null,
      systemStatus: item.systemStatus || null,
      watchReason: item.watchReason || "",
    })),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const runtime = initRuntime();
  const { watchlist } = loadWatchlist();
  let quotes = {};
  let quoteStatus = { ok: false, error: "sin intento de precios", source: "snapshot" };

  try {
    quotes = await fetchMarketQuotes(watchlist);
    quoteStatus = { ok: Object.keys(quotes).length > 0, error: "", source: "Yahoo Finance Chart + Stooq fallback" };
    if (!quoteStatus.ok) quoteStatus.error = "Yahoo/Stooq no devolvieron precios validos";
  } catch (error) {
    quoteStatus = { ok: false, error: error.message, source: "snapshot" };
  }

  const results = filterResults(screenWatchlist(watchlist, quotes), args);
  const summary = summarizeScreen(results);
  const now = new Date();
  const cadence = getReportCadence(now);
  const report = args.format === "csv"
    ? renderCsv(results)
    : args.format === "html"
      ? renderHtml(results, quoteStatus, { date: now, device: runtime.device })
      : renderReport(results, quoteStatus, { date: now, device: runtime.device });
  const capture = buildCapturePayload(results, quoteStatus, { date: now, device: runtime.device });
  const reportDir = join(process.cwd(), "reports", "weekly");
  const exportDir = join(process.cwd(), "data", "export");
  const cacheDir = join(process.cwd(), "data", "cache");
  mkdirSync(reportDir, { recursive: true });
  mkdirSync(exportDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });
  const reportPath = args.format === "md"
    ? join(reportDir, `${todayIso(now)}.md`)
    : join(exportDir, `weekly-${todayIso(now)}${args.ticker ? `-${args.ticker}` : ""}.${args.format}`);
  const capturePath = join(cacheDir, `company-capture-${todayIso(now)}.json`);
  writeFileSync(reportPath, report, "utf8");
  writeFileSync(capturePath, JSON.stringify(capture, null, 2), "utf8");

  if (args.verbose || args.format === "md") console.log(report);
  console.log(`\nReporte guardado: ${reportPath}`);
  console.log(`Captura guardada: ${capturePath}`);

  const telegramEnv = { ...loadEnvLocal(), ...process.env };
  if (cadence.includeWeeklySummary || args.noTelegram) {
    try {
      const dispatch = await dispatchTelegramReport({
        date: todayIso(now),
        summary,
        quoteStatus,
        cadence,
        device: runtime.device,
        env: telegramEnv,
        noTelegram: args.noTelegram,
      });
      console.log(dispatch.ok ? "Telegram enviado: resumen semanal." : dispatch.reason);
    } catch (error) {
      console.log(`Telegram no enviado: ${error.message}`);
    }
  } else {
    if (telegramEnv.ENABLE_TELEGRAM_ALERTS === "true") console.log("Telegram no enviado: solo se envian senales automaticas lunes y viernes.");
  }
}

const isCli = process.argv[1] && process.argv[1].endsWith("weekly-screen.js");
if (isCli) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export function shouldSendTelegram(env = process.env) {
  return String(env.ENABLE_TELEGRAM_ALERTS || "false").toLowerCase() === "true" &&
    Boolean(env.TELEGRAM_BOT_TOKEN) &&
    Boolean(env.TELEGRAM_CHAT_ID);
}

export function formatTelegramReportMessage({ date, summary, quoteStatus }) {
  return [
    `ALERTA GRAHAM - ${date}`,
    quoteStatus.ok ? `Precios: ${quoteStatus.source}` : `Precios: fallo (${quoteStatus.error})`,
    `Aprobadas: ${summary.approved.length}`,
    `Cerca: ${summary.near.length}`,
    `Observacion: ${summary.watch.length}`,
    `Pendientes/no soportadas: ${summary.pending.length}`,
    "",
    `Aprobadas destacadas: ${summary.approved.slice(0, 5).map((item) => item.ticker).join(", ") || "Sin aprobadas"}`,
    `Cerca destacadas: ${summary.near.slice(0, 5).map((item) => item.ticker).join(", ") || "Sin cercanas"}`,
    "",
    "Comandos: /resumen, /aprobadas, /cerca, /ticker SIMBOLO, /ayuda",
  ].join("\n");
}

export function formatTelegramHelpMessage() {
  return [
    "Comandos Graham Investment Suite",
    "/resumen - conteo actual de oportunidades",
    "/aprobadas - empresas dentro del rango Graham",
    "/cerca - empresas cercanas al rango defensivo",
    "/ticker SIMBOLO - detalle de una empresa, ejemplo /ticker MU",
    "/ayuda - lista de comandos",
  ].join("\n");
}

export function formatTickerSignalMessage(item) {
  if (!item) return "Ticker no encontrado en el universo activo.";
  const ratios = item.ratios || {};
  return [
    `${item.ticker} - ${item.companyName || ""}`,
    `Estado: ${item.alertLabel || item.classification?.label || "Sin estado"}`,
    `Precio: ${ratios.price ?? item.livePrice ?? item.price ?? "N/A"}`,
    `P/E: ${ratios.pe ?? item.pe ?? "N/A"}`,
    `P/B: ${ratios.pb ?? item.pb ?? "N/A"}`,
    `P/E x P/B: ${ratios.pePb ?? item.pePb ?? "N/A"}`,
    `Nota: ${item.watchReason || item.notes || "Sin nota"}`,
  ].join("\n");
}

export async function sendTelegramMessage(text, { env = process.env, fetchImpl = fetch } = {}) {
  if (!shouldSendTelegram(env)) return { ok: false, skipped: true, reason: "Telegram no configurado." };
  const response = await fetchImpl(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(`Telegram devolvio ${response.status}: ${payload.description || response.statusText}`);
  }
  return { ok: true };
}

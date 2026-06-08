import { formatTelegramReportMessage, sendTelegramMessage, shouldSendTelegram } from "../src/lib/telegram.js";

export function isPrimaryDevice(device = {}, env = process.env) {
  const role = String(device.device_role || env.DEVICE_ROLE || "secondary").trim().toLowerCase();
  return role === "principal" || role === "primary";
}

export function shouldDispatchTelegram({ device = {}, env = process.env, noTelegram = false } = {}) {
  if (noTelegram) return { ok: false, reason: "Telegram omitido por --no-telegram." };
  if (!shouldSendTelegram(env)) return { ok: false, reason: "Telegram no configurado." };
  if (!isPrimaryDevice(device, env)) return { ok: false, reason: "Telegram omitido: este equipo no es principal." };
  return { ok: true, reason: "Equipo principal habilitado para Telegram." };
}

export async function dispatchTelegramReport({ date, summary, quoteStatus, cadence, device = {}, env = process.env, noTelegram = false, sendImpl = sendTelegramMessage } = {}) {
  const decision = shouldDispatchTelegram({ device, env, noTelegram });
  if (!decision.ok) return { ok: false, skipped: true, reason: decision.reason };
  await sendImpl(formatTelegramReportMessage({ date, summary, quoteStatus, cadence }), { env });
  return { ok: true, reason: decision.reason };
}

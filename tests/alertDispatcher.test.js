import { describe, expect, it } from "vitest";
import { dispatchTelegramReport, isPrimaryDevice, shouldDispatchTelegram } from "../scripts/alert-dispatcher.js";

const env = { ENABLE_TELEGRAM_ALERTS: "true", TELEGRAM_BOT_TOKEN: "token", TELEGRAM_CHAT_ID: "chat" };

describe("alert dispatcher", () => {
  it("allows only primary/principal devices to send Telegram alerts", () => {
    expect(isPrimaryDevice({ device_role: "principal" })).toBe(true);
    expect(isPrimaryDevice({ device_role: "primary" })).toBe(true);
    expect(isPrimaryDevice({ device_role: "secondary" })).toBe(false);
  });

  it("skips Telegram when disabled, unconfigured, or not primary", () => {
    expect(shouldDispatchTelegram({ noTelegram: true, env, device: { device_role: "principal" } }).reason).toContain("--no-telegram");
    expect(shouldDispatchTelegram({ env: {}, device: { device_role: "principal" } }).reason).toContain("no configurado");
    expect(shouldDispatchTelegram({ env, device: { device_role: "secondary" } }).reason).toContain("no es principal");
  });

  it("dispatches formatted reports through the injected sender", async () => {
    const calls = [];
    const result = await dispatchTelegramReport({
      date: "2026-06-08",
      quoteStatus: { ok: true, source: "test" },
      cadence: { label: "Alerta formal de lunes" },
      summary: { approved: [], near: [], watch: [], reference: [], pending: [] },
      device: { device_role: "principal" },
      env,
      sendImpl: async (text, options) => {
        calls.push({ text, options });
      },
    });

    expect(result.ok).toBe(true);
    expect(calls[0].text).toContain("ALERTA GRAHAM - 2026-06-08");
    expect(calls[0].options.env).toBe(env);
  });
});

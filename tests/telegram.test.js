import { describe, expect, it } from "vitest";
import { formatTelegramHelpMessage, formatTelegramReportMessage, formatTickerSignalMessage, sendTelegramMessage, shouldSendTelegram } from "../src/lib/telegram.js";

describe("telegram alerts", () => {
  it("requires explicit enable flag, token, and chat id", () => {
    expect(shouldSendTelegram({ ENABLE_TELEGRAM_ALERTS: "true", TELEGRAM_BOT_TOKEN: "x", TELEGRAM_CHAT_ID: "1" })).toBe(true);
    expect(shouldSendTelegram({ ENABLE_TELEGRAM_ALERTS: "false", TELEGRAM_BOT_TOKEN: "x", TELEGRAM_CHAT_ID: "1" })).toBe(false);
  });

  it("formats the weekly report summary", () => {
    const text = formatTelegramReportMessage({
      date: "2026-06-05",
      quoteStatus: { ok: true, source: "test" },
      summary: {
        approved: [{ ticker: "KBH" }],
        near: [],
        watch: [{ ticker: "AAPL" }],
        pending: [{ ticker: "SP500" }],
      },
    });

    expect(text).toContain("ALERTA GRAHAM - 2026-06-05");
    expect(text).toContain("Aprobadas: 1");
    expect(text).toContain("KBH");
    expect(text).toContain("/ticker SIMBOLO");
  });

  it("formats command help and ticker details", () => {
    expect(formatTelegramHelpMessage()).toContain("/ticker SIMBOLO");
    expect(formatTickerSignalMessage({
      ticker: "MU",
      companyName: "Micron",
      alertLabel: "Pendiente",
      ratios: { pe: 10, pb: 1.2, pePb: 12, price: 100 },
      watchReason: "Fixture",
    })).toContain("MU - Micron");
  });

  it("sends a message without exposing credentials in the payload", async () => {
    const calls = [];
    const result = await sendTelegramMessage("hello", {
      env: { ENABLE_TELEGRAM_ALERTS: "true", TELEGRAM_BOT_TOKEN: "token", TELEGRAM_CHAT_ID: "chat" },
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return { ok: true, json: async () => ({ ok: true }) };
      },
    });

    expect(result.ok).toBe(true);
    expect(calls[0].url).toContain("bottoken");
    expect(JSON.parse(calls[0].options.body)).toEqual({
      chat_id: "chat",
      text: "hello",
      disable_web_page_preview: true,
    });
  });
});

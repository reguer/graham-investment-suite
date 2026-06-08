import { describe, expect, it } from "vitest";
import { buildAlertItems, buildCapturePayload, getReportCadence, parseArgs, renderCsv, renderHtml, renderReport, todayIso } from "../scripts/weekly-screen.js";

const approvedResult = {
  ticker: "KBH",
  yahooSymbol: "KBH",
  companyName: "KB Home",
  livePrice: 52,
  ratios: {
    maxDefensivePrice: 84,
    pe: 10,
    pb: 0.85,
    pePb: 8.5,
    debtRatio: 0.74,
    currentRatio: 2.2,
    marginOfSafety: 0.62,
  },
  alertLevel: "approved",
  alertLabel: "Aprobada Graham",
  watchReason: "Fixture aprobada.",
};

const pendingResult = {
  ticker: "AAPL",
  yahooSymbol: "AAPL.MX",
  companyName: "Apple Inc.",
  livePrice: 5000,
  ratios: null,
  alertLevel: "pending",
  alertLabel: "Precio disponible, faltan fundamentales",
  watchReason: "Pendiente de primer analisis Graham.",
};

describe("weekly-screen report cadence", () => {
  it("detects Monday and Friday as formal alert days", () => {
    expect(getReportCadence(new Date(2026, 5, 1)).type).toBe("formal_monday");
    expect(getReportCadence(new Date(2026, 5, 5)).type).toBe("formal_friday");
    expect(getReportCadence(new Date(2026, 5, 3)).type).toBe("daily_light");
  });

  it("renders a weekly summary for Friday formal reports", () => {
    const report = renderReport([approvedResult, pendingResult], { ok: true, source: "test" }, {
      date: new Date(2026, 5, 5),
      device: { device_name: "Laptop Test", device_id: "device-1", device_role: "principal" },
    });

    expect(report).toContain("# Oportunidades Graham - 2026-06-05");
    expect(report).toContain("Alerta formal de viernes");
    expect(report).toContain("## Resumen Semanal");
    expect(report).toContain("## Alertas Accionables");
    expect(report).toContain("Aprobadas destacadas: KBH");
    expect(report).toContain("Generado desde: Laptop Test (device-1, rol: principal)");
  });

  it("keeps midweek reports lightweight", () => {
    const report = renderReport([approvedResult], { ok: false, error: "sin red" }, {
      date: new Date(2026, 5, 3),
    });

    expect(report).toContain("Revision ligera");
    expect(report).not.toContain("## Resumen Semanal");
    expect(report).toContain("Precios no actualizados: sin red");
  });

  it("formats dates as ISO report filenames", () => {
    expect(todayIso(new Date(2026, 5, 5))).toBe("2026-06-05");
  });

  it("parses ticker, format and verbose flags", () => {
    expect(parseArgs(["node", "weekly-screen.js", "--ticker", "kbh", "--format", "csv", "--verbose", "--no-telegram"])).toEqual({
      ticker: "KBH",
      format: "csv",
      verbose: true,
      noTelegram: true,
    });
  });

  it("builds a structured capture payload for validation", () => {
    const payload = buildCapturePayload([approvedResult, pendingResult], { ok: true, source: "test" }, {
      date: new Date(2026, 5, 5),
      device: { device_name: "Laptop Test", device_id: "device-1", device_role: "principal" },
    });

    expect(payload.reportDate).toBe("2026-06-05");
    expect(payload.counts.total).toBe(2);
    expect(payload.counts.approved).toBe(1);
    expect(payload.counts.reference).toBe(0);
    expect(payload.device.device_id).toBe("device-1");
    expect(payload.companies[0]).toMatchObject({
      ticker: "KBH",
      livePrice: 52,
      alertLevel: "approved",
    });
  });

  it("builds actionable alert items for approved and near names", () => {
    const alerts = buildAlertItems({
      approved: [approvedResult],
      near: [{ ...approvedResult, ticker: "LEN" }],
      watch: [],
      reference: [],
      pending: [],
    }, getReportCadence(new Date(2026, 5, 1)));

    expect(alerts.map((alert) => alert.type)).toEqual(["aprobada_graham", "cerca_de_aprobar"]);
  });

  it("renders csv and html exports", () => {
    const csv = renderCsv([approvedResult]);
    const html = renderHtml([approvedResult], { ok: true, source: "test" }, { date: new Date(2026, 5, 5) });

    expect(csv).toContain("ticker,yahoo,empresa");
    expect(csv).toContain("KBH");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Oportunidades Graham");
  });
});

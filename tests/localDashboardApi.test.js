import { describe, expect, it } from "vitest";
import { loadLocalDashboardConfig, nextCaptureRun, parseCaptureTime, runFullRefresh } from "../scripts/local-dashboard-api.js";

describe("local dashboard api scheduling", () => {
  it("parses the 18:00 capture time", () => {
    expect(parseCaptureTime("18:00")).toEqual({ hours: 18, minutes: 0, label: "18:00" });
  });

  it("schedules today when 18:00 is still ahead", () => {
    const next = nextCaptureRun(new Date(2026, 5, 5, 17, 30), "18:00");
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(5);
    expect(next.getDate()).toBe(5);
    expect(next.getHours()).toBe(18);
    expect(next.getMinutes()).toBe(0);
  });

  it("schedules tomorrow when 18:00 already passed", () => {
    const next = nextCaptureRun(new Date(2026, 5, 5, 18, 1), "18:00");
    expect(next.getDate()).toBe(6);
    expect(next.getHours()).toBe(18);
  });

  it("loads local env flags without exposing credential values", () => {
    const config = loadLocalDashboardConfig({
      ENABLE_DAILY_CAPTURE: "true",
      CAPTURE_LOCAL_TIME: "18:00",
      DATABASE_URL: "postgresql://user:secret@127.0.0.1:5432/graham_suite",
    });

    expect(config.dailyCaptureEnabled).toBe(true);
    expect(config.captureTime).toBe("18:00");
    expect(config.hasDatabaseUrl).toBe(true);
    expect(config).not.toHaveProperty("databaseUrl");
  });

  it("exposes a full refresh action for the dashboard button", () => {
    expect(typeof runFullRefresh).toBe("function");
  });
});

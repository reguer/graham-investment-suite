import { describe, expect, it } from "vitest";
import { BUFFETT_UI_ENABLED, buildBuffettLabel } from "../src/tools/watchlist/buffettLabels.js";
import { WATCHLIST_TABLE_COLUMNS, getWatchlistTableColumns } from "../src/tools/watchlist/tableColumns.js";

describe("buildBuffettLabel", () => {
  it("labels insufficient valuation when quality or DCF is missing", () => {
    expect(buildBuffettLabel({}).id).toBe("insufficient_valuation");
    expect(buildBuffettLabel({ buffett: { qualityScore: { value: 80 }, dcf: { valuationStatus: "insufficient_history" } } }).id)
      .toBe("insufficient_valuation");
  });

  it("labels high quality without evidence when cheap but unconfirmed", () => {
    const label = buildBuffettLabel({ buffett: { qualityScore: { value: 82 }, dcf: { valuationStatus: "ok", mosBuffett: 0.3 } } });
    expect(label.id).toBe("high_quality_no_evidence");
  });

  it("labels buffett candidate only when evidence is confirmed", () => {
    const label = buildBuffettLabel({
      buffett: { qualityScore: { value: 82 }, dcf: { valuationStatus: "ok", mosBuffett: 0.3 }, evidenceConfirmed: true },
    });
    expect(label.id).toBe("buffett_candidate");
  });

  it("labels excellent but expensive when quality is high and price exceeds intrinsic value", () => {
    const label = buildBuffettLabel({ buffett: { qualityScore: { value: 85 }, dcf: { valuationStatus: "ok", mosBuffett: -0.1 } } });
    expect(label.id).toBe("excellent_but_expensive");
  });
});

describe("buffett UI gating", () => {
  it("keeps the Buffett UI disabled by default", () => {
    expect(BUFFETT_UI_ENABLED).toBe(false);
  });

  it("does not add Buffett columns unless explicitly enabled", () => {
    const defaultColumns = getWatchlistTableColumns();
    expect(defaultColumns).toHaveLength(WATCHLIST_TABLE_COLUMNS.length);
    expect(defaultColumns.some((column) => column.buffett)).toBe(false);

    const enabledColumns = getWatchlistTableColumns({ includeBuffett: true });
    expect(enabledColumns.length).toBeGreaterThan(WATCHLIST_TABLE_COLUMNS.length);
    expect(enabledColumns.some((column) => column.id === "buffettLabel")).toBe(true);
  });
});

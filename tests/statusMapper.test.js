import { describe, expect, it } from "vitest";
import { listSystemStatuses, mapSystemStatus } from "../src/tools/watchlist/statusMapper.js";

describe("system status mapper", () => {
  it("exposes exactly ten ordered statuses", () => {
    const statuses = listSystemStatuses();
    expect(statuses).toHaveLength(10);
    expect(statuses[0].id).toBe("graham_approved");
    expect(statuses.at(-1).id).toBe("index_reference");
  });

  it("maps opportunity, reference and pending states", () => {
    expect(mapSystemStatus({ alertLevel: "approved" }).id).toBe("graham_approved");
    expect(mapSystemStatus({ alertLevel: "near" }).id).toBe("near_defensive");
    expect(mapSystemStatus({ analysisStatus: "index_reference" }).id).toBe("index_reference");
    expect(mapSystemStatus({ analysisStatus: "analysis_unsupported" }).id).toBe("unsupported_analysis");
    expect(mapSystemStatus({ validationStatus: "needs_manual_review" }).id).toBe("manual_review");
  });

  it("maps Graham classification IDs to business states", () => {
    expect(mapSystemStatus({ classification: { id: "excellent_expensive" } }).id).toBe("excellent_expensive");
    expect(mapSystemStatus({ classification: { id: "good_overvalued" } }).id).toBe("good_overvalued");
    expect(mapSystemStatus({ classification: { id: "rejected" } }).id).toBe("rejected_model");
  });
});

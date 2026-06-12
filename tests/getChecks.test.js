import { describe, it, expect } from "vitest";
import { getChecks } from "../src/tools/graham-analyzer/getChecks.js";

const full = {
  pe: 12,
  pb: 1.2,
  pePb: 14.4,
  debtRatio: 0.5,
  currentRatio: 2.5,
  quickRatio: 1.5,
  tie: 20,
  fcf: 100,
  epsAllPositive: true,
  epsGrowing: true,
  hasNegativeEquity: false,
};

function byId(checks, id) {
  return checks.find((c) => c.id === id);
}

describe("getChecks tri-state", () => {
  it("marks met criteria as pass (and keeps pass boolean)", () => {
    const checks = getChecks(full);
    expect(byId(checks, "pe").status).toBe("pass");
    expect(byId(checks, "pe").pass).toBe(true);
  });

  it("marks unmet criteria as fail", () => {
    const checks = getChecks({ ...full, currentRatio: 1.4 });
    expect(byId(checks, "current").status).toBe("fail");
    expect(byId(checks, "current").pass).toBe(false);
  });

  it("marks missing data as unknown, not fail", () => {
    const checks = getChecks({ ...full, fcf: null, epsGrowing: null });
    expect(byId(checks, "fcf").status).toBe("unknown");
    expect(byId(checks, "fcf").pass).toBe(false); // derived: unknown is not a pass
    expect(byId(checks, "epsGrowing").status).toBe("unknown");
  });

  it("treats negative equity P/B as unknown (criterion does not apply)", () => {
    const checks = getChecks({ ...full, pb: null, hasNegativeEquity: true });
    expect(byId(checks, "pb").status).toBe("unknown");
  });
});

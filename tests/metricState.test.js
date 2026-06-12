import { describe, it, expect } from "vitest";
import { metricState, displayValue, colorForState, boolState, NA_PLACEHOLDER } from "../src/lib/metricState.js";
import { AC } from "../src/lib/colors.js";

describe("metricState", () => {
  it("flags null/undefined/NaN as na", () => {
    expect(metricState(null)).toBe("na");
    expect(metricState(undefined)).toBe("na");
    expect(metricState(NaN)).toBe("na");
  });

  it("treats real numbers (including 0 and Infinity) as ok", () => {
    expect(metricState(0)).toBe("ok");
    expect(metricState(-1.5)).toBe("ok");
    expect(metricState(Infinity)).toBe("ok");
  });
});

describe("displayValue", () => {
  it("returns N/D for missing data without calling the formatter", () => {
    expect(displayValue(null, () => "should-not-run")).toBe(NA_PLACEHOLDER);
  });

  it("formats present values", () => {
    expect(displayValue(2, (v) => `${v}x`)).toBe("2x");
  });
});

describe("colorForState", () => {
  it("returns gray for missing data instead of running the evaluator", () => {
    expect(colorForState(null, () => AC.green)).toBe(AC.gray);
  });

  it("delegates to the evaluator when data exists", () => {
    expect(colorForState(0.05, (v) => (v < 0.1 ? AC.green : AC.red))).toBe(AC.green);
  });

  it("does not paint missing data green via the null < threshold foot-gun", () => {
    // Previously: null < 0.1 === true → green. Now must be gray.
    expect(colorForState(null, (v) => (v < 0.1 ? AC.green : AC.red))).toBe(AC.gray);
  });
});

describe("boolState", () => {
  it("maps null/undefined to unknown", () => {
    expect(boolState(null)).toBe("unknown");
    expect(boolState(undefined)).toBe("unknown");
  });

  it("maps truthiness to pass/fail", () => {
    expect(boolState(true)).toBe("pass");
    expect(boolState(false)).toBe("fail");
  });
});

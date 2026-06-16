import { describe, it, expect } from "vitest";
import { validateFinancials } from "../src/lib/validateFinancials.js";

const valid = {
  price: "100",
  sharesOutstanding: "1000000",
  epsTTM: "5",
  equity: "5000000",
  currentAssets: "3000000",
  currentLiabilities: "1000000",
  totalLiabilities: "2000000",
  totalAssets: "8000000",
  inventory: "500000",
};

describe("validateFinancials", () => {
  it("accepts a complete, coherent form", () => {
    const result = validateFinancials(valid);
    expect(result.ok).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("reports missing required fields", () => {
    const { price, equity, ...rest } = valid;
    const result = validateFinancials(rest);
    expect(result.ok).toBe(false);
    const keys = result.missing.map((m) => m.key);
    expect(keys).toContain("price");
    expect(keys).toContain("equity");
  });

  it("flags non-numeric input as a type warning", () => {
    const result = validateFinancials({ ...valid, price: "abc" });
    expect(result.ok).toBe(false);
    // "abc" parses to null → counted as missing AND invalid type
    expect(result.warnings.some((w) => w.includes("price"))).toBe(true);
  });

  it("rejects non-positive price", () => {
    const result = validateFinancials({ ...valid, price: "0" });
    expect(result.ok).toBe(false);
    expect(result.warnings.some((w) => w.toLowerCase().includes("precio"))).toBe(true);
  });

  it("rejects current assets greater than total assets", () => {
    const result = validateFinancials({ ...valid, currentAssets: "9000000", totalAssets: "8000000" });
    expect(result.ok).toBe(false);
    expect(result.warnings.some((w) => w.toLowerCase().includes("activos corrientes"))).toBe(true);
  });

  it("requires a positive ADR ratio only when isADR is set", () => {
    expect(validateFinancials({ ...valid, isADR: false, adrRatio: "0" }).warnings.some((w) => w.includes("ADR"))).toBe(false);
    expect(validateFinancials({ ...valid, isADR: true, adrRatio: "0" }).warnings.some((w) => w.includes("ADR"))).toBe(true);
  });
});

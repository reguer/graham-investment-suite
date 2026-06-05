import { describe, expect, it } from "vitest";
import { detectMagnitudeWarning, validateFundamentalCurrency } from "../src/tools/watchlist/yahooFundamentals.js";

describe("yahoo fundamentals validation", () => {
  it("accepts matching USD currencies", () => {
    expect(validateFundamentalCurrency({ priceCurrency: "USD", financialCurrency: "USD" }).ok).toBe(true);
  });

  it("rejects mixed or unexpected currencies", () => {
    const result = validateFundamentalCurrency({ priceCurrency: "MXN", financialCurrency: "USD" });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("MXN");
  });

  it("warns on suspicious magnitudes", () => {
    expect(detectMagnitudeWarning({ revenue: 1_500_000_000_000 })).toContain("Magnitud muy alta");
  });
});

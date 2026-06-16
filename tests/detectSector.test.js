import { describe, it, expect } from "vitest";
import { detectSector, detectSectorProfile } from "../src/tools/graham-analyzer/detectSector.js";
import { getSectorProfile, profileAdjustments, DEFAULT_PROFILE } from "../src/tools/graham-analyzer/sectorProfiles.js";

describe("detectSector from Yahoo text", () => {
  it("maps composite financial strings to financial", () => {
    expect(detectSector({ sector: "Financial Services / Banks" })).toBe("financial");
    expect(detectSector({ sector: "Financial Services / Insurance" })).toBe("financial");
  });

  it("maps utilities (including composite AI-infra labels) to utilities", () => {
    expect(detectSector({ sector: "Utilities / Regulated Electric" })).toBe("utilities");
    expect(detectSector({ sector: "Utilities / Nuclear AI Infrastructure" })).toBe("utilities");
  });

  it("maps real estate / REITs ahead of the generic financial rule", () => {
    expect(detectSector({ sector: "Real Estate / REIT - Retail" })).toBe("reit");
  });

  it("maps tech, healthcare, staples and industrials", () => {
    expect(detectSector({ sector: "Technology", industry: "Software - Infrastructure" })).toBe("tech");
    expect(detectSector({ sector: "Healthcare / Pharmaceuticals" })).toBe("healthcare");
    expect(detectSector({ sector: "Consumer Defensive / Packaged Foods" })).toBe("consumer_staples");
    expect(detectSector({ sector: "Residential Construction" })).toBe("industrial");
  });

  it("maps energy (oil/gas/midstream) without canibalizing utilities", () => {
    expect(detectSector({ sector: "Energy", industry: "Oil & Gas E&P" })).toBe("energy");
    expect(detectSector({ sector: "Energy", industry: "Oil & Gas Midstream" })).toBe("energy");
    expect(detectSector({ sector: "Energy", industry: "Oil & Gas Equipment & Services" })).toBe("energy");
    expect(detectSector({ sector: "Utilities", industry: "Utilities Regulated Gas" })).toBe("utilities");
  });

  it("maps energy SIC ranges (extraction/refining/pipelines)", () => {
    expect(detectSector({ sicCode: 1311 })).toBe("energy");
    expect(detectSector({ sicCode: 2911 })).toBe("energy");
    expect(detectSector({ sicCode: 4612 })).toBe("energy");
    expect(detectSector({ sicCode: 4911 })).toBe("utilities");
  });

  it("maps basic materials (miners/metals) ahead of the generic industrial rule", () => {
    expect(detectSector({ sector: "Basic Materials", industry: "Gold" })).toBe("basic_materials");
    expect(detectSector({ sector: "Basic Materials", industry: "Copper" })).toBe("basic_materials");
    expect(detectSector({ sector: "Basic Materials", industry: "Steel" })).toBe("basic_materials");
    // "Other Industrial Metals & Mining" contains "industrial" but must not be canibalized.
    expect(detectSector({ sector: "Basic Materials", industry: "Other Industrial Metals & Mining" })).toBe("basic_materials");
  });

  it("maps basic materials SIC ranges (metal/coal mining, primary metals, chemicals)", () => {
    expect(detectSector({ sicCode: 1040 })).toBe("basic_materials"); // gold mining
    expect(detectSector({ sicCode: 1220 })).toBe("basic_materials"); // coal mining
    expect(detectSector({ sicCode: 3310 })).toBe("basic_materials"); // steel works
    expect(detectSector({ sicCode: 2810 })).toBe("basic_materials"); // industrial chemicals
    expect(detectSector({ sicCode: 2834 })).toBe("healthcare"); // pharma still wins its range
  });

  it("falls back to default when unknown or empty", () => {
    expect(detectSector({ sector: "Mystery Sector" })).toBe("default");
    expect(detectSector({})).toBe("default");
    expect(detectSector()).toBe("default");
  });

  it("uses industry text when sector is missing", () => {
    expect(detectSector({ industry: "Semiconductors" })).toBe("tech");
  });
});

describe("detectSector from SIC code (priority over text)", () => {
  it("prefers SIC over conflicting text", () => {
    // SIC 6021 = national commercial bank -> financial, even if text says otherwise
    expect(detectSector({ sector: "Technology", sicCode: 6021 })).toBe("financial");
  });

  it("maps utilities and pharma SIC ranges", () => {
    expect(detectSector({ sicCode: 4911 })).toBe("utilities"); // electric services
    expect(detectSector({ sicCode: 2834 })).toBe("healthcare"); // pharmaceutical preparations
  });
});

describe("reference tickers fall into the right profile (S6 precursor)", () => {
  it("BAC -> financial (omits current/debt)", () => {
    const profile = detectSectorProfile({ sector: "Financial Services / Banks - Diversified" });
    expect(profile.id).toBe("financial");
    expect(profile.omit).toContain("current");
    expect(profile.omit).toContain("debt");
  });

  it("NEE -> utilities (relaxed debt, current >= 1)", () => {
    const profile = detectSectorProfile({ sector: "Utilities / Regulated Electric" });
    expect(profile.id).toBe("utilities");
    expect(profile.thresholds.debtMax).toBeGreaterThan(DEFAULT_PROFILE.thresholds.debtMax);
    expect(profile.thresholds.currentMin).toBe(1);
  });

  it("MSFT -> tech (uses tangible book)", () => {
    const profile = detectSectorProfile({ sector: "Technology", industry: "Software - Infrastructure" });
    expect(profile.id).toBe("tech");
    expect(profile.useTangibleBook).toBe(true);
  });
});

describe("profileAdjustments", () => {
  it("reports nothing changed for the default profile", () => {
    expect(profileAdjustments(DEFAULT_PROFILE)).toEqual({});
  });

  it("reports debtMax base->adjusted for utilities", () => {
    const diffs = profileAdjustments(getSectorProfile("utilities"));
    expect(diffs.debtMax).toEqual({ base: 1, adjusted: 2.5 });
  });
});

import { describe, it, expect } from "vitest";
import { calcRatios } from "../src/tools/graham-analyzer/calcRatios.js";
import { classify } from "../src/tools/graham-analyzer/classify.js";
import { getChecks } from "../src/tools/graham-analyzer/getChecks.js";
import { detectSector } from "../src/tools/graham-analyzer/detectSector.js";
import { getSectorProfile, DEFAULT_PROFILE } from "../src/tools/graham-analyzer/sectorProfiles.js";

// Golden reference cases for sector diversification (story S6). Numbers are
// representative, not live — they pin the *behavior* (does the sector profile
// change the verdict the way it should), not market accuracy.

function analyze(form) {
  const ratios = calcRatios(form);
  const profile = getSectorProfile(detectSector({ sector: form.sector }));
  return { ratios, profile, classification: classify(ratios, profile), checks: getChecks(ratios, profile) };
}

function checkStatus(checks, id) {
  return checks.find((c) => c.id === id).status;
}

describe("NEE (utilities) — not rejected for structural leverage", () => {
  // A utility: solid valuation/EPS but debt/equity ~1.5 and current ratio ~0.8,
  // which the classic Graham profile would reject outright.
  const form = {
    sector: "Utilities / Regulated Electric",
    price: "60",
    epsTTM: "3.4",
    equity: "40000000",
    sharesOutstanding: "2000000",
    totalLiabilities: "60000000", // debt/equity = 1.5
    currentAssets: "8000000",
    currentLiabilities: "10000000", // current ratio = 0.8
    eps1: "3.4", eps2: "3.1", eps3: "2.9", eps4: "2.7", eps5: "2.5",
    operatingCF: "9000000", investingCF: "-4000000",
  };

  it("falls into the utilities profile", () => {
    expect(analyze(form).profile.id).toBe("utilities");
  });

  it("passes the debt check under utilities (debt/equity 1.5 < 2.5) but would fail under default", () => {
    const { ratios, checks } = analyze(form);
    expect(checkStatus(checks, "debt")).toBe("pass");
    // Same ratios under the classic profile would fail the debt criterion.
    const defaultChecks = getChecks(ratios, DEFAULT_PROFILE);
    expect(defaultChecks.find((c) => c.id === "debt").status).toBe("fail");
  });

  it("omits the quick-ratio criterion for utilities", () => {
    expect(checkStatus(analyze(form).checks, "quick")).toBe("omitted");
  });
});

describe("BAC (financial) — judged on valuation + EPS, not industrial liquidity", () => {
  // A bank: no comparable current/quick/debt; cheap P/E and P/B, positive EPS.
  const form = {
    sector: "Financial Services / Banks - Diversified",
    price: "40",
    epsTTM: "3.5",
    equity: "30000000",
    sharesOutstanding: "1000000",
    eps1: "3.5", eps2: "3.2", eps3: "3.0", eps4: "2.6", eps5: "2.4",
  };

  it("falls into the financial profile and omits current/quick/debt", () => {
    const { checks, profile } = analyze(form);
    expect(profile.id).toBe("financial");
    expect(checkStatus(checks, "current")).toBe("omitted");
    expect(checkStatus(checks, "quick")).toBe("omitted");
    expect(checkStatus(checks, "debt")).toBe("omitted");
  });

  it("is approved despite missing liquidity ratios", () => {
    expect(analyze(form).classification.id).toBe("graham_approved");
  });
});

describe("MSFT (tech) — judged on tangible book value", () => {
  // Heavy intangibles: reported equity gives P/B ~2.2 (fail at default 2.0),
  // but tangible book gives a higher P/B; the tech profile uses tangible and a
  // 2.5 ceiling. Here we keep tangible P/B within range to show the path works.
  const form = {
    sector: "Technology / Software - Infrastructure",
    price: "44",
    epsTTM: "2.4",
    equity: "20000000",
    intangiblesTotal: "5000000",
    netTangibleAssets: "15000000",
    sharesOutstanding: "1000000",
    totalLiabilities: "8000000",
    currentAssets: "9000000",
    currentLiabilities: "5000000",
    eps1: "2.4", eps2: "2.1", eps3: "1.9", eps4: "1.7", eps5: "1.5",
    operatingCF: "6000000", investingCF: "-1000000",
  };

  it("falls into the tech profile and uses tangible book", () => {
    const { profile } = analyze(form);
    expect(profile.id).toBe("tech");
    expect(profile.useTangibleBook).toBe(true);
  });

  it("evaluates the P/B check against tangible book value", () => {
    const { ratios, checks } = analyze(form);
    // pbTangible = 44 / (15000000/1000000) = 44/15 = 2.93 -> fails 2.5
    // pb (reported) = 44 / (20000000/1000000) = 2.2
    expect(ratios.pbTangible).toBeGreaterThan(ratios.pb);
    // The tech check should reflect the tangible value, not the reported one.
    const pbCheck = checks.find((c) => c.id === "pb");
    expect(pbCheck.label).toContain("tangible");
  });
});

describe("TSM regression — default profile unchanged", () => {
  it("classify with no profile still behaves like the classic defensive rules", () => {
    const ratios = { pe: 12, pb: 1.2, pePb: 14.4, debtRatio: 0.5, currentRatio: 2.5, epsAllPositive: true, epsGrowing: true };
    expect(classify(ratios).id).toBe("graham_approved");
  });
});

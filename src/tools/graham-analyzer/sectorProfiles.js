// Sector profiles parametrize the Graham thresholds so a stock is judged against
// criteria appropriate to its balance-sheet structure, not the industrial defaults.
//
// Each profile declares:
//   - id / label
//   - thresholds: the numeric Graham limits used by classify/getChecks
//   - omit: criteria that do NOT apply to the sector (rendered as such, not failed)
//   - useTangibleBook: when true, P/B checks use pbTangible instead of pb
//
// `default` reproduces the classic Graham defensive thresholds, so any code path
// that does not resolve a sector behaves exactly as before this module existed.
//
// Starting values come from PLAN.md §2; calibrate against the BAC/NEE/MSFT golden
// fixtures (story S6) before treating them as final.

export const DEFAULT_PROFILE_ID = "default";

export const SECTOR_PROFILES = {
  default: {
    id: "default",
    label: "Graham defensivo clásico",
    thresholds: { peMax: 20, pbMax: 2, pePbMax: 22.5, debtMax: 1, currentMin: 2, quickMin: 1 },
    omit: [],
    useTangibleBook: false,
  },
  financial: {
    id: "financial",
    label: "Financiero (bancos / seguros)",
    // Banks/insurers don't report current/quick ratios or debt/equity in an
    // industrially comparable way; judge on valuation + EPS quality.
    thresholds: { peMax: 20, pbMax: 2, pePbMax: 22.5, debtMax: null, currentMin: null, quickMin: null },
    omit: ["current", "quick", "debt"],
    useTangibleBook: false,
  },
  utilities: {
    id: "utilities",
    label: "Utilities (deuda regulada)",
    // High regulated leverage is structural; current ratio < 2 is normal.
    thresholds: { peMax: 20, pbMax: 2, pePbMax: 22.5, debtMax: 2.5, currentMin: 1, quickMin: null },
    omit: ["quick"],
    useTangibleBook: false,
  },
  reit: {
    id: "reit",
    label: "Real Estate / REIT",
    // P/B and current/debt are not meaningful for REITs; FFO-based metrics are the
    // proper tool (future work). For now judge on P/E + EPS quality.
    thresholds: { peMax: 20, pbMax: null, pePbMax: null, debtMax: null, currentMin: null, quickMin: null },
    omit: ["pb", "pePb", "current", "quick", "debt"],
    useTangibleBook: false,
  },
  tech: {
    id: "tech",
    label: "Tecnología (intangible-intensiva)",
    // Heavy intangibles inflate P/B; evaluate against tangible book value.
    thresholds: { peMax: 20, pbMax: 2.5, pePbMax: 22.5, debtMax: 1, currentMin: 1.5, quickMin: 1 },
    omit: [],
    useTangibleBook: true,
  },
  healthcare: {
    id: "healthcare",
    label: "Salud / Farma",
    // Capitalized R&D and intangibles distort P/B; use tangible book.
    thresholds: { peMax: 20, pbMax: 2.5, pePbMax: 22.5, debtMax: 1.2, currentMin: 1.5, quickMin: 1 },
    omit: [],
    useTangibleBook: true,
  },
  consumer_staples: {
    id: "consumer_staples",
    label: "Consumo defensivo",
    // High inventory depresses quick ratio; relax current/debt slightly.
    thresholds: { peMax: 20, pbMax: 2, pePbMax: 22.5, debtMax: 1.2, currentMin: 1.5, quickMin: null },
    omit: ["quick"],
    useTangibleBook: false,
  },
  industrial: {
    id: "industrial",
    label: "Industrial / Consumo cíclico",
    thresholds: { peMax: 20, pbMax: 2, pePbMax: 22.5, debtMax: 1, currentMin: 2, quickMin: 1 },
    omit: [],
    useTangibleBook: false,
  },
  energy: {
    id: "energy",
    label: "Energía (petróleo / gas / midstream)",
    // Cyclical and capital-intensive: asset-backed leverage is structural, P/B
    // reflects physical reserves and PP&E (low intangibles), and working capital
    // runs tighter than industrials. Relax debt and current; keep valuation
    // discipline (P/E, P/B, P/E×P/B, EPS).
    thresholds: { peMax: 20, pbMax: 2.5, pePbMax: 22.5, debtMax: 1.5, currentMin: 1, quickMin: null },
    omit: ["quick"],
    useTangibleBook: false,
  },
  basic_materials: {
    id: "basic_materials",
    label: "Materiales básicos (minería / metales)",
    // Miners (gold, copper, steel, industrial metals) are cyclical and very
    // capital-intensive: P/B reflects physical reserves and PP&E (low
    // intangibles), asset-backed leverage is structural, and working capital
    // runs tight. Mirror the energy stance — relax debt and current, omit quick,
    // book value is real so do NOT use tangible book — while keeping valuation
    // discipline (P/E, P/B, P/E×P/B, EPS). Royalty/streaming names (FNV, WPM)
    // run with near-zero debt and high P/B; the relaxed P/B keeps them sane
    // without a dedicated sub-profile.
    thresholds: { peMax: 20, pbMax: 2.5, pePbMax: 22.5, debtMax: 1.5, currentMin: 1, quickMin: null },
    omit: ["quick"],
    useTangibleBook: false,
  },
};

export const DEFAULT_PROFILE = SECTOR_PROFILES.default;

export function getSectorProfile(sectorId) {
  return SECTOR_PROFILES[sectorId] || DEFAULT_PROFILE;
}

// Returns the adjusted thresholds vs the default profile, so the UI can show
// "base 2.0 → adjusted 2.5" for whatever a sector changed.
export function profileAdjustments(profile) {
  const base = DEFAULT_PROFILE.thresholds;
  const diffs = {};
  for (const key of Object.keys(base)) {
    if (profile.thresholds[key] !== base[key]) {
      diffs[key] = { base: base[key], adjusted: profile.thresholds[key] };
    }
  }
  return diffs;
}

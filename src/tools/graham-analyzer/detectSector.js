import { SECTOR_PROFILES, DEFAULT_PROFILE_ID } from "./sectorProfiles.js";

// Maps a free-text Yahoo sector/industry string (e.g. "Financial Services / Banks",
// "Utilities / Regulated Electric", "Healthcare / Pharmaceuticals") to one of the
// internal taxonomy ids in sectorProfiles.js. Keyword order matters: more specific
// sectors (reit, financial) are checked before broader ones.
const KEYWORD_RULES = [
  { id: "reit", keywords: ["reit", "real estate"] },
  { id: "financial", keywords: ["financial", "bank", "insurance", "insurer", "capital markets", "asset management"] },
  { id: "utilities", keywords: ["utilit", "regulated electric", "power generation", "water", "gas distribution"] },
  { id: "tech", keywords: ["technology", "software", "semiconductor", "internet", "information technology", "it services", "electronic"] },
  { id: "healthcare", keywords: ["healthcare", "health care", "pharmaceutic", "biotech", "medical", "drug"] },
  { id: "consumer_staples", keywords: ["consumer defensive", "consumer staples", "packaged foods", "beverages", "household", "tobacco"] },
  { id: "industrial", keywords: ["industrial", "construction", "consumer cyclical", "manufactur", "aerospace", "machinery", "auto"] },
];

// SIC code ranges (US SEC Standard Industrial Classification) as the higher-priority
// signal when available — e.g. from SEC EDGAR submissions. Yahoo text is the fallback.
// Ranges are intentionally coarse; refine alongside the SEC fundamentals fetch.
function sectorFromSic(sicCode) {
  const sic = Number(sicCode);
  if (!Number.isFinite(sic)) return null;
  if (sic >= 6000 && sic <= 6199) return "financial"; // depository / non-depository credit
  if (sic >= 6300 && sic <= 6411) return "financial"; // insurance
  if (sic >= 6500 && sic <= 6799) return "reit"; // real estate
  if (sic >= 4900 && sic <= 4991) return "utilities";
  if (sic >= 7370 && sic <= 7379) return "tech"; // computer services
  if (sic >= 3570 && sic <= 3589) return "tech"; // computer hardware
  if (sic >= 3670 && sic <= 3679) return "tech"; // electronic components
  if (sic >= 2833 && sic <= 2836) return "healthcare"; // pharma/biotech
  if (sic >= 8000 && sic <= 8099) return "healthcare"; // health services
  if (sic >= 2000 && sic <= 2199) return "consumer_staples"; // food/beverage
  if (sic >= 3400 && sic <= 3999) return "industrial";
  if (sic >= 1500 && sic <= 1799) return "industrial"; // construction
  return null;
}

function sectorFromText(text) {
  const normalized = String(text || "").toLowerCase();
  if (!normalized.trim()) return null;
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) return rule.id;
  }
  return null;
}

// detectSector({ sector, industry, sicCode }) -> taxonomy id (a key of SECTOR_PROFILES).
// SIC code (when present) wins; otherwise parse the Yahoo sector then industry text.
// Falls back to "default" so the classic Graham profile applies when unknown.
export function detectSector({ sector, industry, sicCode } = {}) {
  const fromSic = sectorFromSic(sicCode);
  if (fromSic) return fromSic;
  const fromSector = sectorFromText(sector);
  if (fromSector) return fromSector;
  const fromIndustry = sectorFromText(industry);
  if (fromIndustry) return fromIndustry;
  return DEFAULT_PROFILE_ID;
}

// Convenience: detect and resolve to a profile object in one call.
export function detectSectorProfile(input) {
  return SECTOR_PROFILES[detectSector(input)];
}

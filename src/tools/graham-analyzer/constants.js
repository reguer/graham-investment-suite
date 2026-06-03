import { AC } from "../../lib/colors.js";

export const EMPTY_FORM = {
  ticker: "",
  companyName: "",
  date: "",
  price: "",
  totalAssets: "",
  currentAssets: "",
  inventory: "",
  nonCurrentAssets: "",
  totalLiabilities: "",
  currentLiabilities: "",
  nonCurrentLiabilities: "",
  equity: "",
  intangiblesTotal: "",
  netTangibleAssets: "",
  sharesOutstanding: "",
  treasuryShares: "",
  revenue: "",
  grossProfit: "",
  operatingIncome: "",
  ebit: "",
  interestExpense: "",
  netIncome: "",
  epsTTM: "",
  eps1: "",
  epsYear1: "2025",
  eps2: "",
  epsYear2: "2024",
  eps3: "",
  epsYear3: "2023",
  eps4: "",
  epsYear4: "2022",
  eps5: "",
  epsYear5: "2021",
  operatingCF: "",
  investingCF: "",
  financingCF: "",
  isADR: false,
  adrRatio: "1",
  notes: "",
};

export const GRAHAM_LIMITS = {
  peIdeal: 15,
  peMax: 20,
  pbIdeal: 1.5,
  pbMax: 2,
  pePbMax: 22.5,
  debtMax: 1,
  currentMin: 2,
  quickMin: 1,
  tieMin: 5,
  roeStrong: 0.1,
  roaStrong: 0.05,
};

export function alertFor(id, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return AC.gray;
  if (id === "pe") return value <= 15 ? AC.green : value <= 20 ? AC.yellow : AC.red;
  if (id === "pb") return value <= 1.5 ? AC.green : value <= 2 ? AC.yellow : AC.red;
  if (id === "pePb") return value <= 22.5 ? AC.green : value <= 35 ? AC.yellow : AC.red;
  if (id === "debtRatio") return value < 1 ? AC.green : value <= 1.5 ? AC.yellow : AC.red;
  if (id === "currentRatio") return value >= 2 ? AC.green : value >= 1.5 ? AC.yellow : AC.red;
  if (id === "quickRatio") return value >= 1 ? AC.green : value >= 0.7 ? AC.yellow : AC.red;
  if (id === "tie") return value > 5 ? AC.green : value >= 3 ? AC.yellow : AC.red;
  if (id === "roe") return value > 0.15 ? AC.green : value >= 0.1 ? AC.yellow : AC.red;
  if (id === "roa") return value > 0.05 ? AC.green : value >= 0.03 ? AC.yellow : AC.red;
  if (id === "netMargin") return value > 0.15 ? AC.green : value >= 0.05 ? AC.yellow : AC.red;
  if (id === "fcf") return value > 0 ? AC.green : AC.red;
  if (id === "mos") return value > 0.3 ? AC.green : value >= 0 ? AC.yellow : AC.red;
  return AC.gray;
}

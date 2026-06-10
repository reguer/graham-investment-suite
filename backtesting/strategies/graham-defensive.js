import { classify } from "../../src/tools/graham-analyzer/classify.js";

export const GRAHAM_DEFENSIVE_STRATEGY = {
  id: "graham-defensive",
  version: "0.1.0",
  label: "Graham defensivo basico",
};

export function buildRatiosAtPrice(company, price) {
  const basePrice = Number(company.price);
  const basePe = Number(company.pe);
  const basePb = Number(company.pb);
  if (![basePrice, basePe, basePb, price].every(Number.isFinite) || basePe <= 0 || basePb <= 0) return null;

  const epsAdj = basePrice / basePe;
  const bvps = basePrice / basePb;
  const pe = price / epsAdj;
  const pb = price / bvps;
  const pePb = pe * pb;
  const grahamFormula = Math.sqrt(22.5 * epsAdj * bvps);

  return {
    pe,
    pb,
    pePb,
    debtRatio: Number(company.debtRatio),
    currentRatio: Number(company.currentRatio),
    quickRatio: Number(company.quickRatio ?? company.currentRatio),
    fcf: Number(company.fcf ?? 1),
    epsAllPositive: company.epsAllPositive !== false,
    epsGrowing: company.epsGrowing ?? null,
    price,
    epsAdj,
    bvps,
    grahamFormula,
    marginOfSafety: price > 0 ? (grahamFormula - price) / price : null,
  };
}

export function shouldEnterGrahamDefensive(company, price) {
  const ratios = buildRatiosAtPrice(company, price);
  if (!ratios) return { ok: false, ratios: null, reason: "Datos insuficientes." };
  const classification = classify(ratios);
  return {
    ok: classification.id === "graham_approved",
    ratios,
    classification,
    reason: classification.reason,
  };
}

export function shouldExitGrahamDefensive(position, company, price, { stopLossPct = -0.2, exitPePb = 28 } = {}) {
  const ratios = buildRatiosAtPrice(company, price);
  if (!ratios) return { ok: true, ratios: null, reason: "Datos insuficientes para sostener posicion." };
  const returnPct = (price - position.entryPrice) / position.entryPrice;
  if (returnPct <= stopLossPct) return { ok: true, ratios, reason: `Stop loss ${Math.round(stopLossPct * 100)}%.` };
  if (ratios.pePb > exitPePb) return { ok: true, ratios, reason: `P/E x P/B ${ratios.pePb.toFixed(2)} > ${exitPePb}.` };
  return { ok: false, ratios, reason: "Criterios defensivos vigentes." };
}

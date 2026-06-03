import { classify } from "../graham-analyzer/classify.js";
import { DEFAULT_ALERT_POLICY } from "./watchlist.js";

export function deriveSnapshot(candidate, price = candidate.price) {
  const epsAdj = candidate.price / candidate.pe;
  const bvps = candidate.price / candidate.pb;
  const pe = price / epsAdj;
  const pb = price / bvps;
  const pePb = pe * pb;
  const grahamFormula = Math.sqrt(22.5 * epsAdj * bvps);
  const pricePe20 = epsAdj * 20;
  const pricePb2 = bvps * 2;
  const maxDefensivePrice = Math.min(grahamFormula, pricePe20, pricePb2);

  const ratios = {
    pe,
    pb,
    pePb,
    debtRatio: candidate.debtRatio,
    currentRatio: candidate.currentRatio,
    quickRatio: candidate.quickRatio,
    fcf: candidate.fcf,
    epsAllPositive: candidate.epsAllPositive,
    epsGrowing: null,
    roe: null,
    roa: null,
    tie: null,
    epsAdj,
    bvps,
    price,
    grahamFormula,
    pricePe20,
    pricePb2,
    maxDefensivePrice,
    distanceToDefensive: maxDefensivePrice > 0 ? (price - maxDefensivePrice) / maxDefensivePrice : null,
    marginOfSafety: price > 0 ? (grahamFormula - price) / price : null,
  };

  return ratios;
}

export function evaluateCandidate(candidate, quote = null, policy = DEFAULT_ALERT_POLICY) {
  const price = quote?.price ?? candidate.price;
  const ratios = deriveSnapshot(candidate, price);
  const classification = classify(ratios);
  const near =
    ratios.pePb <= policy.nearPePb &&
    ratios.pe <= policy.nearPe &&
    ratios.pb <= policy.nearPb &&
    ratios.debtRatio < policy.nearDebtRatio &&
    ratios.currentRatio >= policy.nearCurrentRatio &&
    ratios.epsAllPositive === true;
  const closeToDefensive =
    ratios.distanceToDefensive !== null && ratios.distanceToDefensive <= policy.grahamDistancePct;

  let alertLevel = "watch";
  let alertLabel = "En observacion";
  if (classification.id === "graham_approved") {
    alertLevel = "approved";
    alertLabel = "Aprobada Graham";
  } else if (near || closeToDefensive) {
    alertLevel = "near";
    alertLabel = "Cerca de aprobar";
  }

  return {
    ...candidate,
    quote,
    livePrice: price,
    ratios,
    classification,
    alertLevel,
    alertLabel,
    closeToDefensive,
    near,
  };
}

export function screenWatchlist(items, quotesByTicker = {}, policy = DEFAULT_ALERT_POLICY) {
  return items
    .map((item) => evaluateCandidate(item, quotesByTicker[item.ticker] ?? null, policy))
    .sort((a, b) => {
      const rank = { approved: 0, near: 1, watch: 2 };
      if (rank[a.alertLevel] !== rank[b.alertLevel]) return rank[a.alertLevel] - rank[b.alertLevel];
      return a.ratios.pePb - b.ratios.pePb;
    });
}

export function summarizeScreen(results) {
  return {
    approved: results.filter((result) => result.alertLevel === "approved"),
    near: results.filter((result) => result.alertLevel === "near"),
    watch: results.filter((result) => result.alertLevel === "watch"),
  };
}

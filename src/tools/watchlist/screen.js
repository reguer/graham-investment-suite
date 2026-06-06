import { classify } from "../graham-analyzer/classify.js";
import { DEFAULT_ALERT_POLICY } from "./watchlist.js";

export function deriveSnapshot(candidate, price = candidate.price) {
  if (!hasFinancialSnapshot(candidate)) return null;

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

export function hasFinancialSnapshot(candidate) {
  return [candidate.price, candidate.pe, candidate.pb, candidate.debtRatio, candidate.currentRatio].every((value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)));
}

export function evaluateCandidate(candidate, quote = null, policy = DEFAULT_ALERT_POLICY) {
  const price = quote?.price ?? candidate.price;
  const ratios = deriveSnapshot(candidate, price);
  if (!ratios) {
    if (candidate.analysisStatus === "analyzed") {
      return {
        ...candidate,
        quote,
        livePrice: quote?.price ?? candidate.price ?? null,
        ratios: null,
        classification: {
          id: candidate.classificationId || "rejected",
          label: candidate.classificationLabel || "RECHAZADA",
          color: "#ef4444",
          reason: candidate.notes || "Analizada, pero con datos insuficientes para aprobar reglas Graham.",
        },
        alertLevel: "watch",
        alertLabel: candidate.classificationLabel || "Analizada sin aprobacion Graham",
        closeToDefensive: false,
        near: false,
      };
    }

    if (String(candidate.analysisStatus || "").startsWith("analysis_")) {
      return {
        ...candidate,
        quote,
        livePrice: quote?.price ?? candidate.price ?? null,
        ratios: null,
        classification: {
          id: candidate.analysisStatus,
          label: "NO SOPORTADA",
          color: "#94a3b8",
          reason: candidate.notes || "No se pudo completar el analisis automatico.",
        },
        alertLevel: "pending",
        alertLabel: candidate.notes || "No soportada por analisis automatico",
        closeToDefensive: false,
        near: false,
      };
    }

    return {
      ...candidate,
      quote,
      livePrice: quote?.price ?? null,
      ratios: null,
      classification: {
        id: "pending_fundamentals",
        label: "PENDIENTE DE ANALISIS",
        color: "#94a3b8",
        reason: "Faltan fundamentales para calcular ratios Graham.",
      },
      alertLevel: "pending",
      alertLabel: quote?.price ? "Precio disponible, faltan fundamentales" : "Pendiente de primer analisis",
      closeToDefensive: false,
      near: false,
    };
  }

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
      const rank = { approved: 0, near: 1, watch: 2, pending: 3 };
      if (rank[a.alertLevel] !== rank[b.alertLevel]) return rank[a.alertLevel] - rank[b.alertLevel];
      if (!a.ratios || !b.ratios) return a.ticker.localeCompare(b.ticker);
      return a.ratios.pePb - b.ratios.pePb;
    });
}

export function summarizeScreen(results) {
  return {
    approved: results.filter((result) => result.alertLevel === "approved"),
    near: results.filter((result) => result.alertLevel === "near"),
    watch: results.filter((result) => result.alertLevel === "watch"),
    pending: results.filter((result) => result.alertLevel === "pending"),
  };
}

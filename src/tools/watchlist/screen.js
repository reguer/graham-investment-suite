import { classify } from "../graham-analyzer/classify.js";
import { detectSector } from "../graham-analyzer/detectSector.js";
import { mapSystemStatus } from "./statusMapper.js";
import { DEFAULT_ALERT_POLICY } from "./watchlist.js";

const CRITICAL_RATIO_KEYS = ["pe", "pb", "debtRatio", "currentRatio", "fcf"];

// Sectors whose balance sheets don't report current/quick/debt in an industrially
// comparable way, so the screen judges them on valuation + EPS only. Resolved via
// the shared detectSector taxonomy instead of a private prefix list.
const RELAXED_SECTOR_IDS = new Set(["financial", "reit"]);

function isFinancialSector(candidate) {
  return RELAXED_SECTOR_IDS.has(detectSector({ sector: candidate.sector, industry: candidate.industry, sicCode: candidate.sicCode }));
}

function isAvailableRatio(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

export function deriveSnapshot(candidate, price = candidate.price) {
  if (!hasFinancialSnapshot(candidate)) return null;

  const epsAdj = candidate.price / candidate.pe;
  const hasNegativeEquity = candidate.hasNegativeEquity === true;
  const bvps = hasNegativeEquity ? null : (candidate.pb ? candidate.price / candidate.pb : null);
  const pe = price / epsAdj;
  const pb = bvps !== null && bvps > 0 ? price / bvps : null;
  const pePb = pe !== null && pb !== null ? pe * pb : null;
  const grahamFormula = epsAdj > 0 && bvps !== null && bvps > 0 ? Math.sqrt(22.5 * epsAdj * bvps) : null;
  const pricePe20 = epsAdj * 20;
  const pricePb2 = bvps !== null && bvps > 0 ? bvps * 2 : null;
  const maxDefensivePrice = grahamFormula !== null && pricePb2 !== null
    ? Math.min(grahamFormula, pricePe20, pricePb2)
    : pricePe20;

  const ratios = {
    pe,
    pb,
    pePb,
    hasNegativeEquity: hasNegativeEquity || null,
    debtRatio: candidate.debtRatio,
    currentRatio: candidate.currentRatio,
    quickRatio: candidate.quickRatio,
    fcf: candidate.fcf,
    epsAllPositive: candidate.epsAllPositive,
    epsGrowing: candidate.epsGrowing ?? null,
    roe: candidate.roe ?? null,
    roa: candidate.roa ?? null,
    tie: candidate.tie ?? null,
    epsAdj,
    bvps,
    price,
    grahamFormula,
    pricePe20,
    pricePb2,
    maxDefensivePrice,
    distanceToDefensive: maxDefensivePrice > 0 ? (price - maxDefensivePrice) / maxDefensivePrice : null,
    marginOfSafety: price > 0 && grahamFormula !== null ? (grahamFormula - price) / price : null,
  };

  return ratios;
}

export function hasFinancialSnapshot(candidate) {
  // Equity negativo: P/B no aplica, evaluamos solo por P/E + currentRatio
  if (candidate.hasNegativeEquity) {
    return isAvailableRatio(candidate.price) && isAvailableRatio(candidate.pe) && isAvailableRatio(candidate.currentRatio);
  }
  const base = [candidate.price, candidate.pe, candidate.pb].every(isAvailableRatio);
  if (!base) return false;
  // Bancos, seguros y REITs no reportan currentRatio/debtRatio en formato industrial
  if (isFinancialSector(candidate)) return true;
  return isAvailableRatio(candidate.debtRatio) && isAvailableRatio(candidate.currentRatio);
}

export function countAvailableCriticalRatios(candidate) {
  // Equity negativo: pb y debtRatio no son ratios disponibles en sentido Graham
  if (candidate.hasNegativeEquity) {
    return ["pe", "currentRatio", "fcf"].filter((key) => isAvailableRatio(candidate[key])).length;
  }
  return CRITICAL_RATIO_KEYS.filter((key) => isAvailableRatio(candidate[key])).length;
}

export function evaluateCandidate(candidate, quote = null, policy = DEFAULT_ALERT_POLICY) {
  const price = quote?.price ?? candidate.lastPrice ?? candidate.price;
  if (isReferenceInstrument(candidate)) {
    return withSystemStatus({
      ...candidate,
      quote,
      livePrice: price ?? null,
      ratios: null,
      classification: {
        id: "index_reference",
        label: "REFERENCIA",
        color: "#38bdf8",
        reason: candidate.notes || "Instrumento de referencia para comparar mercado; no se analiza con reglas Graham defensivas.",
      },
      alertLevel: "reference",
      alertLabel: "Referencia de mercado",
      closeToDefensive: false,
      near: false,
    });
  }

  const criticalRatioCount = countAvailableCriticalRatios(candidate);
  // Financieras solo necesitan pe+pb+precio para un análisis válido; fcf/debtRatio/currentRatio no aplican igual
  const minRatios = isFinancialSector(candidate) ? 2 : 3;
  if (criticalRatioCount < minRatios) {
    if (candidate.validationStatus === "yahoo_model_rejected") {
      return withSystemStatus({
        ...candidate,
        quote,
        livePrice: quote?.price ?? candidate.price ?? null,
        ratios: null,
        classification: {
          id: candidate.classificationId || "rejected",
          label: candidate.classificationLabel || "RECHAZADA",
          color: "#ef4444",
          reason: candidate.notes || "Rechazada por modelo Graham defensivo con datos parciales no comparables.",
        },
        alertLevel: "watch",
        alertLabel: candidate.classificationLabel || "Rechazada por modelo",
        closeToDefensive: false,
        near: false,
      });
    }

    return withSystemStatus({
      ...candidate,
      analysisStatus: "analysis_incomplete",
      quote,
      livePrice: quote?.price ?? candidate.price ?? null,
      ratios: null,
      classification: {
        id: "analysis_incomplete",
        label: "DATOS INSUFICIENTES",
        color: "#94a3b8",
        reason: "Faltan al menos 3 de 5 ratios criticos para evaluar con Graham.",
      },
      alertLevel: "pending",
      alertLabel: "Datos insuficientes",
      closeToDefensive: false,
      near: false,
    });
  }

  const ratios = deriveSnapshot(candidate, price);
  if (!ratios) {
    if (candidate.analysisStatus === "analyzed") {
      return withSystemStatus({
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
      });
    }

    if (String(candidate.analysisStatus || "").startsWith("analysis_")) {
      return withSystemStatus({
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
      });
    }

    return withSystemStatus({
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
    });
  }

  const classification = classify(ratios);
  const financial = isFinancialSector(candidate);
  // Equity negativo: P/B no aplica, nunca puede aprobar Graham defensivo pero puede estar en "watch" con P/E bajo
  const near = ratios.hasNegativeEquity
    ? false
    : financial
    ? ratios.pePb <= policy.nearPePb &&
      ratios.pe <= policy.nearPe &&
      ratios.pb <= policy.nearPb &&
      ratios.epsAllPositive === true
    : ratios.pePb <= policy.nearPePb &&
      ratios.pe <= policy.nearPe &&
      ratios.pb <= policy.nearPb &&
      ratios.debtRatio < policy.nearDebtRatio &&
      ratios.currentRatio >= policy.nearCurrentRatio &&
      ratios.epsAllPositive === true;
  // Equity negativo: sin P/B no hay precio defensivo Graham completo — no puede ser "cerca de aprobar"
  const closeToDefensive =
    !ratios.hasNegativeEquity &&
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

  return withSystemStatus({
    ...candidate,
    quote,
    livePrice: price,
    ratios,
    classification,
    alertLevel,
    alertLabel,
    closeToDefensive,
    near,
  });
}

export function screenWatchlist(items, quotesByTicker = {}, policy = DEFAULT_ALERT_POLICY) {
  return items
    .map((item) => evaluateCandidate(item, quotesByTicker[item.ticker] ?? null, policy))
    .sort((a, b) => {
      const rank = { approved: 0, near: 1, watch: 2, reference: 3, pending: 4 };
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
    reference: results.filter((result) => result.alertLevel === "reference"),
    pending: results.filter((result) => result.alertLevel === "pending"),
  };
}

export function isReferenceInstrument(candidate) {
  return (
    candidate.analysisStatus === "index_reference" ||
    candidate.analysisStatus === "market_reference" ||
    candidate.validationStatus === "index_reference" ||
    candidate.validationStatus === "market_reference" ||
    candidate.tags?.includes("index_reference") ||
    candidate.tags?.includes("market_reference") ||
    ["INDEX", "ETF", "FUTURE"].includes(String(candidate.quoteType || "").toUpperCase())
  );
}

function withSystemStatus(result) {
  return { ...result, systemStatus: mapSystemStatus(result) };
}

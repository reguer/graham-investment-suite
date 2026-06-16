import { classify } from "../graham-analyzer/classify.js";
import { detectSector } from "../graham-analyzer/detectSector.js";
import { getSectorProfile } from "../graham-analyzer/sectorProfiles.js";
import { actionableReason } from "../graham-analyzer/failingCriteria.js";
import { grahamNumber, maxDefensivePrice as defensiveCeiling, marginOfSafety } from "../../lib/grahamFormulas.js";
import { mapSystemStatus } from "./statusMapper.js";
import { DEFAULT_ALERT_POLICY } from "./watchlist.js";

const CRITICAL_RATIO_KEYS = ["pe", "pb", "debtRatio", "currentRatio", "fcf"];

// Resolve the sector profile for a candidate so the screen judges it against the
// same sector-adjusted thresholds as the manual analyzer (useAnalysis). Without
// this the screen applied industrial defaults to every company, so only builders
// passed and banks/utilities/tech/healthcare could never approve.
function profileFor(candidate) {
  return getSectorProfile(detectSector({ sector: candidate.sector, industry: candidate.industry, sicCode: candidate.sicCode }));
}

// A sector counts as "relaxed" when it omits the industrial liquidity/debt
// criteria (banks, REITs): such a company is analyzable from fewer ratios.
function isFinancialSector(candidate) {
  const omit = new Set(profileFor(candidate).omit || []);
  return omit.has("current") && omit.has("debt");
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
  const grahamFormula = grahamNumber(epsAdj, bvps);
  const pricePe20 = epsAdj * 20;
  const pricePb2 = bvps !== null && bvps > 0 ? bvps * 2 : null;
  const maxDefensivePrice = defensiveCeiling({ grahamFormula, pricePe20, pricePb2 });

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
    marginOfSafety: marginOfSafety(grahamFormula, price),
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

  const profile = profileFor(candidate);
  const classification = classify(ratios, profile);
  const omit = new Set(profile.omit || []);
  // "near" reuses the alert policy bands but skips whichever criteria the sector
  // omits (a bank has no industrial current/debt ratio), and reads P/B tangible
  // for intangible-heavy sectors — mirroring how classify judges the same company.
  const pbForNear = profile.useTangibleBook ? ratios.pbTangible : ratios.pb;
  const pePbForNear = profile.useTangibleBook ? ratios.pePbTangible : ratios.pePb;
  const passesNearGate = (omitted, value, ok) => omitted || (isAvailableRatio(value) && ok);
  // Equity negativo: P/B no aplica, nunca puede aprobar Graham defensivo pero puede estar en "watch" con P/E bajo
  const near = ratios.hasNegativeEquity
    ? false
    : passesNearGate(omit.has("pePb"), pePbForNear, pePbForNear <= policy.nearPePb) &&
      passesNearGate(omit.has("pe"), ratios.pe, ratios.pe <= policy.nearPe) &&
      passesNearGate(omit.has("pb"), pbForNear, pbForNear <= policy.nearPb) &&
      passesNearGate(omit.has("debt"), ratios.debtRatio, ratios.debtRatio < policy.nearDebtRatio) &&
      passesNearGate(omit.has("current"), ratios.currentRatio, ratios.currentRatio >= policy.nearCurrentRatio) &&
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

  // Actionable reason: which sector-adjusted criteria the company misses, so the
  // dashboard shows "Falla: P/B 3.1 > 2.0 · Deuda 1.4 > 1.0" instead of the
  // generic "no cumple los criterios mínimos". Approved companies keep their
  // positive verdict reason.
  const watchReason = alertLevel === "approved" ? classification.reason : actionableReason(ratios, profile);

  return withSystemStatus({
    ...candidate,
    quote,
    livePrice: price,
    ratios,
    classification,
    sectorProfileId: profile.id,
    alertLevel,
    alertLabel,
    watchReason,
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

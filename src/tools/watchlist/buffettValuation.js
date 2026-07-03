import { detectSector } from "../graham-analyzer/detectSector.js";

const DEFAULT_DECISION_STATUS = "PENDIENTE-DECISION";

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ratioOrNull(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

function latestSeriesEntry(series = []) {
  const entries = Array.isArray(series) ? [...series] : [];
  return entries
    .filter((entry) => Number.isFinite(Number(entry?.value)) && Number.isFinite(Number(entry?.fiscalYear)))
    .sort((left, right) => Number(right.fiscalYear) - Number(left.fiscalYear) || String(right.asOf || "").localeCompare(String(left.asOf || "")))[0] || null;
}

function seriesBounds(series = []) {
  const entries = Array.isArray(series) ? [...series] : [];
  const normalized = entries
    .filter((entry) => Number.isFinite(Number(entry?.value)) && Number.isFinite(Number(entry?.fiscalYear)))
    .sort((left, right) => Number(right.fiscalYear) - Number(left.fiscalYear) || String(right.asOf || "").localeCompare(String(left.asOf || "")));
  if (normalized.length < 2) return null;
  return { latest: normalized[0], oldest: normalized[normalized.length - 1] };
}

function seriesCagr(series = []) {
  const bounds = seriesBounds(series);
  if (!bounds) return null;
  const spanYears = Number(bounds.latest.fiscalYear) - Number(bounds.oldest.fiscalYear);
  const latestValue = numberOrNull(bounds.latest.value);
  const oldestValue = numberOrNull(bounds.oldest.value);
  if (spanYears < 1 || latestValue === null || oldestValue === null || latestValue <= 0 || oldestValue <= 0) return null;
  return (latestValue / oldestValue) ** (1 / spanYears) - 1;
}

function confidenceRank(value) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

function lowerConfidence(left, right) {
  return confidenceRank(left) <= confidenceRank(right) ? left : right;
}

function sectorIdForItem(item = {}) {
  return item.sectorProfileId || detectSector({ sector: item.sector, industry: item.industry, sicCode: item.sicCode });
}

function capitalIntensityTag(item = {}, capexToRevenue = null) {
  const sectorId = sectorIdForItem(item);
  const text = `${item.sector || ""} ${item.industry || ""}`.toLowerCase();
  if (["utilities", "industrial", "energy", "basic_materials"].includes(sectorId)) return "asset_heavy";
  if (text.includes("semiconductor")) return "asset_heavy";
  if (text.includes("software") || text.includes("saas") || text.includes("cloud") || text.includes("internet services")) return "asset_light";
  if (capexToRevenue !== null && capexToRevenue >= 0.12) return "asset_heavy";
  if (capexToRevenue !== null && capexToRevenue <= 0.05) return "asset_light";
  return "balanced";
}

function latestValue(series = []) {
  return numberOrNull(latestSeriesEntry(series)?.value);
}

function latestMeta(series = []) {
  const entry = latestSeriesEntry(series);
  return {
    asOf: entry?.asOf || null,
    source: entry?.source || null,
    sourceForm: entry?.sourceForm || null,
  };
}

function deriveMarketCap(item = {}, latestShares = null) {
  const explicit = numberOrNull(item.marketCap);
  if (explicit !== null) return { value: explicit, methodId: "market_cap.explicit", reason: "Se uso marketCap disponible en el snapshot/export publico." };
  const price = numberOrNull(item.livePrice ?? item.lastPrice ?? item.price);
  const shares = numberOrNull(latestShares);
  const adrRatio = numberOrNull(item.adrRatio) ?? 1;
  if (price === null || shares === null || adrRatio <= 0) {
    return { value: null, methodId: "market_cap.unavailable", reason: "Falta marketCap o una combinacion valida de precio + acciones para derivar owner earnings yield." };
  }
  return {
    value: (price * shares) / adrRatio,
    methodId: "market_cap.derived_from_price_and_shares",
    reason: adrRatio !== 1
      ? "Se derivo marketCap desde precio y acciones ajustando ADR ratio."
      : "Se derivo marketCap desde precio y acciones.",
  };
}

function buybackDirectionFromCagr(cagr) {
  if (cagr === null) return "N/D";
  if (cagr <= -0.02) return "recompra_neta";
  if (cagr < -0.005) return "ligera_recompra";
  if (cagr < 0.015) return "capital_estable";
  if (cagr >= 0.02) return "dilucion_sbc";
  return "ligera_dilucion";
}

export function estimateMaintenanceCapex(item = {}, options = {}) {
  const series = item.buffettSeries || item;
  const sectorId = sectorIdForItem(item);
  const revenueLatest = latestValue(series.revenue);
  const reportedCapex = numberOrNull(item.reportedCapex ?? latestValue(series.capex));
  const depreciationAmortization = numberOrNull(item.depreciationAmortization ?? latestValue(series.depreciationAmortization));
  const disclosedMaintenanceCapex = numberOrNull(item.disclosedMaintenanceCapex?.value ?? item.disclosedMaintenanceCapex);
  const capexToRevenue = ratioOrNull(reportedCapex, revenueLatest);
  const intensityTag = capitalIntensityTag(item, capexToRevenue);
  const decisionStatus = options.decisionStatus || DEFAULT_DECISION_STATUS;

  if (disclosedMaintenanceCapex !== null) {
    return {
      maintenanceCapex: disclosedMaintenanceCapex,
      reportedCapex,
      depreciationAmortization,
      growthCapexProxy: reportedCapex !== null ? Math.max(reportedCapex - disclosedMaintenanceCapex, 0) : null,
      capitalIntensityTag: intensityTag,
      sectorId,
      sectorAdjustment: "disclosed",
      methodId: "maintenance_capex.disclosed",
      confidence: "high",
      decisionStatus,
      reason: "La empresa reporta maintenance capex explicito; se usa directamente sin heuristica.",
    };
  }

  if (reportedCapex === null) {
    return {
      maintenanceCapex: null,
      reportedCapex: null,
      depreciationAmortization,
      growthCapexProxy: null,
      capitalIntensityTag: intensityTag,
      sectorId,
      sectorAdjustment: "missing_capex",
      methodId: "maintenance_capex.insufficient_data",
      confidence: "low",
      decisionStatus,
      reason: "Falta reported capex; sin ese dato no se calcula maintenance capex ni owner earnings.",
    };
  }

  if (depreciationAmortization === null) {
    return {
      maintenanceCapex: null,
      reportedCapex,
      depreciationAmortization: null,
      growthCapexProxy: null,
      capitalIntensityTag: intensityTag,
      sectorId,
      sectorAdjustment: "missing_depreciation_amortization",
      methodId: "maintenance_capex.insufficient_data",
      confidence: "low",
      decisionStatus,
      reason: "Falta depreciation & amortization; la heuristica Buffett queda en null hasta definir un fallback adicional.",
    };
  }

  const baseMaintenanceCapex = Math.min(reportedCapex, depreciationAmortization);
  const heavyFloor = depreciationAmortization * 0.8;
  const lightCap = depreciationAmortization * 0.6;

  if (intensityTag === "asset_heavy") {
    const maintenanceCapex = Math.max(baseMaintenanceCapex, heavyFloor);
    return {
      maintenanceCapex,
      reportedCapex,
      depreciationAmortization,
      growthCapexProxy: Math.max(reportedCapex - maintenanceCapex, 0),
      capitalIntensityTag: intensityTag,
      sectorId,
      sectorAdjustment: "heavy_floor_0.8_da",
      methodId: "maintenance_capex.asset_heavy_floor",
      confidence: "medium",
      decisionStatus,
      reason: "Perfil asset-heavy: se usa el mayor entre min(capex, D&A) y 0.8 x D&A. El factor 0.8 queda en PENDIENTE-DECISION.",
    };
  }

  if (intensityTag === "asset_light") {
    const maintenanceCapex = Math.min(reportedCapex, lightCap);
    return {
      maintenanceCapex,
      reportedCapex,
      depreciationAmortization,
      growthCapexProxy: Math.max(reportedCapex - maintenanceCapex, 0),
      capitalIntensityTag: intensityTag,
      sectorId,
      sectorAdjustment: "asset_light_cap_0.6_da",
      methodId: "maintenance_capex.asset_light_cap",
      confidence: "low",
      decisionStatus,
      reason: "Perfil asset-light: se usa el menor entre reported capex y 0.6 x D&A. El factor 0.6 queda en PENDIENTE-DECISION.",
    };
  }

  return {
    maintenanceCapex: baseMaintenanceCapex,
    reportedCapex,
    depreciationAmortization,
    growthCapexProxy: Math.max(reportedCapex - baseMaintenanceCapex, 0),
    capitalIntensityTag: intensityTag,
    sectorId,
    sectorAdjustment: "base_min_capex_da",
    methodId: "maintenance_capex.base_min_capex_da",
    confidence: "medium",
    decisionStatus,
    reason: "Sin disclosure directo ni ajuste sectorial extremo, se usa min(reported capex, D&A).",
  };
}

export function buildOwnerEarnings(item = {}, options = {}) {
  const series = item.buffettSeries || item;
  const operatingCFEntry = latestSeriesEntry(series.operatingCF);
  const revenueEntry = latestSeriesEntry(series.revenue);
  const sharesEntry = latestSeriesEntry(series.sharesOutstanding);
  const maintenance = estimateMaintenanceCapex(item, options);

  if (!operatingCFEntry) {
    return {
      ownerEarnings: null,
      ownerEarningsMargin: null,
      ownerEarningsPerShare: null,
      ownerEarningsYield: null,
      reportedCapex: maintenance.reportedCapex,
      maintenanceCapex: maintenance.maintenanceCapex,
      growthCapexProxy: maintenance.growthCapexProxy,
      maintenanceCapexMethodId: maintenance.methodId,
      maintenanceCapexConfidence: maintenance.confidence,
      methodId: "owner_earnings.insufficient_operating_cf",
      confidence: "low",
      reason: "Falta operating cash flow anual; owner earnings queda en null.",
      yieldReason: "Sin operating cash flow no se puede llegar a owner earnings yield.",
    };
  }

  if (maintenance.maintenanceCapex === null) {
    return {
      ownerEarnings: null,
      ownerEarningsMargin: null,
      ownerEarningsPerShare: null,
      ownerEarningsYield: null,
      reportedCapex: maintenance.reportedCapex,
      maintenanceCapex: null,
      growthCapexProxy: null,
      maintenanceCapexMethodId: maintenance.methodId,
      maintenanceCapexConfidence: maintenance.confidence,
      methodId: "owner_earnings.insufficient_maintenance_capex",
      confidence: "low",
      reason: maintenance.reason,
      yieldReason: maintenance.reason,
    };
  }

  const ownerEarnings = operatingCFEntry.value - maintenance.maintenanceCapex;
  const ownerEarningsMargin = revenueEntry ? ratioOrNull(ownerEarnings, numberOrNull(revenueEntry.value)) : null;
  const adrRatio = numberOrNull(item.adrRatio) ?? 1;
  const shares = numberOrNull(sharesEntry?.value);
  const ownerEarningsPerShare = shares !== null && shares > 0 ? (ownerEarnings / shares) * adrRatio : null;
  const derivedMarketCap = deriveMarketCap(item, shares);
  const ownerEarningsYield = ratioOrNull(ownerEarnings, derivedMarketCap.value);

  return {
    ownerEarnings,
    ownerEarningsMargin,
    ownerEarningsPerShare,
    ownerEarningsYield,
    reportedCapex: maintenance.reportedCapex,
    maintenanceCapex: maintenance.maintenanceCapex,
    growthCapexProxy: maintenance.growthCapexProxy,
    maintenanceCapexMethodId: maintenance.methodId,
    maintenanceCapexConfidence: maintenance.confidence,
    methodId: "owner_earnings.operating_cf_minus_maintenance_capex",
    confidence: lowerConfidence("medium", maintenance.confidence),
    capitalIntensityTag: maintenance.capitalIntensityTag,
    sectorId: maintenance.sectorId,
    reason: `Owner earnings calculado como operating CF menos maintenance capex estimado por ${maintenance.methodId}.`,
    yieldReason: ownerEarningsYield === null ? derivedMarketCap.reason : "Owner earnings yield calculado sobre market cap disponible o derivado.",
    asOf: operatingCFEntry.asOf || maintenance.asOf || null,
  };
}

export function buildCapitalAllocationMetrics(item = {}, options = {}) {
  const series = item.buffettSeries || item;
  const ownerEarningsResult = options.ownerEarningsResult || buildOwnerEarnings(item, options);
  const sharesSeries = Array.isArray(series.sharesOutstanding) ? series.sharesOutstanding : [];
  const cashEntry = latestSeriesEntry(series.cash);
  const debtEntry = latestSeriesEntry(series.totalDebt);
  const operatingIncomeEntry = latestSeriesEntry(series.operatingIncome);
  const operatingCFEntry = latestSeriesEntry(series.operatingCF);
  const capexEntry = latestSeriesEntry(series.capex);
  const shareCountCagr = seriesCagr(sharesSeries);
  const buybackDirection = buybackDirectionFromCagr(shareCountCagr);
  const cashValue = numberOrNull(cashEntry?.value);
  const debtValue = numberOrNull(debtEntry?.value);
  const operatingIncomeValue = numberOrNull(operatingIncomeEntry?.value);
  const operatingCFValue = numberOrNull(operatingCFEntry?.value);
  const capexValue = numberOrNull(capexEntry?.value);
  const netDebt = cashValue !== null && debtValue !== null ? debtValue - cashValue : null;
  const netDebtToOperatingIncome = ratioOrNull(netDebt, operatingIncomeValue);
  const interestCoverage = numberOrNull(item.ratios?.tie ?? item.tie);
  const reinvestmentRate = operatingCFValue !== null && operatingCFValue > 0 ? ratioOrNull(capexValue, operatingCFValue) : null;
  const growthCapexToCapex = capexValue !== null && capexValue > 0
    ? ratioOrNull(ownerEarningsResult.growthCapexProxy, capexValue)
    : null;
  const ownerEarningsCoverage = operatingCFValue !== null && operatingCFValue > 0 && ownerEarningsResult.ownerEarnings !== null
    ? ratioOrNull(ownerEarningsResult.ownerEarnings, operatingCFValue)
    : null;
  const reasons = {
    shareCountCagr: shareCountCagr === null ? "Faltan al menos dos anos comparables de shares outstanding." : `Share count CAGR calculado con serie ${sharesSeries.length}Y.`,
    netDebt: netDebt === null ? "Faltan cash y/o total debt para deuda neta." : "Deuda neta calculada con cash y total debt del ultimo ano disponible.",
    netDebtToOperatingIncome: netDebtToOperatingIncome === null ? "Falta operating income positivo o deuda neta para el ratio de apalancamiento." : "Se usa operating income como proxy de EBIT para este ratio numerico.",
    interestCoverage: interestCoverage === null ? "No hay tie / interest coverage util en el snapshot actual." : "Se reutiliza tie del snapshot actual; no se infiere una serie adicional en esta story.",
    reinvestmentRate: reinvestmentRate === null ? "Falta capex u operating CF positivo para medir reinversion." : "Reinvestment rate calculado como reported capex / operating CF.",
    growthCapexToCapex: growthCapexToCapex === null ? "Falta growth capex proxy o reported capex para medir capex de expansion." : "Growth capex proxy calculado desde maintenance capex estimado.",
    ownerEarningsCoverage: ownerEarningsCoverage === null ? "Falta operating CF positivo u owner earnings util para medir cobertura." : "Owner earnings coverage calculado como owner earnings / operating CF.",
  };

  const availableCoreMetrics = [shareCountCagr, netDebt, netDebtToOperatingIncome, reinvestmentRate].filter((value) => value !== null).length;
  const confidence = availableCoreMetrics >= 4 ? "high" : availableCoreMetrics >= 2 ? "medium" : "low";

  return {
    shareCountCagr,
    buybackDirection,
    netDebt,
    netDebtToOperatingIncome,
    interestCoverage,
    reinvestmentRate,
    growthCapexProxy: ownerEarningsResult.growthCapexProxy ?? null,
    growthCapexToCapex,
    ownerEarningsCoverage,
    maintenanceCapexMethodId: ownerEarningsResult.maintenanceCapexMethodId || null,
    methodId: "capital_allocation.v1",
    confidence,
    capitalIntensityTag: ownerEarningsResult.capitalIntensityTag || capitalIntensityTag(item, ratioOrNull(capexValue, latestValue(series.revenue))),
    reason: "Capital allocation numerico construido sobre shares, deuda/caja, cobertura y reinversion; sin convertirlo todavia en score.",
    reasons,
  };
}

export { DEFAULT_DECISION_STATUS };

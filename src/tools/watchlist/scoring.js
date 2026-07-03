import { assessBuybackDilution, assessIntangibleBalance, assessSoftwareQuality } from "./qualityMetrics.js";

export const SCORE_V2_WEIGHT_STATUS = "PENDIENTE-DECISION";

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function points(value, bands) {
  const parsed = numberOrNull(value);
  if (parsed === null) return 0;
  for (const band of bands) {
    if (band.test(parsed)) return band.points;
  }
  return 0;
}

function epsNeverDeclined(epsHistory) {
  if (!Array.isArray(epsHistory) || epsHistory.length < 3) return null;
  return epsHistory.every((entry, index, items) => index === items.length - 1 || Number(entry.eps) >= Number(items[index + 1]?.eps));
}

function pctFromPoints(score, max) {
  return max > 0 ? clamp((score / max) * 100) : 0;
}

function qualityLayerLabel(qualityPct, resiliencePct, epsPositive) {
  if (qualityPct >= 70 && resiliencePct >= 60 && epsPositive === true) {
    return { id: "high_quality", label: "Alta calidad" };
  }
  if (qualityPct >= 45 && resiliencePct >= 40) {
    return { id: "medium_quality", label: "Calidad media" };
  }
  return { id: "low_quality", label: "Calidad baja" };
}

function labelForScore(value) {
  return value >= 80 ? "Excelente" : value >= 65 ? "Buena" : value >= 50 ? "Interesante" : value >= 35 ? "Debil" : "Riesgo alto";
}

function buildScoreV2({
  valuationPct,
  resiliencePct,
  qualityPct,
  buybackDilution,
  intangibleBalance,
  softwareQuality,
  moatSummary,
}) {
  // S72: score general separado del Graham puro. Interim 0.55 graham + 0.45
  // quality mientras no exista moat manual; la ponderacion final que incluya
  // moatScore queda en PENDIENTE-DECISION.
  const generalValue = Math.round(clamp(0.55 * valuationPct + 0.45 * qualityPct));
  return {
    grahamScore: {
      value: valuationPct,
      label: valuationPct >= 70 ? "Graham fuerte" : valuationPct >= 45 ? "Graham medio" : "Graham debil",
      weight: 0.55,
      weightStatus: SCORE_V2_WEIGHT_STATUS,
      reason: "Interim V2: grahamScore reutiliza el componente de valuacion Graham y pesa 0.55 en el score general. El Graham puro (clasificacion y gate de seguridad) se mantiene aparte.",
    },
    qualityScore: {
      value: qualityPct,
      label: qualityPct >= 70 ? "Calidad fuerte" : qualityPct >= 45 ? "Calidad media" : "Calidad debil",
      weight: 0.45,
      weightStatus: SCORE_V2_WEIGHT_STATUS,
      resilience: resiliencePct,
      buybackDilution,
      intangibleBalance,
      softwareQuality,
      reason: "Interim V2: qualityScore pesa 0.45 en el score general; resiliencia y subscores automaticos quedan como apoyo.",
    },
    moatScore: {
      value: null,
      label: moatSummary?.hasData ? moatSummary.label : "N/D (captura pendiente)",
      weight: null,
      weightStatus: SCORE_V2_WEIGHT_STATUS,
      captured: moatSummary?.hasData === true,
      confidence: moatSummary?.confidence ?? null,
      filledFieldCount: moatSummary?.filledFieldCount ?? 0,
      status: moatSummary?.status ?? "pending_manual",
      reason: moatSummary?.hasData
        ? "Moat capturado manualmente; falta definir la rubrica numerica para ponderarlo en el score general (PENDIENTE-DECISION)."
        : "Moat sin captura manual todavia. Registralo en la seccion Calidad y Moat con evidencia, fuente URL y fecha.",
    },
    generalScore: {
      value: generalValue,
      label: labelForScore(generalValue),
      weightsApproved: false,
      weightStatus: SCORE_V2_WEIGHT_STATUS,
      interimWeights: { graham: 0.55, quality: 0.45, moat: null },
      moatWeightPending: true,
      usesLegacyRanking: false,
      reason: "Score general separado del Graham puro: interim 0.55 grahamScore + 0.45 qualityScore. La ponderacion final que incluya moatScore queda en PENDIENTE-DECISION hasta capturar moat manual.",
    },
  };
}

export function scoreWatchlistItem(item) {
  const ratios = item.ratios || item;
  const buybackDilution = assessBuybackDilution(item);
  const intangibleBalance = assessIntangibleBalance({ ...item, ratios });
  const softwareQuality = assessSoftwareQuality({ ...item, ratios, buybackDilution });
  const epsHistory = item.epsHistory || [];
  const epsConsistent = epsNeverDeclined(epsHistory);
  const pe = ratios.pe ?? item.pe;
  const pb = ratios.pb ?? item.pb;
  const pePb = ratios.pePb ?? item.pePb;
  const debtRatio = ratios.debtRatio ?? item.debtRatio;
  const currentRatio = ratios.currentRatio ?? item.currentRatio;
  const quickRatio = ratios.quickRatio ?? item.quickRatio;
  const fcf = ratios.fcf ?? item.fcf;
  const roe = ratios.roe ?? item.roe;
  const roa = ratios.roa ?? item.roa;
  const mos = ratios.marginOfSafety;

  let valuation = 0;
  valuation += points(pe, [
    { test: (value) => value <= 15, points: 7 },
    { test: (value) => value <= 20, points: 5 },
    { test: (value) => value <= 25, points: 3 },
  ]);
  valuation += points(pb, [
    { test: (value) => value <= 1.5, points: 6 },
    { test: (value) => value <= 2, points: 4 },
    { test: (value) => value <= 2.5, points: 2 },
  ]);
  valuation += points(pePb, [
    { test: (value) => value <= 22.5, points: 7 },
    { test: (value) => value <= 28, points: 5 },
    { test: (value) => value <= 35, points: 3 },
  ]);
  valuation += points(mos, [
    { test: (value) => value >= 0.3, points: 5 },
    { test: (value) => value >= 0, points: 3 },
    { test: (value) => value >= -0.15, points: 1 },
  ]);

  let resilience = 0;
  resilience += points(debtRatio, [
    { test: (value) => value < 1, points: 6 },
    { test: (value) => value < 1.5, points: 4 },
    { test: (value) => value < 2.5, points: 2 },
  ]);
  resilience += points(currentRatio, [
    { test: (value) => value >= 2, points: 6 },
    { test: (value) => value >= 1.5, points: 4 },
    { test: (value) => value >= 1, points: 2 },
  ]);
  resilience += points(quickRatio, [
    { test: (value) => value >= 1, points: 4 },
    { test: (value) => value >= 0.7, points: 2 },
  ]);
  resilience += numberOrNull(fcf) > 0 ? 4 : 0;

  let quality = 0;
  quality += item.epsAllPositive === true || ratios.epsAllPositive === true ? 6 : 0;
  quality += epsConsistent === true || item.epsGrowing === true || ratios.epsGrowing === true ? 8 : 0;
  quality += points(roe, [
    { test: (value) => value >= 0.2, points: 5 },
    { test: (value) => value >= 0.1, points: 3 },
  ]);
  quality += points(roa, [
    { test: (value) => value >= 0.08, points: 4 },
    { test: (value) => value >= 0.05, points: 2 },
  ]);
  quality += points(ratios.tie ?? item.tie, [
    { test: (value) => value >= 5, points: 2 },
    { test: (value) => value >= 3, points: 1 },
  ]);

  const status = item.alertLevel === "approved" ? 15 : item.alertLevel === "near" ? 10 : item.alertLevel === "watch" ? 4 : 0;
  const data = item.analysisStatus === "analyzed" ? 10 : item.alertLevel === "reference" ? 0 : 3;
  const valuationPct = Math.round(pctFromPoints(valuation, 25));
  const resiliencePct = Math.round(pctFromPoints(resilience, 20));
  const qualityPct = Math.round(pctFromPoints(quality, 25));
  const qualityLayer = qualityLayerLabel(qualityPct, resiliencePct, item.epsAllPositive === true || ratios.epsAllPositive === true);

  const total = Math.round(clamp(valuation + resilience + quality + status + data));
  const label = labelForScore(total);
  const moatSummary = item.moatSummary || null;
  const scoreV2 = buildScoreV2({
    valuationPct,
    resiliencePct,
    qualityPct,
    buybackDilution,
    intangibleBalance,
    softwareQuality,
    moatSummary,
  });

  return {
    total,
    label,
    valuation: valuationPct,
    resilience: resiliencePct,
    quality: qualityPct,
    status: Math.round(pctFromPoints(status, 15)),
    data: Math.round(pctFromPoints(data, 10)),
    epsNeverDeclined: epsConsistent,
    qualityLayer,
    buybackDilution,
    intangibleBalance,
    softwareQuality,
    hasBuybackData: buybackDilution.hasData,
    ...scoreV2,
  };
}

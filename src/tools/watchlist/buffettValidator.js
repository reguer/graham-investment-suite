// S90: verificador de contradicciones IA vs metricas duras.
// Evita que una buena narrativa tape malos fundamentos. No llama a ninguna API:
// recibe la extraccion (S88) y las metricas duras ya calculadas, y devuelve las
// contradicciones detectadas para bajar confianza y bloquear la etiqueta final.

const SEVERITY_RANK = { low: 1, medium: 2, high: 3 };

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function assessmentOf(extraction, signal) {
  return extraction?.signals?.[signal]?.assessment || "unknown";
}

export function checkBuffettContradictions({ extraction, metrics = {} } = {}) {
  const contradictions = [];
  const grossMarginTrend5y = metrics.grossMarginTrend5y || null; // "down" | "flat" | "up"
  const netDebtToEbit = numberOrNull(metrics.netDebtToEbit ?? metrics.netDebtToOperatingIncome);
  const shareCountCagr = numberOrNull(metrics.shareCountCagr);
  const ownerEarnings = numberOrNull(metrics.ownerEarnings);

  if (assessmentOf(extraction, "pricingPower") === "strong" && grossMarginTrend5y === "down") {
    contradictions.push({
      signal: "pricingPower",
      claim: "pricing power fuerte",
      metric: "grossMarginTrend5y",
      value: grossMarginTrend5y,
      severity: "medium",
      reason: "La IA afirma pricing power fuerte pero el gross margin cae en 5 anos.",
    });
  }

  if (assessmentOf(extraction, "financialStrength") === "strong" && netDebtToEbit !== null && netDebtToEbit > 4) {
    contradictions.push({
      signal: "financialStrength",
      claim: "balance conservador",
      metric: "netDebtToEbit",
      value: netDebtToEbit,
      severity: "high",
      reason: "La IA afirma balance conservador pero netDebtToEbit > 4.",
    });
  }

  if (assessmentOf(extraction, "financialStrength") === "strong" && ownerEarnings !== null && ownerEarnings < 0) {
    contradictions.push({
      signal: "financialStrength",
      claim: "balance conservador",
      metric: "ownerEarnings",
      value: ownerEarnings,
      severity: "high",
      reason: "La IA afirma solidez financiera pero owner earnings es negativo.",
    });
  }

  if (assessmentOf(extraction, "capitalAllocationDiscipline") === "strong" && shareCountCagr !== null && shareCountCagr > 0.02) {
    contradictions.push({
      signal: "capitalAllocationDiscipline",
      claim: "recompras disciplinadas",
      metric: "shareCountCagr",
      value: shareCountCagr,
      severity: "high",
      reason: "La IA afirma recompras disciplinadas pero shareCountCagr > 2% (dilucion neta).",
    });
  }

  const severityMax = contradictions.reduce((max, entry) => Math.max(max, SEVERITY_RANK[entry.severity] || 0), 0);
  const severityLabel = Object.keys(SEVERITY_RANK).find((key) => SEVERITY_RANK[key] === severityMax) || "none";
  // Penalizacion de confianza acumulada y acotada; la calibracion fina queda en PENDIENTE-DECISION.
  const confidencePenalty = Math.min(
    0.6,
    contradictions.reduce((sum, entry) => sum + (entry.severity === "high" ? 0.3 : entry.severity === "medium" ? 0.15 : 0.05), 0),
  );

  return {
    contradictions,
    contradictionCount: contradictions.length,
    severityMax: severityLabel,
    requiresReview: contradictions.length > 0,
    blocksBuffettLabel: severityMax >= SEVERITY_RANK.high,
    confidencePenalty,
    reason: contradictions.length === 0
      ? "Sin contradicciones entre narrativa IA y metricas duras."
      : "La narrativa IA contradice metricas duras; se marca revision y se baja confianza.",
  };
}

import { fmt, pct } from "../../lib/formatters.js";

// S86: el motor Buffett todavia no se expone en dashboard ni GitHub Pages.
// Mientras siga en falso, las etiquetas y columnas Buffett se construyen pero
// no se renderizan. Encenderlo requiere mi aprobacion de nomenclatura final.
export const BUFFETT_UI_ENABLED = false;

const CHEAP_MOS_THRESHOLD = 0.2;

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buffettBlock(item = {}) {
  return item.buffett || {};
}

export function buildBuffettLabel(item = {}) {
  const buffett = buffettBlock(item);
  const qualityValue = numberOrNull(buffett.qualityScore?.value);
  const dcf = buffett.dcf || {};
  const dcfOk = dcf.valuationStatus === "ok";
  const mosBuffett = numberOrNull(dcf.mosBuffett);
  const evidenceConfirmed = buffett.evidenceConfirmed === true;

  if (qualityValue === null || !dcfOk || mosBuffett === null) {
    return {
      id: "insufficient_valuation",
      label: "Valuacion insuficiente",
      reason: "Falta quality score, un DCF valido o margen de seguridad Buffett para etiquetar la empresa.",
    };
  }

  if (qualityValue >= 70 && mosBuffett >= CHEAP_MOS_THRESHOLD) {
    if (evidenceConfirmed) {
      return {
        id: "buffett_candidate",
        label: "Buffett candidata",
        reason: "Calidad Buffett alta, margen de seguridad suficiente y evidencia cualitativa confirmada.",
      };
    }
    return {
      id: "high_quality_no_evidence",
      label: "Calidad alta sin evidencia",
      reason: "Calidad Buffett alta y precio atractivo, pero sin evidencia cualitativa confirmada todavia.",
    };
  }

  if (qualityValue >= 70 && mosBuffett < 0) {
    return {
      id: "excellent_but_expensive",
      label: "Excelente empresa, cara",
      reason: "Calidad Buffett alta pero el precio actual supera el valor intrinseco base.",
    };
  }

  return {
    id: "no_buffett_edge",
    label: "Sin ventaja Buffett clara",
    reason: "No cumple simultaneamente calidad alta y margen de seguridad suficiente.",
  };
}

export const BUFFETT_TABLE_COLUMNS = [
  {
    id: "buffettLabel",
    label: "Etiqueta Buffett",
    buffett: true,
    value: (item) => buildBuffettLabel(item).label,
  },
  {
    id: "ownerEarnings",
    label: "Owner Earnings",
    buffett: true,
    value: (item) => fmt(buffettBlock(item).ownerEarnings?.ownerEarnings),
  },
  {
    id: "mosBuffett",
    label: "MoS Buffett",
    buffett: true,
    value: (item) => pct(buffettBlock(item).dcf?.mosBuffett),
  },
  {
    id: "capitalAllocation",
    label: "Capital Allocation",
    buffett: true,
    value: (item) => fmt(buffettBlock(item).qualityScore?.capitalAllocationScore),
  },
  {
    id: "buffettConfidence",
    label: "Confidence",
    buffett: true,
    value: (item) => buffettBlock(item).qualityScore?.qualityConfidence || "",
  },
];

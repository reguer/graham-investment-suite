import { AC } from "../../lib/colors.js";

function isStrongCompany(ratios) {
  return (
    ratios.roe > 0.1 &&
    ratios.roa > 0.05 &&
    ratios.tie > 5 &&
    ratios.quickRatio >= 1 &&
    ratios.fcf > 0
  );
}

function isFiniteNumber(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

export function classify(ratios) {
  const approved =
    [ratios.pePb, ratios.debtRatio, ratios.currentRatio, ratios.pe, ratios.pb].every(isFiniteNumber) &&
    ratios.pePb <= 22.5 &&
    ratios.debtRatio < 1 &&
    ratios.currentRatio >= 2 &&
    ratios.epsAllPositive === true &&
    ratios.pe <= 20 &&
    ratios.pb <= 2;

  if (approved) {
    return {
      id: "graham_approved",
      label: "APROBADA GRAHAMIANA",
      color: AC.green,
      reason: "Cumple valuación defensiva, liquidez, deuda controlada y EPS positivo.",
    };
  }

  const strong = isFiniteNumber(ratios.pePb) && isStrongCompany(ratios) && ratios.pePb > 22.5 && ratios.epsAllPositive === true;

  if (strong && ratios.epsGrowing === true) {
    return {
      id: "excellent_expensive",
      label: "EXCELENTE, PERO CARA",
      color: AC.yellow,
      reason: "Empresa fuerte, pero cotiza fuera del rango Graham defensivo.",
    };
  }

  if (strong && ratios.epsGrowing === false) {
    return {
      id: "good_overvalued",
      label: "BUENA EMPRESA, SOBREVALORADA",
      color: AC.orange,
      reason: "La calidad financiera existe, pero el crecimiento de EPS no es consistente y la valuación excede 22.5.",
    };
  }

  return {
    id: "rejected",
    label: "RECHAZADA",
    color: AC.red,
    reason: "No cumple los criterios mínimos defensivos de Graham.",
  };
}

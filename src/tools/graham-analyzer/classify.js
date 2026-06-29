import { AC } from "../../lib/colors.js";
import { DEFAULT_PROFILE } from "./sectorProfiles.js";

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

export function classify(ratios, profile = DEFAULT_PROFILE) {
  const t = profile.thresholds;
  const omit = new Set(profile.omit || []);
  const pbValue = profile.useTangibleBook ? ratios.pbTangible : ratios.pb;
  const pePbValue = profile.useTangibleBook ? ratios.pePbTangible : ratios.pePb;

  // A criterion gate either is omitted for the sector (auto-pass) or must have
  // finite data AND meet the (sector-adjusted) threshold.
  const gate = (omitted, value, ok) => omitted || (isFiniteNumber(value) && ok);
  const positivePe = isFiniteNumber(ratios.pe) && ratios.pe > 0;
  const defensiveFoundations =
    gate(omit.has("debt"), ratios.debtRatio, ratios.debtRatio < t.debtMax) &&
    gate(omit.has("current"), ratios.currentRatio, ratios.currentRatio >= t.currentMin) &&
    positivePe;
  const valuationOutOfRange =
    (!omit.has("pe") && isFiniteNumber(ratios.pe) && ratios.pe > t.peMax) ||
    (!omit.has("pb") && isFiniteNumber(pbValue) && pbValue > t.pbMax) ||
    (!omit.has("pePb") && isFiniteNumber(pePbValue) && pePbValue > t.pePbMax);

  const approved =
    gate(omit.has("pePb"), pePbValue, pePbValue <= t.pePbMax) &&
    gate(omit.has("debt"), ratios.debtRatio, ratios.debtRatio < t.debtMax) &&
    gate(omit.has("current"), ratios.currentRatio, ratios.currentRatio >= t.currentMin) &&
    gate(omit.has("pe"), ratios.pe, ratios.pe <= t.peMax) &&
    gate(omit.has("pb"), pbValue, pbValue <= t.pbMax) &&
    ratios.epsAllPositive === true;

  if (approved) {
    return {
      id: "graham_approved",
      label: "APROBADA GRAHAMIANA",
      color: AC.green,
      reason: "Cumple valuación defensiva, liquidez, deuda controlada y EPS positivo.",
      sectorId: profile.id,
    };
  }

  if (valuationOutOfRange && defensiveFoundations && isStrongCompany(ratios)) {
    return {
      id: "excellent_expensive",
      label: "EXCELENTE, PERO CARA",
      color: AC.yellow,
      reason: "Empresa fuerte en balance, liquidez y rentabilidad actual, pero cotiza fuera del rango Graham defensivo.",
      sectorId: profile.id,
    };
  }

  if (valuationOutOfRange && defensiveFoundations) {
    return {
      id: "good_overvalued",
      label: "BUENA EMPRESA, SOBREVALORADA",
      color: AC.orange,
      reason: "Pasa la base defensiva de balance y liquidez, pero la calidad no es suficiente para considerarla excelente al precio actual.",
      sectorId: profile.id,
    };
  }

  return {
    id: "rejected",
    label: "RECHAZADA",
    color: AC.red,
    reason: "No cumple los criterios mínimos defensivos de Graham.",
    sectorId: profile.id,
  };
}

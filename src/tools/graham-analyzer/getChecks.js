import { DEFAULT_PROFILE } from "./sectorProfiles.js";

// Each check resolves to a tri-state status:
//   "pass"     — criterion met
//   "fail"     — criterion evaluated and not met
//   "unknown"  — required data is missing, so the criterion cannot be judged
//   "omitted"  — the criterion does not apply to this sector (e.g. current ratio
//                for a bank). Not a failure; rendered as "no aplica".
// `pass` is kept as a derived boolean (status === "pass") for backwards compatibility.
function check(id, label, ref, { omitted = false, available, condition } = {}) {
  let status;
  if (omitted) status = "omitted";
  else if (!available) status = "unknown";
  else status = condition ? "pass" : "fail";
  return { id, label, ref, status, pass: status === "pass" };
}

function has(value) {
  return value !== null && value !== undefined && !(typeof value === "number" && Number.isNaN(value));
}

export function getChecks(ratios, profile = DEFAULT_PROFILE) {
  const t = profile.thresholds;
  const omit = new Set(profile.omit || []);
  // Tech/healthcare judge book value on a tangible basis.
  const pbValue = profile.useTangibleBook ? ratios.pbTangible : ratios.pb;
  const pePbValue = profile.useTangibleBook ? ratios.pePbTangible : ratios.pePb;
  const pbLabel = profile.useTangibleBook ? "tangible " : "";

  return [
    check("pe", `P/E menor o igual a ${t.peMax}`, "Security Analysis, Cap. 39", {
      omitted: omit.has("pe"),
      available: has(ratios.pe),
      condition: ratios.pe <= t.peMax,
    }),
    check(
      "pb",
      ratios.hasNegativeEquity ? "P/B: patrimonio negativo — no aplica Graham" : `P/B ${pbLabel}menor o igual a ${t.pbMax}`,
      "El Inversor Inteligente, Cap. 14",
      {
        omitted: omit.has("pb"),
        available: has(pbValue) && !ratios.hasNegativeEquity,
        condition: pbValue <= t.pbMax,
      },
    ),
    check("pePb", `P/E x P/B ${pbLabel}menor o igual a ${t.pePbMax}`, "Regla Graham 15 x 1.5", {
      omitted: omit.has("pePb"),
      available: has(pePbValue),
      condition: pePbValue <= t.pePbMax,
    }),
    check("debt", `Pasivos / patrimonio menor a ${t.debtMax}`, "Security Analysis, Cap. 42", {
      omitted: omit.has("debt"),
      available: has(ratios.debtRatio),
      condition: ratios.debtRatio < t.debtMax,
    }),
    check("current", `Ratio corriente mayor o igual a ${t.currentMin}`, "El Inversor Inteligente, Cap. 14", {
      omitted: omit.has("current"),
      available: has(ratios.currentRatio),
      condition: ratios.currentRatio >= t.currentMin,
    }),
    check("quick", `Quick ratio mayor o igual a ${t.quickMin}`, "Security Analysis, Cap. 43", {
      omitted: omit.has("quick"),
      available: has(ratios.quickRatio),
      condition: ratios.quickRatio >= t.quickMin,
    }),
    check("tie", "Cobertura de intereses mayor a 5", "Security Analysis, Cap. 8", {
      omitted: omit.has("tie"),
      available: has(ratios.tie),
      condition: ratios.tie > 5,
    }),
    check("fcf", "Flujo libre de caja positivo", "Flujo real de caja", {
      omitted: omit.has("fcf"),
      available: has(ratios.fcf),
      condition: ratios.fcf > 0,
    }),
    check("eps", "EPS histórico positivo", "El Inversor Inteligente, Cap. 14", {
      omitted: omit.has("eps"),
      available: ratios.epsAllPositive !== null && ratios.epsAllPositive !== undefined,
      condition: ratios.epsAllPositive === true,
    }),
    check("epsGrowing", "EPS creciente del año reciente al antiguo", "Consistencia de beneficios", {
      omitted: omit.has("epsGrowing"),
      available: ratios.epsGrowing !== null && ratios.epsGrowing !== undefined,
      condition: ratios.epsGrowing === true,
    }),
  ];
}

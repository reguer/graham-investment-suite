// Each check resolves to a tri-state status:
//   "pass"    — criterion met
//   "fail"    — criterion evaluated and not met
//   "unknown" — required data is missing, so the criterion cannot be judged
// `pass` is kept as a derived boolean (status === "pass") for backwards compatibility.
function check(id, label, ref, available, condition) {
  const status = !available ? "unknown" : condition ? "pass" : "fail";
  return { id, label, ref, status, pass: status === "pass" };
}

function has(value) {
  return value !== null && value !== undefined && !(typeof value === "number" && Number.isNaN(value));
}

export function getChecks(ratios) {
  return [
    check("pe", "P/E menor o igual a 20", "Security Analysis, Cap. 39", has(ratios.pe), ratios.pe <= 20),
    check(
      "pb",
      ratios.hasNegativeEquity ? "P/B: patrimonio negativo — no aplica Graham" : "P/B menor o igual a 2",
      "El Inversor Inteligente, Cap. 14",
      has(ratios.pb) && !ratios.hasNegativeEquity,
      ratios.pb <= 2,
    ),
    check("pePb", "P/E x P/B menor o igual a 22.5", "Regla Graham 15 x 1.5", has(ratios.pePb), ratios.pePb <= 22.5),
    check("debt", "Pasivos / patrimonio menor a 1", "Security Analysis, Cap. 42", has(ratios.debtRatio), ratios.debtRatio < 1),
    check("current", "Ratio corriente mayor o igual a 2", "El Inversor Inteligente, Cap. 14", has(ratios.currentRatio), ratios.currentRatio >= 2),
    check("quick", "Quick ratio mayor o igual a 1", "Security Analysis, Cap. 43", has(ratios.quickRatio), ratios.quickRatio >= 1),
    check("tie", "Cobertura de intereses mayor a 5", "Security Analysis, Cap. 8", has(ratios.tie), ratios.tie > 5),
    check("fcf", "Flujo libre de caja positivo", "Flujo real de caja", has(ratios.fcf), ratios.fcf > 0),
    check("eps", "EPS histórico positivo", "El Inversor Inteligente, Cap. 14", ratios.epsAllPositive !== null && ratios.epsAllPositive !== undefined, ratios.epsAllPositive === true),
    check("epsGrowing", "EPS creciente del año reciente al antiguo", "Consistencia de beneficios", ratios.epsGrowing !== null && ratios.epsGrowing !== undefined, ratios.epsGrowing === true),
  ];
}

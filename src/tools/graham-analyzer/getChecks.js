export function getChecks(ratios) {
  return [
    { id: "pe", label: "P/E menor o igual a 20", pass: ratios.pe !== null && ratios.pe <= 20, ref: "Security Analysis, Cap. 39" },
    { id: "pb", label: ratios.hasNegativeEquity ? "P/B: patrimonio negativo — no aplica Graham" : "P/B menor o igual a 2", pass: ratios.pb !== null && !ratios.hasNegativeEquity && ratios.pb <= 2, ref: "El Inversor Inteligente, Cap. 14" },
    { id: "pePb", label: "P/E x P/B menor o igual a 22.5", pass: ratios.pePb !== null && ratios.pePb <= 22.5, ref: "Regla Graham 15 x 1.5" },
    { id: "debt", label: "Pasivos / patrimonio menor a 1", pass: ratios.debtRatio !== null && ratios.debtRatio < 1, ref: "Security Analysis, Cap. 42" },
    { id: "current", label: "Ratio corriente mayor o igual a 2", pass: ratios.currentRatio !== null && ratios.currentRatio >= 2, ref: "El Inversor Inteligente, Cap. 14" },
    { id: "quick", label: "Quick ratio mayor o igual a 1", pass: ratios.quickRatio !== null && ratios.quickRatio >= 1, ref: "Security Analysis, Cap. 43" },
    { id: "tie", label: "Cobertura de intereses mayor a 5", pass: ratios.tie !== null && ratios.tie > 5, ref: "Security Analysis, Cap. 8" },
    { id: "fcf", label: "Flujo libre de caja positivo", pass: ratios.fcf !== null && ratios.fcf > 0, ref: "Flujo real de caja" },
    { id: "eps", label: "EPS histórico positivo", pass: ratios.epsAllPositive === true, ref: "El Inversor Inteligente, Cap. 14" },
    { id: "epsGrowing", label: "EPS creciente del año reciente al antiguo", pass: ratios.epsGrowing === true, ref: "Consistencia de beneficios" },
  ];
}

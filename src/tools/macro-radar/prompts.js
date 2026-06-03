export function buildMacroPrompt(indicators) {
  const rows = indicators.map((item) => `${item.label}: ${item.value || "N/D"} (${item.trend})`).join("\n");
  return `Analiza el contexto macro para timing de inversion valor Graham. No inventes indicadores faltantes.\n\n${rows}`;
}

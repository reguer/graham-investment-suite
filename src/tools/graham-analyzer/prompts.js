import { fmt, pct } from "../../lib/formatters.js";

function isBlank(value) {
  if (value === null || value === undefined) return true;
  const str = String(value).trim();
  return str === "" || str === "—" || str === "null" || str === "undefined";
}

function optLine(label, value) {
  if (isBlank(value)) return null;
  return `- ${label}: ${value}`;
}

function textField(value, fallback = "N/D") {
  return isBlank(value) ? fallback : String(value).trim();
}

export function buildPrompt(company, ratios, classification) {
  const peDisplay =
    ratios.pe === null && ratios.epsAdj !== null && ratios.epsAdj <= 0
      ? "N/A por EPS negativo o cero"
      : fmt(ratios.pe);

  const ratioLines = [
    optLine("P/E", peDisplay),
    optLine("P/B", fmt(ratios.pb)),
    optLine("P/E x P/B", fmt(ratios.pePb)),
    optLine("P/E x P/B tangible", fmt(ratios.pePbTangible)),
    optLine("Current Ratio", fmt(ratios.currentRatio)),
    optLine("Quick Ratio", fmt(ratios.quickRatio)),
    optLine("Debt Ratio", fmt(ratios.debtRatio)),
    optLine("TIE", ratios.tie === Infinity ? "Infinity" : fmt(ratios.tie)),
    optLine("ROE", pct(ratios.roe)),
    optLine("ROA", pct(ratios.roa)),
    optLine("FCF", fmt(ratios.fcf)),
    optLine("NCAV por ADR/accion", fmt(ratios.ncav)),
    optLine("Formula Graham", fmt(ratios.grahamFormula)),
    optLine("Formula Graham tangible", fmt(ratios.grahamFormulaTangible)),
    optLine("Margen de seguridad Graham", pct(ratios.mosGraham)),
    optLine("EPS ajustado ADR", fmt(ratios.epsAdj)),
    optLine("EPS historico positivo", ratios.epsAllPositive === true ? "si" : ratios.epsAllPositive === false ? "no" : null),
    optLine("EPS creciente", ratios.epsGrowing === true ? "si" : ratios.epsGrowing === false ? "no" : null),
  ].filter(Boolean).join("\n");

  return `Eres un analista financiero senior especializado en inversion en valor estilo Benjamin Graham. Tu audiencia es un contador-financiero mexicano experimentado.

Analiza esta empresa en espanol, directo y con criterio Graham. No inventes datos.

Empresa: ${textField(company.ticker)} - ${textField(company.companyName)}
Fecha: ${textField(company.date)}
Precio: ${fmt(ratios.price)}
Clasificacion calculada: ${classification.label}
Razon: ${classification.reason}

Ratios disponibles:
${ratioLines}

Responde en 6 secciones:
1. VEREDICTO RAPIDO
2. QUE DICE GRAHAM
3. FORTALEZAS
4. RIESGOS Y BANDERAS ROJAS
5. PRECIO DE ENTRADA
6. ACCION RECOMENDADA`;
}

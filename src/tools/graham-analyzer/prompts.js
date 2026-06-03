import { fmt, pct } from "../../lib/formatters.js";

export function buildPrompt(company, ratios, classification) {
  return `Eres un analista financiero senior especializado en inversion en valor estilo Benjamin Graham. Tu audiencia es un contador-financiero mexicano experimentado.

Analiza esta empresa en espanol, directo y con criterio Graham. No inventes datos.

Empresa: ${company.ticker || "N/D"} - ${company.companyName || "N/D"}
Fecha: ${company.date || "N/D"}
Precio: ${fmt(ratios.price)}
Clasificacion calculada: ${classification.label}
Razon: ${classification.reason}

Ratios:
- P/E: ${ratios.pe === null && ratios.epsAdj !== null && ratios.epsAdj <= 0 ? "N/A por EPS negativo o cero" : fmt(ratios.pe)}
- P/B: ${fmt(ratios.pb)}
- P/E x P/B: ${fmt(ratios.pePb)}
- Current Ratio: ${fmt(ratios.currentRatio)}
- Quick Ratio: ${fmt(ratios.quickRatio)}
- Debt Ratio: ${fmt(ratios.debtRatio)}
- TIE: ${ratios.tie === Infinity ? "Infinity" : fmt(ratios.tie)}
- ROE: ${pct(ratios.roe)}
- ROA: ${pct(ratios.roa)}
- FCF: ${fmt(ratios.fcf)}
- NCAV por ADR/accion: ${fmt(ratios.ncav)}
- Formula Graham: ${fmt(ratios.grahamFormula)}
- Formula Graham tangible: ${fmt(ratios.grahamFormulaTangible)}
- Margen de seguridad Graham: ${pct(ratios.mosGraham)}
- EPS ajustado ADR: ${fmt(ratios.epsAdj)}
- EPS historico positivo: ${ratios.epsAllPositive ? "si" : "no"}
- EPS creciente: ${ratios.epsGrowing ? "si" : "no"}

Responde en 6 secciones:
1. VEREDICTO RAPIDO
2. QUE DICE GRAHAM
3. FORTALEZAS
4. RIESGOS Y BANDERAS ROJAS
5. PRECIO DE ENTRADA
6. ACCION RECOMENDADA`;
}

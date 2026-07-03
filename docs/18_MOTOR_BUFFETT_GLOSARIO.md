# 18 — Motor Buffett: glosario y marco operativo (S78)

> Glosario único del motor Buffett (E25/E26). Define cada concepto con fórmula,
> fuente y límite, y declara qué es automático, qué es manual y qué sigue
> pendiente. Ningún componente puede volver a usar "Buffett" como alias de la
> capa de calidad Graham (esa es la "Capa de calidad", ver `scoring.js`).

## Principios

- El motor Buffett es **separado** del filtro Graham. Graham sigue siendo el freno de seguridad; Buffett mide calidad de negocio y valor intrínseco.
- Comparten **la misma capa de datos normalizada** (`qualityMetrics.js` / `buffettSeries.js`), pero la lógica de scoring, owner earnings, DCF, prompts, contradicciones y etiquetas es independiente.
- Faltantes = `null` / `unknown` / `insufficient_evidence`. Nunca cero.
- Ningún score aprueba compra por sí solo. La tesis final y la evidencia cualitativa fuerte requieren criterio humano.

## Definiciones (automático)

| Concepto | Definición | Fuente | Estado |
|----------|-----------|--------|--------|
| `buffettSeries` | Series 5-10Y normalizadas: revenue, operatingIncome, netIncome, operatingCF, capex, D&A, sharesOutstanding, cash, totalDebt, márgenes. | SEC Company Facts (primaria), Yahoo (fallback). | Aprobado |
| `maintenanceCapex` | Capex de mantenimiento. Jerarquía: disclosure → asset-heavy `max(min(capex,D&A), 0.8·D&A)` → asset-light `min(capex, 0.6·D&A)` → balanceado `min(capex,D&A)`. | `buffettValuation.js`, ver `formulas.md`. | Aprobado 2026-07-03 |
| `ownerEarnings` | `operatingCF − maintenanceCapex`. `null` + razón si falta insumo. | `buffettValuation.js` | Aprobado |
| `capitalAllocationScore` | Sub-score de recompras/dilución, deuda neta, cobertura y reinversión (`shareCountCagr`, `netDebtToOperatingIncome`, etc.). | `buffettValuation.js` | Aprobado |
| `buffettQualityScore` | Promedio ponderado: owner earnings, capital allocation y FCF (0.20 c/u), rentabilidad (0.15), estabilidad de margen y retornos proxy (0.10 c/u), intangibles (0.05). Renormaliza sobre componentes disponibles. | `buffettValuation.js` | Pesos aprobados 2026-07-03 |
| `buffettValuationScore` / DCF | DCF 10Y sobre owner earnings, escenarios bear/base/bull, `requiredReturn = 10%`, `terminalGrowth = 2.5%`, crecimiento base ≤ histórico y ≤ techo sectorial, sin DCF si <5 años limpios. `mosBuffett = (intrínseco base/acción − precio) / intrínseco base/acción`. | `buffettValuation.js` | Defaults aprobados 2026-07-03 |
| `buffettCandidateLabel` | `Buffett candidata` (calidad alta + MoS ≥ 20% + evidencia confirmada), `Excelente empresa, cara`, `Calidad alta sin evidencia`, `Valuación insuficiente`. | `buffettLabels.js` | Aprobado; UI detrás de flag apagado |
| Extracción IA | Prompt JSON con `facts/inferences/risks/sourceRefs/followUpQuestions`, abstención `unknown`; verificador de contradicciones vs métricas duras. | `buffettPrompts.js`, `buffettValidator.js` | Prompts/validador listos; corrida real en dry-run |

## Definiciones (manual, con evidencia)

`moatRating`, `strategicContracts`, `regulatoryTailwind`, `customerConcentration`, `managementQuality`, `technologyMoatEvidence`, `ownerThesis` — capturados con `value / sourceUrl / asOf / confidence / notes` en `moatManual.js` y superficie en `moatScore`.

## Registro de PENDIENTE-DECISION

| Ítem | Story | Qué falta | Bloqueante |
|------|-------|-----------|------------|
| Ponderación numérica del moat en `generalScore` | S72 | Definir rúbrica que convierta el moat manual capturado en `moatScore.value` y su peso en el score general. Hoy interim 0.55 graham / 0.45 quality, moat sin peso. | No — interim funciona |
| Fuentes documentales para IA | S87 | Decidir qué 10-K / cartas / transcripts se ingieren y con qué licencia. Recomendado: empezar solo con 10-K y cartas (SEC EDGAR, dominio público). | No — pipeline en dry-run |
| Orden de lotes de rollout | S91 | Fijar cohortes. Recomendado: Top 10 → posiciones → semiconductores → software → industriales, un lote a la vez con revisión humana. | No — no se ejecuta IA real aún |
| Conexión real a modelo IA | S89 | Aprobar presupuesto/modelo antes de encender modo `live`. | No — dry-run por defecto |

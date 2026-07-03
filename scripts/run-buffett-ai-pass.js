// S89: pipeline de interpretacion IA para el motor Buffett.
//
// IMPORTANTE: por defecto corre en DRY-RUN y NO llama a ninguna API ni gasta
// tokens. La conexion real a un modelo queda en PENDIENTE-DECISION (presupuesto
// y modelo). Para tests y corridas locales se puede inyectar `runModel`, pero el
// modo dry-run nunca lo invoca: devuelve `insufficient_evidence` de forma
// deterministica.

import { buildBuffettExtractionPrompt, emptyBuffettExtraction, validateBuffettExtraction } from "../src/tools/watchlist/buffettPrompts.js";
import { checkBuffettContradictions } from "../src/tools/watchlist/buffettValidator.js";
import { buildBuffettBlock } from "../src/tools/watchlist/buffettValuation.js";

export const DRY_RUN_MODEL = "dry-run/no-api";

function insufficientEvidenceEntry(ticker, hardMetrics, runAt) {
  const extraction = emptyBuffettExtraction(ticker);
  return {
    ticker,
    model: DRY_RUN_MODEL,
    runAt,
    mode: "dry-run",
    status: "insufficient_evidence",
    extraction,
    validation: { valid: true, errors: [] },
    contradictions: checkBuffettContradictions({ extraction, metrics: hardMetrics }),
    sourceRefs: [],
    reason: "Dry-run: no se llamo a ninguna API. Se emite insufficient_evidence hasta aprobar presupuesto/modelo.",
  };
}

export async function runBuffettAiPass({ companies = [], mode = "dry-run", runModel = null, model = DRY_RUN_MODEL, now = () => new Date().toISOString() } = {}) {
  const runAt = now();
  const entries = [];

  for (const company of companies) {
    const ticker = company.ticker || company.symbol || null;
    const buffett = company.buffett || buildBuffettBlock(company);
    const hardMetrics = buffett.hardMetrics || {};

    if (mode !== "live" || typeof runModel !== "function") {
      entries.push(insufficientEvidenceEntry(ticker, hardMetrics, runAt));
      continue;
    }

    // Modo live: solo se ejecuta si el llamador inyecta explicitamente un runModel
    // (por ejemplo un stub en tests). Este archivo nunca crea un cliente real.
    const prompt = buildBuffettExtractionPrompt({
      ticker,
      metrics: hardMetrics,
      filingExcerpts: company.filingExcerpts || [],
      transcriptChunks: company.transcriptChunks || [],
    });
    const raw = await runModel(prompt, company);
    const validation = validateBuffettExtraction(raw);
    const extraction = validation.valid ? raw : emptyBuffettExtraction(ticker);
    entries.push({
      ticker,
      model,
      runAt,
      mode: "live",
      status: validation.valid ? "ok" : "insufficient_evidence",
      extraction,
      validation,
      contradictions: checkBuffettContradictions({ extraction, metrics: hardMetrics }),
      sourceRefs: extraction.sourceRefs || [],
      reason: validation.valid
        ? "Salida IA valida; revisar contradicciones y evidencia antes de publicar etiqueta."
        : `Salida IA invalida (${validation.errors.length} errores); se conserva insufficient_evidence.`,
    });
  }

  return { generatedAt: runAt, mode, model, count: entries.length, entries };
}

export function emptyBuffettAiPass(now = () => new Date().toISOString()) {
  return { generatedAt: now(), mode: "dry-run", model: DRY_RUN_MODEL, count: 0, entries: [] };
}

// S88: prompts de extraccion estructurada para el motor Buffett.
// Este modulo NO llama a ninguna API: solo construye el prompt y valida la
// forma del JSON que debe devolver el modelo. La corrida real (S89) queda en
// dry-run hasta aprobar presupuesto/modelo.

export const BUFFETT_SIGNALS = [
  "pricingPower",
  "customerConcentration",
  "capitalAllocationDiscipline",
  "cyclicality",
  "moatClues",
  "managementRedFlags",
  "guidanceTone",
  "financialStrength",
];

export const SIGNAL_ASSESSMENTS = ["strong", "moderate", "weak", "unknown"];
export const EVIDENCE_TYPES = ["fact", "inference", "risk"];

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function emptyBuffettExtraction(ticker = null) {
  return {
    ticker,
    signals: Object.fromEntries(BUFFETT_SIGNALS.map((signal) => [signal, { assessment: "unknown", confidence: 0 }])),
    facts: [],
    inferences: [],
    risks: [],
    sourceRefs: [],
    followUpQuestions: [],
  };
}

export function buildBuffettExtractionPrompt({ ticker, metrics = {}, filingExcerpts = [], transcriptChunks = [] } = {}) {
  const system = [
    "Eres un analista que extrae senales cualitativas de filings y transcripts para un motor tipo Buffett.",
    "Devuelves EXCLUSIVAMENTE JSON valido con la forma indicada; sin texto adicional.",
    "Separa siempre `fact` (dicho explicito en la fuente), `inference` (deduccion tuya) y `risk`.",
    "Si algo no esta explicito en las fuentes, responde `unknown`; NUNCA inventes moat, contratos ni calidad directiva.",
    "Cada fact e inference debe citar un `sourceRef` corto; las citas textuales deben ser breves.",
  ].join(" ");

  const schema = {
    ticker: ticker || "TICKER",
    signals: Object.fromEntries(BUFFETT_SIGNALS.map((signal) => [signal, { assessment: "strong|moderate|weak|unknown", confidence: "0..1" }])),
    facts: [{ text: "cita corta", sourceRef: "id de sourceRefs" }],
    inferences: [{ text: "deduccion", basis: "en que se apoya" }],
    risks: [{ text: "riesgo", severity: "low|medium|high" }],
    sourceRefs: [{ id: "s1", sourceType: "10-K|letter|transcript", period: "FYxxxx", locator: "seccion o pagina" }],
    followUpQuestions: ["pregunta abierta si falta evidencia"],
  };

  const user = [
    `Empresa: ${ticker || "N/D"}`,
    `Metricas duras (solo contexto, no las repitas como fact): ${JSON.stringify(metrics)}`,
    `Extractos de filings (${filingExcerpts.length}):`,
    ...filingExcerpts.map((excerpt, index) => `[F${index + 1}] ${excerpt}`),
    `Transcript chunks (${transcriptChunks.length}):`,
    ...transcriptChunks.map((chunk, index) => `[T${index + 1}] ${chunk}`),
    "Devuelve el JSON con esta forma exacta:",
    JSON.stringify(schema),
  ].join("\n");

  return { system, user, schema };
}

export function validateBuffettExtraction(json) {
  const errors = [];
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return { valid: false, errors: ["La salida no es un objeto JSON."], normalized: null };
  }

  const signals = json.signals && typeof json.signals === "object" ? json.signals : {};
  for (const signal of BUFFETT_SIGNALS) {
    const entry = signals[signal];
    if (!entry || typeof entry !== "object") {
      errors.push(`Falta la senal ${signal}.`);
      continue;
    }
    if (!SIGNAL_ASSESSMENTS.includes(entry.assessment)) {
      errors.push(`Assessment invalido en ${signal}: ${entry.assessment}.`);
    }
    const confidence = numberOrNull(entry.confidence);
    if (confidence === null || confidence < 0 || confidence > 1) {
      errors.push(`Confidence fuera de rango [0,1] en ${signal}.`);
    }
  }

  for (const field of ["facts", "inferences", "risks", "sourceRefs", "followUpQuestions"]) {
    if (!Array.isArray(json[field])) {
      errors.push(`El campo ${field} debe ser un arreglo.`);
    }
  }

  if (Array.isArray(json.facts)) {
    json.facts.forEach((fact, index) => {
      if (!fact || !fact.sourceRef) errors.push(`fact[${index}] sin sourceRef.`);
    });
  }

  return { valid: errors.length === 0, errors, normalized: errors.length === 0 ? json : null };
}

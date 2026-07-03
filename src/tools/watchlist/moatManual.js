export const MOAT_CONFIDENCE_LEVELS = ["low", "medium", "high"];

export const MOAT_MANUAL_FIELDS = [
  { id: "moatRating", label: "Moat real" },
  { id: "strategicContracts", label: "Contratos estrategicos" },
  { id: "regulatoryTailwind", label: "Regulacion favorable" },
  { id: "customerConcentration", label: "Clientes clave" },
  { id: "managementQuality", label: "Calidad directiva" },
  { id: "technologyMoatEvidence", label: "Ventaja tecnologica" },
  { id: "ownerThesis", label: "Tesis personal" },
];

function trimmedOrNull(value) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function normalizeConfidence(value) {
  const normalized = trimmedOrNull(value)?.toLowerCase() || null;
  return MOAT_CONFIDENCE_LEVELS.includes(normalized) ? normalized : null;
}

export function createEmptyMoatManualEntry() {
  return {
    value: null,
    sourceUrl: null,
    asOf: null,
    confidence: null,
    notes: null,
  };
}

export function normalizeMoatManualEntry(entry = {}) {
  return {
    value: trimmedOrNull(entry.value),
    sourceUrl: trimmedOrNull(entry.sourceUrl),
    asOf: trimmedOrNull(entry.asOf),
    confidence: normalizeConfidence(entry.confidence),
    notes: trimmedOrNull(entry.notes),
  };
}

export function createEmptyMoatManualRecord(ticker = "") {
  return Object.assign(
    {
      ticker: trimmedOrNull(ticker)?.toUpperCase() || null,
      updatedAt: null,
    },
    Object.fromEntries(MOAT_MANUAL_FIELDS.map((field) => [field.id, createEmptyMoatManualEntry()])),
  );
}

export function normalizeMoatManualRecord(record = {}) {
  const normalized = createEmptyMoatManualRecord(record.ticker);
  normalized.updatedAt = trimmedOrNull(record.updatedAt);
  for (const field of MOAT_MANUAL_FIELDS) {
    normalized[field.id] = normalizeMoatManualEntry(record[field.id]);
  }
  return normalized;
}

export function normalizeMoatManualMap(payload = {}) {
  if (Array.isArray(payload)) {
    return Object.fromEntries(
      payload
        .map((record) => normalizeMoatManualRecord(record))
        .filter((record) => record.ticker)
        .map((record) => [record.ticker, record]),
    );
  }

  return Object.fromEntries(
    Object.entries(payload)
      .map(([ticker, record]) => normalizeMoatManualRecord({ ...record, ticker: record?.ticker || ticker }))
      .filter((record) => record.ticker)
      .map((record) => [record.ticker, record]),
  );
}

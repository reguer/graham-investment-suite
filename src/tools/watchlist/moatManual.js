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

function hasEntryContent(entry = {}) {
  return Boolean(entry.value || entry.sourceUrl || entry.asOf || entry.confidence || entry.notes);
}

export function hasMoatManualData(record = {}) {
  const normalized = normalizeMoatManualRecord(record);
  return MOAT_MANUAL_FIELDS.some((field) => hasEntryContent(normalized[field.id]));
}

export function summarizeMoatManual(record = {}) {
  const normalized = normalizeMoatManualRecord(record);
  const filledFields = MOAT_MANUAL_FIELDS.filter((field) => hasEntryContent(normalized[field.id]));
  const moatLabel = normalized.moatRating.value || null;
  const firstConfidenceField = filledFields.find((field) => normalized[field.id].confidence);
  const confidence = normalized.moatRating.confidence || (firstConfidenceField ? normalized[firstConfidenceField.id].confidence : null);
  const hasData = filledFields.length > 0;

  return {
    hasData,
    filledFieldCount: filledFields.length,
    label: moatLabel || (hasData ? `${filledFields.length} evidencias manuales` : "N/D"),
    confidence,
    status: hasData ? "manual_evidence" : "pending_manual",
  };
}

export function mergeMoatManualMaps(base = {}, override = {}) {
  return {
    ...normalizeMoatManualMap(base),
    ...normalizeMoatManualMap(override),
  };
}

export function sanitizeMoatManualRecordForPublic(record = {}) {
  const normalized = normalizeMoatManualRecord(record);
  return Object.assign(
    {
      ticker: normalized.ticker,
      updatedAt: normalized.updatedAt,
    },
    Object.fromEntries(MOAT_MANUAL_FIELDS.map((field) => [field.id, {
      ...normalized[field.id],
      notes: null,
    }])),
  );
}

export function sanitizeMoatManualMapForPublic(records = {}) {
  return Object.fromEntries(
    Object.values(normalizeMoatManualMap(records)).map((record) => [record.ticker, sanitizeMoatManualRecordForPublic(record)]),
  );
}

export function attachMoatManual(company, moatManualByTicker = {}) {
  const ticker = String(company?.ticker || "").trim().toUpperCase();
  const record = ticker && moatManualByTicker[ticker]
    ? normalizeMoatManualRecord(moatManualByTicker[ticker])
    : createEmptyMoatManualRecord(ticker);
  return {
    ...company,
    moatManual: record,
    moatSummary: summarizeMoatManual(record),
  };
}

export function attachMoatManualToCompanies(companies = [], moatManualByTicker = {}) {
  return companies.map((company) => attachMoatManual(company, moatManualByTicker));
}

export async function fetchPublicMoatManual(fetchImpl = fetch, baseUrl = "/") {
  try {
    const response = await fetchImpl(`${baseUrl.replace(/\/?$/, "/")}data/moat-manual.json`);
    if (!response.ok) throw new Error(`No se pudo cargar moat-manual.json: ${response.status}`);
    return normalizeMoatManualMap(await response.json());
  } catch {
    return {};
  }
}

export function createMoatManualDraft(record = {}) {
  const normalized = normalizeMoatManualRecord(record);
  return Object.assign(
    {
      ticker: normalized.ticker || "",
    },
    Object.fromEntries(MOAT_MANUAL_FIELDS.map((field) => [field.id, {
      value: normalized[field.id].value || "",
      sourceUrl: normalized[field.id].sourceUrl || "",
      asOf: normalized[field.id].asOf || "",
      confidence: normalized[field.id].confidence || "",
      notes: normalized[field.id].notes || "",
    }])),
  );
}

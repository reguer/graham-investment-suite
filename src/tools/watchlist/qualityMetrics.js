function getPathValue(input, path) {
  return String(path)
    .split(".")
    .reduce((current, segment) => (current && current[segment] !== undefined ? current[segment] : undefined), input);
}

function hasMetricValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

export const QUALITY_METRIC_STATUS = {
  available: "available",
  partial: "partial",
  missing: "missing",
};

const AUTOMATIC = "automatic";
const MANUAL = "manual";

const QUALITY_METRIC_DEFINITIONS = [
  {
    id: "revenue",
    label: "Revenue",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    companiesJsonStatus: QUALITY_METRIC_STATUS.missing,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.available,
    secSnapshotStatus: QUALITY_METRIC_STATUS.missing,
    notes: "No se persiste hoy en companies.json; Yahoo anual si lo expone y SEC requerira serie dedicada.",
  },
  {
    id: "eps",
    label: "EPS historico",
    type: AUTOMATIC,
    companiesJsonPaths: ["epsHistory"],
    companiesJsonStatus: QUALITY_METRIC_STATUS.available,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.available,
    secSnapshotStatus: QUALITY_METRIC_STATUS.available,
    notes: "Disponible via epsHistory anual; no se rellena con ceros si faltan anos.",
  },
  {
    id: "fcf",
    label: "FCF",
    type: AUTOMATIC,
    companiesJsonPaths: ["fcf", "secSnapshot.operatingCashFlow", "secSnapshot.investingCashFlow"],
    companiesJsonStatus: QUALITY_METRIC_STATUS.available,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.available,
    secSnapshotStatus: QUALITY_METRIC_STATUS.partial,
    notes: "El export guarda FCF top-level; SEC embebe insumos de ultimo ano, no una serie historica completa.",
  },
  {
    id: "sharesOutstanding",
    label: "Shares outstanding",
    type: AUTOMATIC,
    companiesJsonPaths: ["secSnapshot.shares"],
    companiesJsonStatus: QUALITY_METRIC_STATUS.partial,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.available,
    secSnapshotStatus: QUALITY_METRIC_STATUS.partial,
    notes: "En companies.json solo aparece cuando existe secSnapshot; falta persistencia top-level uniforme.",
  },
  {
    id: "grossMargin",
    label: "Gross margin",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    companiesJsonStatus: QUALITY_METRIC_STATUS.missing,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.partial,
    secSnapshotStatus: QUALITY_METRIC_STATUS.missing,
    notes: "No se persiste hoy; Yahoo puede derivarlo si el raw anual trae grossProfit y revenue.",
  },
  {
    id: "operatingMargin",
    label: "Operating margin",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    companiesJsonStatus: QUALITY_METRIC_STATUS.missing,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.available,
    secSnapshotStatus: QUALITY_METRIC_STATUS.missing,
    notes: "No se persiste hoy; puede derivarse de EBIT u operatingIncome sobre revenue.",
  },
  {
    id: "netMargin",
    label: "Net margin",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    companiesJsonStatus: QUALITY_METRIC_STATUS.missing,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.available,
    secSnapshotStatus: QUALITY_METRIC_STATUS.missing,
    notes: "No se persiste hoy; requiere revenue e income anual por ano.",
  },
  {
    id: "goodwillIntangibles",
    label: "Goodwill / intangibles",
    type: AUTOMATIC,
    companiesJsonPaths: ["pbTangible", "tangibleBvps"],
    companiesJsonStatus: QUALITY_METRIC_STATUS.partial,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.partial,
    secSnapshotStatus: QUALITY_METRIC_STATUS.partial,
    notes: "La exportacion publica solo deja proxies tangibles; no conserva goodwill/intangibles brutos por ano.",
  },
  {
    id: "liquidity",
    label: "Liquidity",
    type: AUTOMATIC,
    companiesJsonPaths: ["currentRatio", "quickRatio"],
    companiesJsonStatus: QUALITY_METRIC_STATUS.available,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.available,
    secSnapshotStatus: QUALITY_METRIC_STATUS.available,
    notes: "Current y quick ratio ya estan disponibles para la mayoria del universo analizado.",
  },
  {
    id: "leverage",
    label: "Leverage",
    type: AUTOMATIC,
    companiesJsonPaths: ["debtRatio"],
    companiesJsonStatus: QUALITY_METRIC_STATUS.available,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.available,
    secSnapshotStatus: QUALITY_METRIC_STATUS.available,
    notes: "Se persiste debtRatio; para financieras puede quedar N/D por perfil sectorial.",
  },
  {
    id: "roeRoa",
    label: "ROE / ROA",
    type: AUTOMATIC,
    companiesJsonPaths: ["roe", "roa"],
    companiesJsonStatus: QUALITY_METRIC_STATUS.available,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.available,
    secSnapshotStatus: QUALITY_METRIC_STATUS.available,
    notes: "ROE y ROA ya se exportan top-level; sirven como capa automatica, no como moat.",
  },
  {
    id: "moat",
    label: "Moat",
    type: MANUAL,
    companiesJsonPaths: [],
    companiesJsonStatus: QUALITY_METRIC_STATUS.missing,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.missing,
    secSnapshotStatus: QUALITY_METRIC_STATUS.missing,
    notes: "Requiere captura manual con fuente y fecha.",
  },
  {
    id: "contracts",
    label: "Contratos / concentracion clientes",
    type: MANUAL,
    companiesJsonPaths: [],
    companiesJsonStatus: QUALITY_METRIC_STATUS.missing,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.missing,
    secSnapshotStatus: QUALITY_METRIC_STATUS.missing,
    notes: "No debe inferirse automatico; requiere evidencia manual.",
  },
  {
    id: "regulation",
    label: "Regulacion favorable / riesgo regulatorio",
    type: MANUAL,
    companiesJsonPaths: [],
    companiesJsonStatus: QUALITY_METRIC_STATUS.missing,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.missing,
    secSnapshotStatus: QUALITY_METRIC_STATUS.missing,
    notes: "Requiere captura manual con fuente URL y fecha.",
  },
  {
    id: "managementQuality",
    label: "Calidad directiva",
    type: MANUAL,
    companiesJsonPaths: [],
    companiesJsonStatus: QUALITY_METRIC_STATUS.missing,
    yahooSnapshotStatus: QUALITY_METRIC_STATUS.missing,
    secSnapshotStatus: QUALITY_METRIC_STATUS.missing,
    notes: "No se infiere por proxy automatica; requiere revision humana.",
  },
];

export const QUALITY_METRIC_INVENTORY = QUALITY_METRIC_DEFINITIONS.map((definition) => ({
  id: definition.id,
  label: definition.label,
  type: definition.type,
  companiesJsonStatus: definition.companiesJsonStatus,
  yahooSnapshotStatus: definition.yahooSnapshotStatus,
  secSnapshotStatus: definition.secSnapshotStatus,
  notes: definition.notes,
}));

export function collectPublicMetricCoverage(companies = []) {
  return QUALITY_METRIC_DEFINITIONS.map((definition) => {
    const count = companies.reduce((total, company) => (
      definition.companiesJsonPaths.some((path) => hasMetricValue(getPathValue(company, path))) ? total + 1 : total
    ), 0);
    return {
      id: definition.id,
      label: definition.label,
      type: definition.type,
      companiesJsonStatus: definition.companiesJsonStatus,
      yahooSnapshotStatus: definition.yahooSnapshotStatus,
      secSnapshotStatus: definition.secSnapshotStatus,
      count,
      notes: definition.notes,
    };
  });
}

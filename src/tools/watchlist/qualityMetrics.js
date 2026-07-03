import { detectSector } from "../graham-analyzer/detectSector.js";

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

const BUFFETT_METRIC_DEFINITIONS = [
  {
    id: "revenue",
    label: "Revenue",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    publicExportStatus: QUALITY_METRIC_STATUS.missing,
    yahooAnnualStatus: QUALITY_METRIC_STATUS.available,
    secCompanyFactsStatus: QUALITY_METRIC_STATUS.available,
    primarySource: "SEC Company Facts",
    fallbackSource: "Yahoo annual / TTM",
    asOfField: "sourceDate",
    notes: "No se persiste hoy en el export publico; SEC y Yahoo anual si lo exponen para construir la serie Buffett.",
  },
  {
    id: "operatingIncome",
    label: "Operating income",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    publicExportStatus: QUALITY_METRIC_STATUS.missing,
    yahooAnnualStatus: QUALITY_METRIC_STATUS.available,
    secCompanyFactsStatus: QUALITY_METRIC_STATUS.available,
    primarySource: "SEC Company Facts",
    fallbackSource: "Yahoo annual / TTM",
    asOfField: "sourceDate",
    notes: "Sale de OperatingIncomeLoss en SEC; hoy no queda persistido como top-level en companies.json.",
  },
  {
    id: "netIncome",
    label: "Net income",
    type: AUTOMATIC,
    companiesJsonPaths: ["secSnapshot.netIncome"],
    publicExportStatus: QUALITY_METRIC_STATUS.partial,
    yahooAnnualStatus: QUALITY_METRIC_STATUS.available,
    secCompanyFactsStatus: QUALITY_METRIC_STATUS.available,
    primarySource: "SEC Company Facts",
    fallbackSource: "Yahoo annual / TTM",
    asOfField: "sourceDate",
    notes: "En el export publico hoy aparece solo cuando existe secSnapshot; Buffett requiere serie anual completa, no solo ultimo ano.",
  },
  {
    id: "operatingCF",
    label: "Operating cash flow",
    type: AUTOMATIC,
    companiesJsonPaths: ["secSnapshot.operatingCashFlow"],
    publicExportStatus: QUALITY_METRIC_STATUS.partial,
    yahooAnnualStatus: QUALITY_METRIC_STATUS.available,
    secCompanyFactsStatus: QUALITY_METRIC_STATUS.available,
    primarySource: "SEC Company Facts",
    fallbackSource: "Yahoo annual / TTM",
    asOfField: "sourceDate",
    notes: "El export solo deja el ultimo ano SEC cuando existe; la serie Buffett debe reconstruirse desde facts anuales.",
  },
  {
    id: "capex",
    label: "Capex",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    publicExportStatus: QUALITY_METRIC_STATUS.missing,
    yahooAnnualStatus: QUALITY_METRIC_STATUS.available,
    secCompanyFactsStatus: QUALITY_METRIC_STATUS.partial,
    primarySource: "SEC Company Facts",
    fallbackSource: "Yahoo annual",
    asOfField: "sourceDate",
    notes: "No se persiste hoy en companies.json; SEC puede requerir taxonomias alternativas y Yahoo funciona como fallback defensivo.",
  },
  {
    id: "depreciationAmortization",
    label: "Depreciation & amortization",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    publicExportStatus: QUALITY_METRIC_STATUS.missing,
    yahooAnnualStatus: QUALITY_METRIC_STATUS.partial,
    secCompanyFactsStatus: QUALITY_METRIC_STATUS.partial,
    primarySource: "SEC Company Facts",
    fallbackSource: "Yahoo annual",
    asOfField: "sourceDate",
    notes: "La taxonomia SEC cambia entre emisores y Yahoo no siempre trae el concepto anual limpio.",
  },
  {
    id: "sharesOutstanding",
    label: "Shares outstanding",
    type: AUTOMATIC,
    companiesJsonPaths: ["secSnapshot.shares"],
    publicExportStatus: QUALITY_METRIC_STATUS.partial,
    yahooAnnualStatus: QUALITY_METRIC_STATUS.available,
    secCompanyFactsStatus: QUALITY_METRIC_STATUS.partial,
    primarySource: "SEC Company Facts",
    fallbackSource: "Yahoo annual",
    asOfField: "sourceDate",
    notes: "El export solo las deja cuando existe secSnapshot; para Buffett la serie debe quedar separada de ADR/splits y nunca inventar anos faltantes.",
  },
  {
    id: "cash",
    label: "Cash & equivalents",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    publicExportStatus: QUALITY_METRIC_STATUS.missing,
    yahooAnnualStatus: QUALITY_METRIC_STATUS.available,
    secCompanyFactsStatus: QUALITY_METRIC_STATUS.available,
    primarySource: "SEC Company Facts",
    fallbackSource: "Yahoo annual",
    asOfField: "sourceDate",
    notes: "No existe como campo publico uniforme hoy; Buffett solo necesita el dato si la serie puede trazarse con fuente y fecha.",
  },
  {
    id: "totalDebt",
    label: "Total debt",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    publicExportStatus: QUALITY_METRIC_STATUS.missing,
    yahooAnnualStatus: QUALITY_METRIC_STATUS.partial,
    secCompanyFactsStatus: QUALITY_METRIC_STATUS.available,
    primarySource: "SEC Company Facts",
    fallbackSource: "Yahoo annual",
    asOfField: "sourceDate",
    notes: "Puede salir de deuda de corto + largo plazo en SEC; el export publico actual no deja una persistencia uniforme.",
  },
  {
    id: "grossMargin",
    label: "Gross margin",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    publicExportStatus: QUALITY_METRIC_STATUS.missing,
    yahooAnnualStatus: QUALITY_METRIC_STATUS.partial,
    secCompanyFactsStatus: QUALITY_METRIC_STATUS.partial,
    primarySource: "SEC Company Facts",
    fallbackSource: "Yahoo annual",
    asOfField: "sourceDate",
    notes: "Se deriva de gross profit / revenue; si uno de los dos falta, la serie queda incompleta y no se rellena con cero.",
  },
  {
    id: "operatingMargin",
    label: "Operating margin",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    publicExportStatus: QUALITY_METRIC_STATUS.missing,
    yahooAnnualStatus: QUALITY_METRIC_STATUS.available,
    secCompanyFactsStatus: QUALITY_METRIC_STATUS.available,
    primarySource: "SEC Company Facts",
    fallbackSource: "Yahoo annual / TTM",
    asOfField: "sourceDate",
    notes: "Se deriva de operating income / revenue; hoy solo existe de forma calculable, no persistida, en el export publico.",
  },
  {
    id: "netMargin",
    label: "Net margin",
    type: AUTOMATIC,
    companiesJsonPaths: [],
    publicExportStatus: QUALITY_METRIC_STATUS.missing,
    yahooAnnualStatus: QUALITY_METRIC_STATUS.available,
    secCompanyFactsStatus: QUALITY_METRIC_STATUS.available,
    primarySource: "SEC Company Facts",
    fallbackSource: "Yahoo annual / TTM",
    asOfField: "sourceDate",
    notes: "Se deriva de net income / revenue y debe conservar `asOf` y fuente del ano reportado.",
  },
];

export const BUFFETT_METRIC_INVENTORY = BUFFETT_METRIC_DEFINITIONS.map((definition) => ({
  id: definition.id,
  label: definition.label,
  type: definition.type,
  publicExportStatus: definition.publicExportStatus,
  yahooAnnualStatus: definition.yahooAnnualStatus,
  secCompanyFactsStatus: definition.secCompanyFactsStatus,
  primarySource: definition.primarySource,
  fallbackSource: definition.fallbackSource,
  asOfField: definition.asOfField,
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

export function collectPublicBuffettCoverage(companies = []) {
  return BUFFETT_METRIC_DEFINITIONS.map((definition) => {
    const count = companies.reduce((total, company) => (
      definition.companiesJsonPaths.some((path) => hasMetricValue(getPathValue(company, path))) ? total + 1 : total
    ), 0);
    return {
      id: definition.id,
      label: definition.label,
      type: definition.type,
      publicExportStatus: definition.publicExportStatus,
      yahooAnnualStatus: definition.yahooAnnualStatus,
      secCompanyFactsStatus: definition.secCompanyFactsStatus,
      primarySource: definition.primarySource,
      fallbackSource: definition.fallbackSource,
      asOfField: definition.asOfField,
      count,
      notes: definition.notes,
    };
  });
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ratioOrNull(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

function pickFieldValue(record, fields) {
  for (const field of fields) {
    const value = numberOrNull(record?.[field]);
    if (value !== null) return { field, value };
  }
  return { field: null, value: null };
}

function normalizeFiscalYear(input) {
  if (typeof input === "number" && Number.isFinite(input)) return Math.trunc(input);
  if (typeof input === "string" && /^\d{4}$/.test(input)) return Number(input);
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)) return Number(input.slice(0, 4));
  return null;
}

function emptyQualitySeries() {
  return {
    revenue: [],
    eps: [],
    fcf: [],
    sharesOutstanding: [],
    grossMargin: [],
    operatingMargin: [],
    netMargin: [],
  };
}

function pushSeriesPoint(target, metricId, {
  fiscalYear,
  value,
  currency,
  source,
  asOf,
  sourceField,
  sourceForm,
}) {
  const normalizedYear = normalizeFiscalYear(fiscalYear);
  const parsedValue = numberOrNull(value);
  if (normalizedYear === null || parsedValue === null) return;
  target[metricId].push({
    fiscalYear: normalizedYear,
    value: parsedValue,
    currency: currency || null,
    source,
    asOf: asOf || null,
    sourceField: sourceField || null,
    sourceForm: sourceForm || null,
  });
}

function sortSeries(series) {
  return [...series].sort((left, right) => (
    right.fiscalYear - left.fiscalYear || String(right.asOf || "").localeCompare(String(left.asOf || ""))
  ));
}

function finalizeSeries(series) {
  return Object.fromEntries(Object.entries(series).map(([metricId, rows]) => [metricId, sortSeries(rows)]));
}

function seriesEntries(series = []) {
  return sortSeries(
    (Array.isArray(series) ? series : [])
      .map((entry) => ({
        fiscalYear: normalizeFiscalYear(entry?.fiscalYear ?? entry?.year),
        value: numberOrNull(entry?.value),
        currency: entry?.currency || null,
        source: entry?.source || null,
        asOf: entry?.asOf || null,
        sourceField: entry?.sourceField || null,
        sourceForm: entry?.sourceForm || null,
      }))
      .filter((entry) => entry.fiscalYear !== null && entry.value !== null),
  );
}

function latestAndOldestSeriesEntry(series = []) {
  const entries = seriesEntries(series);
  if (entries.length < 2) return null;
  return { latest: entries[0], oldest: entries[entries.length - 1] };
}

function latestSeriesEntry(series = []) {
  return seriesEntries(series)[0] || null;
}

function seriesCagr(series = []) {
  const bounds = latestAndOldestSeriesEntry(series);
  if (!bounds) return null;
  const spanYears = bounds.latest.fiscalYear - bounds.oldest.fiscalYear;
  if (spanYears < 1 || bounds.latest.value <= 0 || bounds.oldest.value <= 0) return null;
  return (bounds.latest.value / bounds.oldest.value) ** (1 / spanYears) - 1;
}

function pctLabel(value) {
  if (!Number.isFinite(value)) return "N/D";
  return `${(value * 100).toFixed(1)}%`;
}

function sectorIdForItem(item = {}) {
  return item.sectorProfileId || detectSector({ sector: item.sector, industry: item.industry, sicCode: item.sicCode });
}

function isSoftwareCompany(item = {}) {
  const text = `${item.sector || ""} ${item.industry || ""}`.toLowerCase();
  return [
    "software",
    "saas",
    "cloud",
    "application",
    "infrastructure",
    "it services",
    "internet services",
    "information technology services",
    "artificial intelligence",
    "ai",
  ].some((keyword) => text.includes(keyword));
}

function latestAnnualRows(rows = []) {
  const byYear = new Map();
  for (const row of rows) {
    const fiscalYear = normalizeFiscalYear(row?.date);
    if (fiscalYear === null) continue;
    const current = byYear.get(fiscalYear);
    if (!current || String(row.date).localeCompare(String(current.date)) > 0) {
      byYear.set(fiscalYear, row);
    }
  }
  return [...byYear.values()].sort((left, right) => String(right.date).localeCompare(String(left.date)));
}

export function buildYahooQualitySeries(data, {
  financialFxRate = numberOrNull(data?.financialFx?.rate) ?? 1,
  shareScale = 1,
  source = "yahoo_fundamentals_time_series",
  currency = "USD",
} = {}) {
  const annualRows = latestAnnualRows(data?.annual);
  const series = emptyQualitySeries();

  for (const row of annualRows) {
    const fiscalYear = normalizeFiscalYear(row.date);
    const revenue = pickFieldValue(row, ["totalRevenue", "operatingRevenue"]);
    const grossProfit = pickFieldValue(row, ["grossProfit"]);
    const operatingIncome = pickFieldValue(row, ["operatingIncome", "EBIT", "normalizedEBITDA"]);
    const netIncome = pickFieldValue(row, ["netIncome", "netIncomeCommonStockholders"]);
    const operatingCashFlow = pickFieldValue(row, ["operatingCashFlow", "cashFlowFromContinuingOperatingActivities"]);
    const investingCashFlow = pickFieldValue(row, ["investingCashFlow", "cashFlowFromContinuingInvestingActivities"]);
    const eps = pickFieldValue(row, ["dilutedEPS", "basicEPS"]);
    const shares = pickFieldValue(row, ["dilutedAverageShares", "ordinarySharesNumber", "basicAverageShares"]);

    const revenueValue = revenue.value === null ? null : revenue.value * financialFxRate;
    const grossProfitValue = grossProfit.value === null ? null : grossProfit.value * financialFxRate;
    const operatingIncomeValue = operatingIncome.value === null ? null : operatingIncome.value * financialFxRate;
    const netIncomeValue = netIncome.value === null ? null : netIncome.value * financialFxRate;
    const operatingCashFlowValue = operatingCashFlow.value === null ? null : operatingCashFlow.value * financialFxRate;
    const investingCashFlowValue = investingCashFlow.value === null ? null : investingCashFlow.value * financialFxRate;
    const epsValue = eps.value === null ? null : eps.value * financialFxRate * shareScale;
    const fcfValue = Number.isFinite(operatingCashFlowValue) && Number.isFinite(investingCashFlowValue)
      ? operatingCashFlowValue + investingCashFlowValue
      : null;

    pushSeriesPoint(series, "revenue", {
      fiscalYear,
      value: revenueValue,
      currency,
      source,
      asOf: row.date,
      sourceField: revenue.field,
      sourceForm: "annual",
    });
    pushSeriesPoint(series, "eps", {
      fiscalYear,
      value: epsValue,
      currency,
      source,
      asOf: row.date,
      sourceField: eps.field,
      sourceForm: "annual",
    });
    pushSeriesPoint(series, "fcf", {
      fiscalYear,
      value: fcfValue,
      currency,
      source,
      asOf: row.date,
      sourceField: operatingCashFlow.field && investingCashFlow.field ? `${operatingCashFlow.field}+${investingCashFlow.field}` : null,
      sourceForm: "annual",
    });
    pushSeriesPoint(series, "sharesOutstanding", {
      fiscalYear,
      value: shares.value,
      currency: "shares",
      source,
      asOf: row.date,
      sourceField: shares.field,
      sourceForm: "annual",
    });
    pushSeriesPoint(series, "grossMargin", {
      fiscalYear,
      value: ratioOrNull(grossProfitValue, revenueValue),
      currency: "ratio",
      source,
      asOf: row.date,
      sourceField: grossProfit.field && revenue.field ? `${grossProfit.field}/${revenue.field}` : null,
      sourceForm: "annual",
    });
    pushSeriesPoint(series, "operatingMargin", {
      fiscalYear,
      value: ratioOrNull(operatingIncomeValue, revenueValue),
      currency: "ratio",
      source,
      asOf: row.date,
      sourceField: operatingIncome.field && revenue.field ? `${operatingIncome.field}/${revenue.field}` : null,
      sourceForm: "annual",
    });
    pushSeriesPoint(series, "netMargin", {
      fiscalYear,
      value: ratioOrNull(netIncomeValue, revenueValue),
      currency: "ratio",
      source,
      asOf: row.date,
      sourceField: netIncome.field && revenue.field ? `${netIncome.field}/${revenue.field}` : null,
      sourceForm: "annual",
    });
  }

  return finalizeSeries(series);
}

function secFactEntries(companyFacts, concepts, preferredUnits = ["USD"], { allowNonFy = false } = {}) {
  const namespaces = [
    companyFacts?.facts?.["us-gaap"] || {},
    companyFacts?.facts?.dei || {},
  ];
  const byYear = new Map();

  for (const concept of concepts) {
    for (const namespace of namespaces) {
      const units = namespace[concept]?.units || {};
      for (const unit of preferredUnits) {
        const rows = Array.isArray(units[unit]) ? units[unit] : [];
        for (const row of rows) {
          const fiscalYear = normalizeFiscalYear(row?.fy ?? row?.end);
          if (fiscalYear === null) continue;
          if (!allowNonFy && row?.fp !== "FY") continue;
          const value = numberOrNull(row?.val);
          if (value === null) continue;
          const current = byYear.get(fiscalYear);
          const candidate = { fact: row, field: concept, value };
          if (!current || String(row?.filed || row?.end || "").localeCompare(String(current.fact?.filed || current.fact?.end || "")) > 0) {
            byYear.set(fiscalYear, candidate);
          }
        }
      }
    }
  }

  return [...byYear.entries()]
    .map(([fiscalYear, entry]) => ({ fiscalYear, ...entry }))
    .sort((left, right) => right.fiscalYear - left.fiscalYear);
}

export function buildSecQualitySeries(companyFacts, { source = "sec_companyfacts", currency = "USD" } = {}) {
  const series = emptyQualitySeries();
  const revenueFacts = secFactEntries(companyFacts, ["RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet"], ["USD"]);
  const grossProfitFacts = secFactEntries(companyFacts, ["GrossProfit"], ["USD"]);
  const operatingIncomeFacts = secFactEntries(companyFacts, ["OperatingIncomeLoss"], ["USD"]);
  const netIncomeFacts = secFactEntries(companyFacts, ["NetIncomeLoss", "NetIncomeAvailableToCommonStockholdersBasic"], ["USD"]);
  const operatingCashFlowFacts = secFactEntries(companyFacts, ["NetCashProvidedByUsedInOperatingActivities"], ["USD"]);
  const investingCashFlowFacts = secFactEntries(companyFacts, ["NetCashProvidedByUsedInInvestingActivities"], ["USD"]);
  const epsFacts = secFactEntries(companyFacts, ["EarningsPerShareDiluted", "EarningsPerShareBasic"], ["USD/shares"]);
  const sharesFacts = secFactEntries(companyFacts, ["CommonStockSharesOutstanding", "EntityCommonStockSharesOutstanding"], ["shares"], { allowNonFy: true });

  const revenueByYear = new Map(revenueFacts.map((entry) => [entry.fiscalYear, entry]));
  const grossProfitByYear = new Map(grossProfitFacts.map((entry) => [entry.fiscalYear, entry]));
  const operatingIncomeByYear = new Map(operatingIncomeFacts.map((entry) => [entry.fiscalYear, entry]));
  const netIncomeByYear = new Map(netIncomeFacts.map((entry) => [entry.fiscalYear, entry]));
  const operatingCashFlowByYear = new Map(operatingCashFlowFacts.map((entry) => [entry.fiscalYear, entry]));
  const investingCashFlowByYear = new Map(investingCashFlowFacts.map((entry) => [entry.fiscalYear, entry]));

  for (const entry of revenueFacts) {
    pushSeriesPoint(series, "revenue", {
      fiscalYear: entry.fiscalYear,
      value: entry.value,
      currency,
      source,
      asOf: entry.fact.end,
      sourceField: entry.field,
      sourceForm: entry.fact.form,
    });
  }

  for (const entry of epsFacts) {
    pushSeriesPoint(series, "eps", {
      fiscalYear: entry.fiscalYear,
      value: entry.value,
      currency,
      source,
      asOf: entry.fact.end,
      sourceField: entry.field,
      sourceForm: entry.fact.form,
    });
  }

  for (const entry of sharesFacts) {
    pushSeriesPoint(series, "sharesOutstanding", {
      fiscalYear: entry.fiscalYear,
      value: entry.value,
      currency: "shares",
      source,
      asOf: entry.fact.end,
      sourceField: entry.field,
      sourceForm: entry.fact.form,
    });
  }

  for (const [fiscalYear, operatingEntry] of operatingCashFlowByYear.entries()) {
    const investingEntry = investingCashFlowByYear.get(fiscalYear);
    pushSeriesPoint(series, "fcf", {
      fiscalYear,
      value: investingEntry ? operatingEntry.value + investingEntry.value : null,
      currency,
      source,
      asOf: operatingEntry.fact.end,
      sourceField: investingEntry ? `${operatingEntry.field}+${investingEntry.field}` : null,
      sourceForm: operatingEntry.fact.form,
    });
  }

  for (const [fiscalYear, revenueEntry] of revenueByYear.entries()) {
    const grossProfitEntry = grossProfitByYear.get(fiscalYear);
    const operatingIncomeEntry = operatingIncomeByYear.get(fiscalYear);
    const netIncomeEntry = netIncomeByYear.get(fiscalYear);

    pushSeriesPoint(series, "grossMargin", {
      fiscalYear,
      value: grossProfitEntry ? ratioOrNull(grossProfitEntry.value, revenueEntry.value) : null,
      currency: "ratio",
      source,
      asOf: revenueEntry.fact.end,
      sourceField: grossProfitEntry ? `${grossProfitEntry.field}/${revenueEntry.field}` : null,
      sourceForm: revenueEntry.fact.form,
    });
    pushSeriesPoint(series, "operatingMargin", {
      fiscalYear,
      value: operatingIncomeEntry ? ratioOrNull(operatingIncomeEntry.value, revenueEntry.value) : null,
      currency: "ratio",
      source,
      asOf: revenueEntry.fact.end,
      sourceField: operatingIncomeEntry ? `${operatingIncomeEntry.field}/${revenueEntry.field}` : null,
      sourceForm: revenueEntry.fact.form,
    });
    pushSeriesPoint(series, "netMargin", {
      fiscalYear,
      value: netIncomeEntry ? ratioOrNull(netIncomeEntry.value, revenueEntry.value) : null,
      currency: "ratio",
      source,
      asOf: revenueEntry.fact.end,
      sourceField: netIncomeEntry ? `${netIncomeEntry.field}/${revenueEntry.field}` : null,
      sourceForm: revenueEntry.fact.form,
    });
  }

  return finalizeSeries(series);
}

export const BUFFETT_SERIES_METRICS = [
  "revenue",
  "operatingIncome",
  "netIncome",
  "operatingCF",
  "capex",
  "depreciationAmortization",
  "sharesOutstanding",
  "cash",
  "totalDebt",
  "grossMargin",
  "operatingMargin",
  "netMargin",
];

function emptyBuffettSeries() {
  return Object.fromEntries(BUFFETT_SERIES_METRICS.map((metricId) => [metricId, []]));
}

function normalizeExpenseOutflow(value) {
  const parsed = numberOrNull(value);
  if (parsed === null) return null;
  return Math.abs(parsed);
}

function sliceSeriesYears(series = [], maxYears = 10) {
  return sortSeries(series).slice(0, maxYears);
}

function latestAnnualRowsLimited(rows = [], maxYears = 10) {
  return latestAnnualRows(rows).slice(0, maxYears);
}

function factMapByYear(entries = []) {
  return new Map(entries.map((entry) => [entry.fiscalYear, entry]));
}

function mergePreferredSeries(primary = [], fallback = [], { maxYears = 10 } = {}) {
  const mergedByYear = new Map();
  for (const entry of sortSeries(primary)) {
    if (!mergedByYear.has(entry.fiscalYear)) mergedByYear.set(entry.fiscalYear, entry);
  }
  for (const entry of sortSeries(fallback)) {
    if (!mergedByYear.has(entry.fiscalYear)) mergedByYear.set(entry.fiscalYear, entry);
  }
  return sliceSeriesYears([...mergedByYear.values()], maxYears);
}

function findMissingYears(series = []) {
  const entries = sortSeries(series);
  if (entries.length < 2) return [];
  const latest = entries[0].fiscalYear;
  const oldest = entries[entries.length - 1].fiscalYear;
  const years = new Set(entries.map((entry) => entry.fiscalYear));
  const missing = [];
  for (let year = latest; year >= oldest; year -= 1) {
    if (!years.has(year)) missing.push(year);
  }
  return missing;
}

function buildBuffettOutput(primarySeries, fallbackSeries, { maxYears = 10 } = {}) {
  const merged = {};
  const missingYearsByMetric = {};
  for (const metricId of BUFFETT_SERIES_METRICS) {
    merged[metricId] = mergePreferredSeries(primarySeries[metricId], fallbackSeries[metricId], { maxYears });
    missingYearsByMetric[metricId] = findMissingYears(merged[metricId]);
  }
  return {
    ...merged,
    missingYearsByMetric,
  };
}

export function buildYahooBuffettSeries(data, {
  financialFxRate = numberOrNull(data?.financialFx?.rate) ?? 1,
  source = "yahoo_fundamentals_time_series",
  currency = "USD",
  maxYears = 10,
} = {}) {
  const annualRows = latestAnnualRowsLimited(data?.annual, maxYears);
  const series = emptyBuffettSeries();

  for (const row of annualRows) {
    const fiscalYear = normalizeFiscalYear(row.date);
    const revenue = pickFieldValue(row, ["totalRevenue", "operatingRevenue"]);
    const grossProfit = pickFieldValue(row, ["grossProfit"]);
    const operatingIncome = pickFieldValue(row, ["operatingIncome", "EBIT", "normalizedEBITDA"]);
    const netIncome = pickFieldValue(row, ["netIncome", "netIncomeCommonStockholders"]);
    const operatingCashFlow = pickFieldValue(row, ["operatingCashFlow", "cashFlowFromContinuingOperatingActivities"]);
    const capex = pickFieldValue(row, ["capitalExpenditure", "capitalExpenditures", "capitalExpenditureReported"]);
    const depreciationAmortization = pickFieldValue(row, ["depreciationAndAmortization", "depreciationAmortization", "reconciledDepreciation"]);
    const shares = pickFieldValue(row, ["dilutedAverageShares", "ordinarySharesNumber", "basicAverageShares"]);
    const cash = pickFieldValue(row, ["cashAndCashEquivalents", "cashCashEquivalentsAndShortTermInvestments"]);
    const totalDebt = pickFieldValue(row, ["totalDebt", "currentDebtAndCapitalLeaseObligation", "currentDebt", "longTermDebt"]);

    const revenueValue = revenue.value === null ? null : revenue.value * financialFxRate;
    const grossProfitValue = grossProfit.value === null ? null : grossProfit.value * financialFxRate;
    const operatingIncomeValue = operatingIncome.value === null ? null : operatingIncome.value * financialFxRate;
    const netIncomeValue = netIncome.value === null ? null : netIncome.value * financialFxRate;
    const operatingCashFlowValue = operatingCashFlow.value === null ? null : operatingCashFlow.value * financialFxRate;
    const capexValue = capex.value === null ? null : normalizeExpenseOutflow(capex.value * financialFxRate);
    const depreciationValue = depreciationAmortization.value === null ? null : depreciationAmortization.value * financialFxRate;
    const cashValue = cash.value === null ? null : cash.value * financialFxRate;
    const totalDebtValue = totalDebt.value === null ? null : totalDebt.value * financialFxRate;

    pushSeriesPoint(series, "revenue", {
      fiscalYear,
      value: revenueValue,
      currency,
      source,
      sourceField: revenue.field,
      sourceForm: "annual",
      asOf: row.date,
    });
    pushSeriesPoint(series, "operatingIncome", {
      fiscalYear,
      value: operatingIncomeValue,
      currency,
      source,
      sourceField: operatingIncome.field,
      sourceForm: "annual",
      asOf: row.date,
    });
    pushSeriesPoint(series, "netIncome", {
      fiscalYear,
      value: netIncomeValue,
      currency,
      source,
      sourceField: netIncome.field,
      sourceForm: "annual",
      asOf: row.date,
    });
    pushSeriesPoint(series, "operatingCF", {
      fiscalYear,
      value: operatingCashFlowValue,
      currency,
      source,
      sourceField: operatingCashFlow.field,
      sourceForm: "annual",
      asOf: row.date,
    });
    pushSeriesPoint(series, "capex", {
      fiscalYear,
      value: capexValue,
      currency,
      source,
      sourceField: capex.field,
      sourceForm: "annual",
      asOf: row.date,
    });
    pushSeriesPoint(series, "depreciationAmortization", {
      fiscalYear,
      value: depreciationValue,
      currency,
      source,
      sourceField: depreciationAmortization.field,
      sourceForm: "annual",
      asOf: row.date,
    });
    pushSeriesPoint(series, "sharesOutstanding", {
      fiscalYear,
      value: shares.value,
      currency: "shares",
      source,
      sourceField: shares.field,
      sourceForm: "annual",
      asOf: row.date,
    });
    pushSeriesPoint(series, "cash", {
      fiscalYear,
      value: cashValue,
      currency,
      source,
      sourceField: cash.field,
      sourceForm: "annual",
      asOf: row.date,
    });
    pushSeriesPoint(series, "totalDebt", {
      fiscalYear,
      value: totalDebtValue,
      currency,
      source,
      sourceField: totalDebt.field,
      sourceForm: "annual",
      asOf: row.date,
    });
    pushSeriesPoint(series, "grossMargin", {
      fiscalYear,
      value: ratioOrNull(grossProfitValue, revenueValue),
      currency: "ratio",
      source,
      sourceField: grossProfit.field && revenue.field ? `${grossProfit.field}/${revenue.field}` : null,
      sourceForm: "annual",
      asOf: row.date,
    });
    pushSeriesPoint(series, "operatingMargin", {
      fiscalYear,
      value: ratioOrNull(operatingIncomeValue, revenueValue),
      currency: "ratio",
      source,
      sourceField: operatingIncome.field && revenue.field ? `${operatingIncome.field}/${revenue.field}` : null,
      sourceForm: "annual",
      asOf: row.date,
    });
    pushSeriesPoint(series, "netMargin", {
      fiscalYear,
      value: ratioOrNull(netIncomeValue, revenueValue),
      currency: "ratio",
      source,
      sourceField: netIncome.field && revenue.field ? `${netIncome.field}/${revenue.field}` : null,
      sourceForm: "annual",
      asOf: row.date,
    });
  }

  return Object.fromEntries(BUFFETT_SERIES_METRICS.map((metricId) => [metricId, sliceSeriesYears(series[metricId], maxYears)]));
}

export function buildSecBuffettSeries(companyFacts, { source = "sec_companyfacts", currency = "USD", maxYears = 10 } = {}) {
  const series = emptyBuffettSeries();
  const revenueFacts = secFactEntries(companyFacts, ["RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet"], ["USD"]).slice(0, maxYears);
  const grossProfitFacts = secFactEntries(companyFacts, ["GrossProfit"], ["USD"]).slice(0, maxYears);
  const operatingIncomeFacts = secFactEntries(companyFacts, ["OperatingIncomeLoss"], ["USD"]).slice(0, maxYears);
  const netIncomeFacts = secFactEntries(companyFacts, ["NetIncomeLoss", "NetIncomeAvailableToCommonStockholdersBasic"], ["USD"]).slice(0, maxYears);
  const operatingCashFlowFacts = secFactEntries(companyFacts, ["NetCashProvidedByUsedInOperatingActivities"], ["USD"]).slice(0, maxYears);
  const capexFacts = secFactEntries(companyFacts, ["PaymentsToAcquirePropertyPlantAndEquipment", "CapitalExpendituresIncurredButNotYetPaid"], ["USD"]).slice(0, maxYears);
  const depreciationFacts = secFactEntries(companyFacts, ["DepreciationDepletionAndAmortization", "DepreciationAmortizationAndAccretionNet", "DepreciationAndAmortization"], ["USD"]).slice(0, maxYears);
  const sharesFacts = secFactEntries(companyFacts, ["CommonStockSharesOutstanding", "EntityCommonStockSharesOutstanding"], ["shares"], { allowNonFy: true }).slice(0, maxYears);
  const cashFacts = secFactEntries(companyFacts, ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsAndShortTermInvestments"], ["USD"], { allowNonFy: true }).slice(0, maxYears);
  const totalDebtFacts = secFactEntries(companyFacts, ["LongTermDebtAndCapitalLeaseObligations", "LongTermDebtAndFinanceLeaseObligations", "LongTermDebtCurrentAndNoncurrent", "DebtAndCapitalLeaseObligations"], ["USD"]).slice(0, maxYears);
  const currentDebtFacts = secFactEntries(companyFacts, ["LongTermDebtCurrent", "CurrentPortionOfLongTermDebt", "ShortTermBorrowings", "CommercialPaper"], ["USD"]).slice(0, maxYears);
  const longDebtFacts = secFactEntries(companyFacts, ["LongTermDebtNoncurrent", "LongTermDebt"], ["USD"]).slice(0, maxYears);

  const revenueByYear = factMapByYear(revenueFacts);
  const grossProfitByYear = factMapByYear(grossProfitFacts);
  const operatingIncomeByYear = factMapByYear(operatingIncomeFacts);
  const netIncomeByYear = factMapByYear(netIncomeFacts);
  const directDebtByYear = factMapByYear(totalDebtFacts);
  const currentDebtByYear = factMapByYear(currentDebtFacts);
  const longDebtByYear = factMapByYear(longDebtFacts);

  for (const entry of revenueFacts) {
    pushSeriesPoint(series, "revenue", {
      fiscalYear: entry.fiscalYear,
      value: entry.value,
      currency,
      source,
      sourceField: entry.field,
      sourceForm: entry.fact.form,
      asOf: entry.fact.end,
    });
  }

  for (const entry of operatingIncomeFacts) {
    pushSeriesPoint(series, "operatingIncome", {
      fiscalYear: entry.fiscalYear,
      value: entry.value,
      currency,
      source,
      sourceField: entry.field,
      sourceForm: entry.fact.form,
      asOf: entry.fact.end,
    });
  }

  for (const entry of netIncomeFacts) {
    pushSeriesPoint(series, "netIncome", {
      fiscalYear: entry.fiscalYear,
      value: entry.value,
      currency,
      source,
      sourceField: entry.field,
      sourceForm: entry.fact.form,
      asOf: entry.fact.end,
    });
  }

  for (const entry of operatingCashFlowFacts) {
    pushSeriesPoint(series, "operatingCF", {
      fiscalYear: entry.fiscalYear,
      value: entry.value,
      currency,
      source,
      sourceField: entry.field,
      sourceForm: entry.fact.form,
      asOf: entry.fact.end,
    });
  }

  for (const entry of capexFacts) {
    pushSeriesPoint(series, "capex", {
      fiscalYear: entry.fiscalYear,
      value: normalizeExpenseOutflow(entry.value),
      currency,
      source,
      sourceField: entry.field,
      sourceForm: entry.fact.form,
      asOf: entry.fact.end,
    });
  }

  for (const entry of depreciationFacts) {
    pushSeriesPoint(series, "depreciationAmortization", {
      fiscalYear: entry.fiscalYear,
      value: entry.value,
      currency,
      source,
      sourceField: entry.field,
      sourceForm: entry.fact.form,
      asOf: entry.fact.end,
    });
  }

  for (const entry of sharesFacts) {
    pushSeriesPoint(series, "sharesOutstanding", {
      fiscalYear: entry.fiscalYear,
      value: entry.value,
      currency: "shares",
      source,
      sourceField: entry.field,
      sourceForm: entry.fact.form,
      asOf: entry.fact.end,
    });
  }

  for (const entry of cashFacts) {
    pushSeriesPoint(series, "cash", {
      fiscalYear: entry.fiscalYear,
      value: entry.value,
      currency,
      source,
      sourceField: entry.field,
      sourceForm: entry.fact.form,
      asOf: entry.fact.end,
    });
  }

  const debtYears = new Set([
    ...directDebtByYear.keys(),
    ...currentDebtByYear.keys(),
    ...longDebtByYear.keys(),
  ]);
  for (const fiscalYear of [...debtYears].sort((left, right) => right - left).slice(0, maxYears)) {
    const direct = directDebtByYear.get(fiscalYear);
    const current = currentDebtByYear.get(fiscalYear);
    const long = longDebtByYear.get(fiscalYear);
    const debtValue = direct?.value ?? (
      Number.isFinite(current?.value) && Number.isFinite(long?.value)
        ? current.value + long.value
        : long?.value ?? current?.value ?? null
    );
    const asOf = direct?.fact.end || long?.fact.end || current?.fact.end || null;
    const sourceField = direct?.field || [long?.field, current?.field].filter(Boolean).join("+") || null;
    const sourceForm = direct?.fact.form || long?.fact.form || current?.fact.form || null;

    pushSeriesPoint(series, "totalDebt", {
      fiscalYear,
      value: debtValue,
      currency,
      source,
      sourceField,
      sourceForm,
      asOf,
    });
  }

  for (const [fiscalYear, revenueEntry] of revenueByYear.entries()) {
    const grossProfitEntry = grossProfitByYear.get(fiscalYear);
    const operatingIncomeEntry = operatingIncomeByYear.get(fiscalYear);
    const netIncomeEntry = netIncomeByYear.get(fiscalYear);

    pushSeriesPoint(series, "grossMargin", {
      fiscalYear,
      value: grossProfitEntry ? ratioOrNull(grossProfitEntry.value, revenueEntry.value) : null,
      currency: "ratio",
      source,
      sourceField: grossProfitEntry ? `${grossProfitEntry.field}/${revenueEntry.field}` : null,
      sourceForm: revenueEntry.fact.form,
      asOf: revenueEntry.fact.end,
    });
    pushSeriesPoint(series, "operatingMargin", {
      fiscalYear,
      value: operatingIncomeEntry ? ratioOrNull(operatingIncomeEntry.value, revenueEntry.value) : null,
      currency: "ratio",
      source,
      sourceField: operatingIncomeEntry ? `${operatingIncomeEntry.field}/${revenueEntry.field}` : null,
      sourceForm: revenueEntry.fact.form,
      asOf: revenueEntry.fact.end,
    });
    pushSeriesPoint(series, "netMargin", {
      fiscalYear,
      value: netIncomeEntry ? ratioOrNull(netIncomeEntry.value, revenueEntry.value) : null,
      currency: "ratio",
      source,
      sourceField: netIncomeEntry ? `${netIncomeEntry.field}/${revenueEntry.field}` : null,
      sourceForm: revenueEntry.fact.form,
      asOf: revenueEntry.fact.end,
    });
  }

  return Object.fromEntries(BUFFETT_SERIES_METRICS.map((metricId) => [metricId, sliceSeriesYears(series[metricId], maxYears)]));
}

export function buildBuffettSeries({ companyFacts, yahooData } = {}, options = {}) {
  const secSeries = companyFacts ? buildSecBuffettSeries(companyFacts, options) : emptyBuffettSeries();
  const yahooSeries = yahooData ? buildYahooBuffettSeries(yahooData, options) : emptyBuffettSeries();
  return buildBuffettOutput(secSeries, yahooSeries, options);
}

export function assessBuybackDilution(item = {}) {
  const sharesSeries = item.qualitySeries?.sharesOutstanding || item.sharesOutstandingSeries || [];
  const cagr = seriesCagr(sharesSeries);
  if (cagr === null) {
    return {
      id: "buybackDilution",
      label: "N/D",
      scoreImpact: null,
      hasData: false,
      shareCountCagr: null,
      reason: "Sin serie anual suficiente de acciones en circulacion para evaluar recompras o dilucion.",
    };
  }

  if (cagr <= -0.02) {
    return {
      id: "buybackDilution",
      label: "Recompra neta",
      scoreImpact: 2,
      hasData: true,
      shareCountCagr: cagr,
      reason: `Las acciones en circulacion bajaron ${pctLabel(Math.abs(cagr))} CAGR; hay evidencia de recompra neta real en la serie anual.`,
    };
  }

  if (cagr < -0.005) {
    return {
      id: "buybackDilution",
      label: "Ligera recompra",
      scoreImpact: 1,
      hasData: true,
      shareCountCagr: cagr,
      reason: `Las acciones en circulacion bajaron ${pctLabel(Math.abs(cagr))} CAGR; la recompra existe, pero todavia es moderada.`,
    };
  }

  if (cagr < 0.015) {
    return {
      id: "buybackDilution",
      label: "Capital estable",
      scoreImpact: 0,
      hasData: true,
      shareCountCagr: cagr,
      reason: `Las acciones en circulacion cambiaron ${pctLabel(cagr)} CAGR; no hay señal clara ni de recompra agresiva ni de dilucion relevante.`,
    };
  }

  if (cagr >= 0.02) {
    return {
      id: "buybackDilution",
      label: "Dilucion / SBC",
      scoreImpact: -2,
      hasData: true,
      shareCountCagr: cagr,
      reason: `Las acciones en circulacion crecieron ${pctLabel(cagr)} CAGR; la serie apunta a dilucion neta y es compatible con SBC o emision persistente.`,
    };
  }

  return {
    id: "buybackDilution",
    label: "Ligera dilucion",
    scoreImpact: -1,
    hasData: true,
    shareCountCagr: cagr,
    reason: `Las acciones en circulacion crecieron ${pctLabel(cagr)} CAGR; hay dilucion neta, aunque todavia no es extrema.`,
  };
}

export function assessIntangibleBalance(item = {}) {
  const sectorId = sectorIdForItem(item);
  const pbTangible = numberOrNull(item.ratios?.pbTangible ?? item.pbTangible);
  const tangibleBvps = numberOrNull(item.ratios?.tangibleBvps ?? item.tangibleBvps);
  const roe = numberOrNull(item.ratios?.roe ?? item.roe);
  const roa = numberOrNull(item.ratios?.roa ?? item.roa);
  const fcf = numberOrNull(item.ratios?.fcf ?? item.fcf);
  const sectorTolerance = {
    tech: { label: "alta", caution: 6, high: 10, allowsCompensation: true },
    healthcare: { label: "alta", caution: 5, high: 8, allowsCompensation: true },
    consumer_staples: { label: "media", caution: 4, high: 6, allowsCompensation: true },
    default: { label: "estandar", caution: 3, high: 5, allowsCompensation: false },
    industrial: { label: "estandar", caution: 3, high: 5, allowsCompensation: false },
    energy: { label: "baja", caution: 2.5, high: 4, allowsCompensation: false },
    basic_materials: { label: "baja", caution: 2.5, high: 4, allowsCompensation: false },
    utilities: { label: "media", caution: 4, high: 6, allowsCompensation: false },
  }[sectorId] || { label: "estandar", caution: 3, high: 5, allowsCompensation: false };

  if (sectorId === "financial" || sectorId === "reit") {
    return {
      id: "intangibleBalance",
      label: "N/D",
      scoreImpact: null,
      hasData: false,
      sectorId,
      reason: "El perfil sectorial no usa esta senal de intangibles como criterio principal de calidad.",
    };
  }

  if (pbTangible === null && tangibleBvps === null) {
    return {
      id: "intangibleBalance",
      label: "N/D",
      scoreImpact: null,
      hasData: false,
      sectorId,
      reason: "Faltan P/B tangible o TBVPS para estimar la dependencia del balance intangible.",
    };
  }

  if (tangibleBvps !== null && tangibleBvps <= 0) {
    return {
      id: "intangibleBalance",
      label: "Dependencia alta",
      scoreImpact: -2,
      hasData: true,
      sectorId,
      reason: `TBVPS ${tangibleBvps.toFixed(2)} indica balance tangible debil o negativo; la dependencia de intangibles es alta para el perfil ${sectorId}.`,
    };
  }

  const qualityCompensates = (roe !== null && roe >= 0.15) && (roa !== null && roa >= 0.08) && fcf !== null && fcf > 0;

  if (pbTangible !== null && pbTangible <= sectorTolerance.caution) {
    return {
      id: "intangibleBalance",
      label: "Dependencia baja",
      scoreImpact: 1,
      hasData: true,
      sectorId,
      reason: `P/B tangible ${pbTangible.toFixed(2)} se mantiene dentro de la tolerancia ${sectorTolerance.label} del perfil ${sectorId}.`,
    };
  }

  if (
    pbTangible !== null &&
    pbTangible > sectorTolerance.caution &&
    pbTangible <= sectorTolerance.high &&
    sectorTolerance.allowsCompensation &&
    qualityCompensates
  ) {
    return {
      id: "intangibleBalance",
      label: "Dependencia alta, compensada",
      scoreImpact: 0,
      hasData: true,
      sectorId,
      reason: `P/B tangible ${pbTangible.toFixed(2)} refleja dependencia relevante de intangibles, pero el perfil ${sectorId} la compensa con ROE ${pctLabel(roe)}, ROA ${pctLabel(roa)} y FCF positivo.`,
    };
  }

  if (pbTangible !== null && pbTangible <= sectorTolerance.high) {
    return {
      id: "intangibleBalance",
      label: "Dependencia moderada",
      scoreImpact: -1,
      hasData: true,
      sectorId,
      reason: `P/B tangible ${pbTangible.toFixed(2)} supera la zona comoda del perfil ${sectorId}; la dependencia de intangibles ya exige mas disciplina de calidad.`,
    };
  }

  return {
    id: "intangibleBalance",
    label: "Dependencia alta",
    scoreImpact: -2,
    hasData: true,
    sectorId,
    reason: `P/B tangible ${pbTangible !== null ? pbTangible.toFixed(2) : "N/D"} queda muy por encima de la tolerancia ${sectorTolerance.label} del perfil ${sectorId}.`,
  };
}

export function assessSoftwareQuality(item = {}) {
  if (!isSoftwareCompany(item)) {
    return {
      id: "softwareQuality",
      label: "N/D",
      scoreImpact: null,
      hasData: false,
      reason: "La empresa no cae en el universo conservador de software/IA para este subscore.",
    };
  }

  const revenueSeries = item.qualitySeries?.revenue || [];
  const grossMarginSeries = item.qualitySeries?.grossMargin || [];
  const operatingMarginSeries = item.qualitySeries?.operatingMargin || [];
  const fcfSeries = item.qualitySeries?.fcf || [];
  const revenueLatest = latestSeriesEntry(revenueSeries);
  const grossMarginLatest = latestSeriesEntry(grossMarginSeries);
  const operatingMarginLatest = latestSeriesEntry(operatingMarginSeries);
  const fcfLatest = latestSeriesEntry(fcfSeries);
  const revenueCagr = seriesCagr(revenueSeries);
  const buybackDilution = item.buybackDilution || assessBuybackDilution(item);
  const fcfMargin = revenueLatest && fcfLatest && revenueLatest.fiscalYear === fcfLatest.fiscalYear
    ? ratioOrNull(fcfLatest.value, revenueLatest.value)
    : null;
  const ruleOf40 = revenueCagr !== null && fcfMargin !== null ? revenueCagr + fcfMargin : null;

  if (!grossMarginLatest && !operatingMarginLatest && !fcfMargin && revenueCagr === null) {
    return {
      id: "softwareQuality",
      label: "N/D",
      scoreImpact: null,
      hasData: false,
      reason: "Faltan series anuales de revenue, margenes o FCF para evaluar software quality.",
    };
  }

  let positives = 0;
  if (grossMarginLatest?.value !== null && grossMarginLatest.value >= 0.6) positives += 1;
  if (operatingMarginLatest?.value !== null && operatingMarginLatest.value >= 0.15) positives += 1;
  if (fcfMargin !== null && fcfMargin >= 0.15) positives += 1;
  if (revenueCagr !== null && revenueCagr >= 0.1) positives += 1;
  if (ruleOf40 !== null && ruleOf40 >= 0.4) positives += 1;

  const dilutionPenalty = buybackDilution.label === "Dilucion / SBC" ? 1 : 0;
  const weakSoftware = (fcfMargin !== null && fcfMargin < 0) || (operatingMarginLatest?.value !== null && operatingMarginLatest.value < 0);

  let label = "Software aceptable";
  let scoreImpact = 0;
  if (positives >= 4 && dilutionPenalty === 0 && !weakSoftware) {
    label = "Software fuerte";
    scoreImpact = 2;
  } else if (weakSoftware || dilutionPenalty === 1 || positives <= 1) {
    label = "Software debil";
    scoreImpact = -2;
  } else if (positives >= 2) {
    label = "Software aceptable";
    scoreImpact = 1;
  } else {
    label = "Software mixto";
    scoreImpact = -1;
  }

  const parts = [
    grossMarginLatest?.value !== null ? `gross margin ${pctLabel(grossMarginLatest.value)}` : null,
    operatingMarginLatest?.value !== null ? `operating margin ${pctLabel(operatingMarginLatest.value)}` : null,
    fcfMargin !== null ? `FCF margin ${pctLabel(fcfMargin)}` : null,
    revenueCagr !== null ? `revenue CAGR ${pctLabel(revenueCagr)}` : null,
    ruleOf40 !== null ? `rule of 40 ${pctLabel(ruleOf40)}` : null,
    buybackDilution.hasData ? `dilucion ${buybackDilution.label.toLowerCase()}` : null,
  ].filter(Boolean);

  return {
    id: "softwareQuality",
    label,
    scoreImpact,
    hasData: true,
    revenueCagr,
    fcfMargin,
    ruleOf40,
    reason: `${parts.join(", ")}. Este subscore no relaja deuda, liquidez ni FCF como senales duras.`,
  };
}

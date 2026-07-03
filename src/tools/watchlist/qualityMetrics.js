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
  source,
  asOf,
  sourceField,
}) {
  const normalizedYear = normalizeFiscalYear(fiscalYear);
  const parsedValue = numberOrNull(value);
  if (normalizedYear === null || parsedValue === null) return;
  target[metricId].push({
    fiscalYear: normalizedYear,
    value: parsedValue,
    source,
    asOf: asOf || null,
    sourceField: sourceField || null,
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
        source: entry?.source || null,
        asOf: entry?.asOf || null,
        sourceField: entry?.sourceField || null,
      }))
      .filter((entry) => entry.fiscalYear !== null && entry.value !== null),
  );
}

function latestAndOldestSeriesEntry(series = []) {
  const entries = seriesEntries(series);
  if (entries.length < 2) return null;
  return { latest: entries[0], oldest: entries[entries.length - 1] };
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
      source,
      asOf: row.date,
      sourceField: revenue.field,
    });
    pushSeriesPoint(series, "eps", {
      fiscalYear,
      value: epsValue,
      source,
      asOf: row.date,
      sourceField: eps.field,
    });
    pushSeriesPoint(series, "fcf", {
      fiscalYear,
      value: fcfValue,
      source,
      asOf: row.date,
      sourceField: operatingCashFlow.field && investingCashFlow.field ? `${operatingCashFlow.field}+${investingCashFlow.field}` : null,
    });
    pushSeriesPoint(series, "sharesOutstanding", {
      fiscalYear,
      value: shares.value,
      source,
      asOf: row.date,
      sourceField: shares.field,
    });
    pushSeriesPoint(series, "grossMargin", {
      fiscalYear,
      value: ratioOrNull(grossProfitValue, revenueValue),
      source,
      asOf: row.date,
      sourceField: grossProfit.field && revenue.field ? `${grossProfit.field}/${revenue.field}` : null,
    });
    pushSeriesPoint(series, "operatingMargin", {
      fiscalYear,
      value: ratioOrNull(operatingIncomeValue, revenueValue),
      source,
      asOf: row.date,
      sourceField: operatingIncome.field && revenue.field ? `${operatingIncome.field}/${revenue.field}` : null,
    });
    pushSeriesPoint(series, "netMargin", {
      fiscalYear,
      value: ratioOrNull(netIncomeValue, revenueValue),
      source,
      asOf: row.date,
      sourceField: netIncome.field && revenue.field ? `${netIncome.field}/${revenue.field}` : null,
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

export function buildSecQualitySeries(companyFacts, { source = "sec_companyfacts" } = {}) {
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
      source,
      asOf: entry.fact.end,
      sourceField: entry.field,
    });
  }

  for (const entry of epsFacts) {
    pushSeriesPoint(series, "eps", {
      fiscalYear: entry.fiscalYear,
      value: entry.value,
      source,
      asOf: entry.fact.end,
      sourceField: entry.field,
    });
  }

  for (const entry of sharesFacts) {
    pushSeriesPoint(series, "sharesOutstanding", {
      fiscalYear: entry.fiscalYear,
      value: entry.value,
      source,
      asOf: entry.fact.end,
      sourceField: entry.field,
    });
  }

  for (const [fiscalYear, operatingEntry] of operatingCashFlowByYear.entries()) {
    const investingEntry = investingCashFlowByYear.get(fiscalYear);
    pushSeriesPoint(series, "fcf", {
      fiscalYear,
      value: investingEntry ? operatingEntry.value + investingEntry.value : null,
      source,
      asOf: operatingEntry.fact.end,
      sourceField: investingEntry ? `${operatingEntry.field}+${investingEntry.field}` : null,
    });
  }

  for (const [fiscalYear, revenueEntry] of revenueByYear.entries()) {
    const grossProfitEntry = grossProfitByYear.get(fiscalYear);
    const operatingIncomeEntry = operatingIncomeByYear.get(fiscalYear);
    const netIncomeEntry = netIncomeByYear.get(fiscalYear);

    pushSeriesPoint(series, "grossMargin", {
      fiscalYear,
      value: grossProfitEntry ? ratioOrNull(grossProfitEntry.value, revenueEntry.value) : null,
      source,
      asOf: revenueEntry.fact.end,
      sourceField: grossProfitEntry ? `${grossProfitEntry.field}/${revenueEntry.field}` : null,
    });
    pushSeriesPoint(series, "operatingMargin", {
      fiscalYear,
      value: operatingIncomeEntry ? ratioOrNull(operatingIncomeEntry.value, revenueEntry.value) : null,
      source,
      asOf: revenueEntry.fact.end,
      sourceField: operatingIncomeEntry ? `${operatingIncomeEntry.field}/${revenueEntry.field}` : null,
    });
    pushSeriesPoint(series, "netMargin", {
      fiscalYear,
      value: netIncomeEntry ? ratioOrNull(netIncomeEntry.value, revenueEntry.value) : null,
      source,
      asOf: revenueEntry.fact.end,
      sourceField: netIncomeEntry ? `${netIncomeEntry.field}/${revenueEntry.field}` : null,
    });
  }

  return finalizeSeries(series);
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

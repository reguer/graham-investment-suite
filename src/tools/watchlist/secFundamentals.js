const SEC_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
const SEC_FACTS_URL = "https://data.sec.gov/api/xbrl/companyfacts/CIK";
const SEC_HEADERS = { "user-agent": "GrahamInvestmentSuite/1.0 local" };

function factList(companyFacts, concepts, preferredUnits = ["USD"]) {
  const namespaces = [
    companyFacts?.facts?.["us-gaap"] || {},
    companyFacts?.facts?.dei || {},
  ];
  for (const concept of concepts) {
    for (const namespace of namespaces) {
      const units = namespace[concept]?.units || {};
      for (const unit of preferredUnits) {
        if (Array.isArray(units[unit])) return units[unit];
      }
    }
  }
  return [];
}

function latestFact(companyFacts, concepts, preferredUnits) {
  return factList(companyFacts, concepts, preferredUnits)
    .filter((fact) => Number.isFinite(Number(fact.val)) && fact.end)
    .sort((a, b) => String(b.end).localeCompare(String(a.end)) || String(b.filed || "").localeCompare(String(a.filed || "")))[0];
}

function annualFacts(companyFacts, concepts, preferredUnits) {
  const byYear = new Map();
  for (const fact of factList(companyFacts, concepts, preferredUnits)) {
    if (!Number.isFinite(Number(fact.val)) || fact.fp !== "FY" || !fact.end) continue;
    const key = fact.fy || fact.end.slice(0, 4);
    const current = byYear.get(key);
    if (!current || String(fact.filed || "").localeCompare(String(current.filed || "")) > 0) {
      byYear.set(key, fact);
    }
  }
  return [...byYear.values()].sort((a, b) => String(b.end).localeCompare(String(a.end)));
}

function valueOf(fact) {
  const value = Number(fact?.val);
  return Number.isFinite(value) ? value : null;
}

function safeRatio(numerator, denominator) {
  return Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0 ? numerator / denominator : null;
}

function isFiniteValue(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

export async function fetchSecTickerMap(fetchImpl = fetch) {
  const response = await fetchImpl(SEC_TICKERS_URL, { headers: SEC_HEADERS });
  if (!response.ok) throw new Error(`SEC tickers devolvio ${response.status}: ${response.statusText}`);
  const payload = await response.json();
  const byTicker = new Map();
  for (const item of Object.values(payload)) {
    byTicker.set(String(item.ticker).toUpperCase(), {
      cik: String(item.cik_str).padStart(10, "0"),
      ticker: String(item.ticker).toUpperCase(),
      title: item.title,
    });
  }
  return byTicker;
}

export async function fetchSecCompanyFacts(cik, fetchImpl = fetch) {
  const response = await fetchImpl(`${SEC_FACTS_URL}${cik}.json`, { headers: SEC_HEADERS });
  if (!response.ok) throw new Error(`SEC companyfacts devolvio ${response.status}: ${response.statusText}`);
  return response.json();
}

export function buildSecGrahamSnapshot(companyFacts, price) {
  const assets = valueOf(latestFact(companyFacts, ["Assets"]));
  const currentAssets = valueOf(latestFact(companyFacts, ["AssetsCurrent"]));
  const inventory = valueOf(latestFact(companyFacts, ["InventoryNet"]));
  const liabilities = valueOf(latestFact(companyFacts, ["Liabilities"]));
  const currentLiabilities = valueOf(latestFact(companyFacts, ["LiabilitiesCurrent"]));
  const reportedEquity = valueOf(latestFact(companyFacts, [
    "StockholdersEquity",
    "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
  ]));
  const equity = reportedEquity ?? (Number.isFinite(assets) && Number.isFinite(liabilities) ? assets - liabilities : null);
  const shares = valueOf(latestFact(companyFacts, ["EntityCommonStockSharesOutstanding"], ["shares"]));
  const epsAnnual = annualFacts(companyFacts, ["EarningsPerShareDiluted", "EarningsPerShareBasic"], ["USD/shares"]);
  const netIncome = valueOf(annualFacts(companyFacts, ["NetIncomeLoss"], ["USD"])[0]);
  const operatingCashFlow = valueOf(annualFacts(companyFacts, ["NetCashProvidedByUsedInOperatingActivities"], ["USD"])[0]);
  const investingCashFlow = valueOf(annualFacts(companyFacts, ["NetCashProvidedByUsedInInvestingActivities"], ["USD"])[0]);
  const ebit = valueOf(annualFacts(companyFacts, ["OperatingIncomeLoss"], ["USD"])[0]);
  const interestExpense = valueOf(annualFacts(companyFacts, ["InterestExpense", "InterestAndDebtExpense"], ["USD"])[0]);

  const eps = valueOf(epsAnnual[0]);
  const bvps = safeRatio(equity, shares);
  const pe = eps && eps > 0 ? safeRatio(price, eps) : null;
  const pb = bvps && bvps > 0 ? safeRatio(price, bvps) : null;
  const debtRatio = safeRatio(liabilities, equity);
  const currentRatio = safeRatio(currentAssets, currentLiabilities);
  const quickRatio = safeRatio((currentAssets ?? 0) - (inventory ?? 0), currentLiabilities);
  const fcf = Number.isFinite(operatingCashFlow) && Number.isFinite(investingCashFlow)
    ? operatingCashFlow + investingCashFlow
    : null;
  const epsHistory = epsAnnual.slice(0, 5).map((fact) => ({ year: fact.fy || fact.end.slice(0, 4), eps: valueOf(fact) }));

  return {
    price,
    pe,
    pb,
    pePb: Number.isFinite(pe) && Number.isFinite(pb) ? pe * pb : null,
    debtRatio,
    currentRatio,
    quickRatio,
    fcf,
    epsAllPositive: epsHistory.length > 0 ? epsHistory.every((item) => item.eps > 0) : null,
    epsGrowing: epsHistory.length >= 2 ? epsHistory.every((item, index, arr) => index === arr.length - 1 || item.eps >= arr[index + 1].eps) : null,
    roe: safeRatio(netIncome, equity),
    roa: safeRatio(netIncome, assets),
    tie: interestExpense === 0 && Number.isFinite(ebit) && ebit > 0
      ? Infinity
      : safeRatio(ebit, interestExpense),
    epsAdj: eps,
    bvps,
    source: "SEC EDGAR companyfacts + Yahoo Chart price",
    sourceDate: new Date().toISOString().slice(0, 10),
    epsHistory,
    sec: {
      assets,
      currentAssets,
      inventory,
      liabilities,
      currentLiabilities,
      equity,
      shares,
      netIncome,
      operatingCashFlow,
      investingCashFlow,
    },
  };
}

export function hasMinimumGrahamSnapshot(snapshot) {
  return [snapshot?.price, snapshot?.pe, snapshot?.pb, snapshot?.debtRatio, snapshot?.currentRatio].every(isFiniteValue);
}

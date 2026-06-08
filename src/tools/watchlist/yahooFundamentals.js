import YahooFinance from "yahoo-finance2";

const YAHOO_QUOTE_SUMMARY = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/";

function yahooClient() {
  return new YahooFinance({ suppressNotices: ["yahooSurvey"], queue: { concurrency: 2, interval: 250 } });
}

function raw(value) {
  const candidate = value && typeof value === "object" && "raw" in value ? value.raw : value;
  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : null;
}

function pick(...values) {
  for (const value of values) {
    const parsed = raw(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function ratio(numerator, denominator) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : null;
}

function latestStatement(rows) {
  return [...(Array.isArray(rows) ? rows : [])]
    .filter((row) => row?.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;
}

function sortedStatements(rows) {
  return [...(Array.isArray(rows) ? rows : [])]
    .filter((row) => row?.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function validateFundamentalCurrency({ priceCurrency, financialCurrency, expectedCurrency = "USD" }) {
  if (!priceCurrency && !financialCurrency) return { ok: false, message: "Yahoo no devolvio moneda." };
  if (priceCurrency && priceCurrency !== expectedCurrency) return { ok: false, message: `Precio en ${priceCurrency}; esperado ${expectedCurrency}.` };
  if (financialCurrency && financialCurrency !== expectedCurrency) return { ok: false, message: `Fundamentales en ${financialCurrency}; esperado ${expectedCurrency}.` };
  return { ok: true, message: `Moneda validada: ${expectedCurrency}.` };
}

export function detectMagnitudeWarning(values) {
  const numeric = Object.values(values).map(Number).filter(Number.isFinite);
  if (!numeric.length) return null;
  const max = Math.max(...numeric.map(Math.abs));
  if (max > 1_000_000_000_000) return "Magnitud muy alta: revisar si Yahoo entrego unidades completas.";
  if (max < 10_000 && numeric.length >= 4) return "Magnitud baja: revisar si los datos estan en millones/miles o faltan campos.";
  return null;
}

export async function fetchYahooFundamentals(symbol, fetchImpl = fetch) {
  if (!fetchImpl || fetchImpl === fetch) {
    const client = yahooClient();
    return client.quoteSummary(symbol, {
      modules: ["price", "summaryDetail", "defaultKeyStatistics", "financialData"],
    });
  }

  const modules = "price,summaryDetail,defaultKeyStatistics,financialData";
  const response = await fetchImpl(`${YAHOO_QUOTE_SUMMARY}${encodeURIComponent(symbol)}?modules=${modules}`, {
    headers: { "user-agent": "Mozilla/5.0" },
  });
  if (!response.ok) throw new Error(`Yahoo Finance fundamentals devolvio ${response.status}: ${response.statusText}`);
  const payload = await response.json();
  const result = payload?.quoteSummary?.result?.[0];
  if (!result) throw new Error(`Yahoo Finance no devolvio fundamentales para ${symbol}`);
  return result;
}

export async function fetchYahooFxRate(currency, expectedCurrency = "USD", fetcher = null) {
  if (!currency || currency === expectedCurrency) return { ok: true, rate: 1, source: "same-currency" };
  const client = fetcher || yahooClient();
  const directSymbol = `${currency}${expectedCurrency}=X`;
  try {
    const direct = await client.quote(directSymbol);
    const rate = raw(direct?.regularMarketPrice);
    if (rate && rate > 0) return { ok: true, rate, source: `Yahoo Finance ${directSymbol}` };
  } catch {
    // Try the inverse pair below.
  }

  const inverseSymbol = `${expectedCurrency}${currency}=X`;
  const inverse = await client.quote(inverseSymbol);
  const inverseRate = raw(inverse?.regularMarketPrice);
  if (inverseRate && inverseRate > 0) return { ok: true, rate: 1 / inverseRate, source: `Yahoo Finance ${inverseSymbol} inverse` };
  return { ok: false, rate: null, source: "", message: `No se pudo obtener FX ${currency}/${expectedCurrency}.` };
}

export async function fetchYahooDeepFundamentals(symbol, { expectedCurrency = "USD", years = 6 } = {}) {
  const client = yahooClient();
  const period2 = new Date();
  const period1 = new Date();
  period1.setFullYear(period2.getFullYear() - years);
  const [summary, annual] = await Promise.all([
    client.quoteSummary(symbol, { modules: ["price", "summaryDetail", "defaultKeyStatistics", "financialData"] }),
    client.fundamentalsTimeSeries(symbol, { period1, period2, type: "annual", module: "all" }, { validateResult: false }),
  ]);
  const priceCurrency = summary?.price?.currency || "";
  const financialCurrency = summary?.financialData?.financialCurrency || priceCurrency;
  const [priceFx, financialFx] = await Promise.all([
    fetchYahooFxRate(priceCurrency, expectedCurrency, client),
    fetchYahooFxRate(financialCurrency, expectedCurrency, client),
  ]);
  return { symbol, expectedCurrency, summary, annual, priceFx, financialFx, priceCurrency, financialCurrency };
}

export function buildYahooSupplementalSnapshot(data, { symbol, expectedCurrency = "USD" } = {}) {
  const priceCurrency = data?.price?.currency;
  const financialCurrency = data?.financialData?.financialCurrency;
  const currency = validateFundamentalCurrency({ priceCurrency, financialCurrency, expectedCurrency });
  if (!currency.ok) return { ok: false, symbol, currency, reason: currency.message };

  const price = raw(data?.price?.regularMarketPrice);
  const pe = raw(data?.summaryDetail?.trailingPE) ?? raw(data?.defaultKeyStatistics?.trailingPE);
  const pb = raw(data?.defaultKeyStatistics?.priceToBook);
  const currentRatio = raw(data?.financialData?.currentRatio);
  const quickRatio = raw(data?.financialData?.quickRatio);
  const debtToEquity = raw(data?.financialData?.debtToEquity);
  const fcf = raw(data?.financialData?.freeCashflow);
  const epsAdj = raw(data?.defaultKeyStatistics?.trailingEps);
  const bvps = raw(data?.defaultKeyStatistics?.bookValue);
  const roe = raw(data?.financialData?.returnOnEquity);
  const roa = raw(data?.financialData?.returnOnAssets);
  const debtRatio = Number.isFinite(debtToEquity) ? debtToEquity / 100 : null;
  const pePb = Number.isFinite(pe) && Number.isFinite(pb) ? pe * pb : null;
  const grahamFormula = Number.isFinite(epsAdj) && epsAdj > 0 && Number.isFinite(bvps) && bvps > 0
    ? Math.sqrt(22.5 * epsAdj * bvps)
    : null;

  const snapshot = {
    price,
    pe,
    pb,
    pePb,
    debtRatio,
    currentRatio,
    quickRatio,
    fcf,
    epsAllPositive: null,
    epsGrowing: null,
    roe,
    roa,
    tie: null,
    epsAdj,
    bvps,
    grahamFormula,
    source: "Yahoo Finance quoteSummary supplemental",
    sourceDate: new Date().toISOString().slice(0, 10),
    yahoo: {
      symbol,
      priceCurrency,
      financialCurrency,
      trailingEps: epsAdj,
      bookValue: bvps,
      debtToEquity,
    },
  };
  const required = [snapshot.price, snapshot.pe, snapshot.pb, snapshot.debtRatio, snapshot.currentRatio];
  const complete = required.every((value) => value !== null && value !== undefined && Number.isFinite(Number(value)));
  const warnings = [
    detectMagnitudeWarning({ price, pe, pb, currentRatio, debtToEquity, fcf, epsAdj, bvps }),
    "Yahoo no entrega historial EPS completo en este snapshot; no se marca como aprobacion Graham defensiva sin validacion manual.",
  ].filter(Boolean);

  return {
    ok: complete,
    symbol,
    currency,
    snapshot,
    warnings,
    reason: complete ? "Snapshot Yahoo parcial validado en USD." : "Yahoo no entrego todos los ratios minimos: price, P/E, P/B, debt/equity y current ratio.",
  };
}

export function buildYahooDeepSnapshot(data) {
  const latest = latestStatement(data?.annual);
  if (!latest) return { ok: false, symbol: data?.symbol, reason: "Yahoo fundamentalsTimeSeries no devolvio estados anuales." };
  if (!data?.priceFx?.ok) return { ok: false, symbol: data?.symbol, reason: data?.priceFx?.message || "No se pudo validar FX del precio." };
  if (!data?.financialFx?.ok) return { ok: false, symbol: data?.symbol, reason: data?.financialFx?.message || "No se pudo validar FX de fundamentales." };

  const summary = data.summary || {};
  const rawPrice = pick(summary.price?.regularMarketPrice);
  const price = rawPrice === null ? null : rawPrice * data.priceFx.rate;
  const convert = (...values) => {
    const parsed = pick(...values);
    return parsed === null ? null : parsed * data.financialFx.rate;
  };

  const totalAssets = convert(latest.totalAssets);
  const currentAssets = convert(latest.currentAssets);
  const inventory = convert(latest.inventory) ?? 0;
  const totalLiabilities = convert(latest.totalLiabilitiesNetMinorityInterest, latest.totalLiabilities);
  const currentLiabilities = convert(latest.currentLiabilities);
  const equity = convert(latest.stockholdersEquity, latest.commonStockEquity, latest.totalEquityGrossMinorityInterest);
  const shares = pick(latest.dilutedAverageShares, latest.ordinarySharesNumber, latest.basicAverageShares);
  const revenue = convert(latest.totalRevenue, latest.operatingRevenue);
  const ebit = convert(latest.EBIT, latest.normalizedEBITDA);
  const interestExpense = convert(latest.interestExpense);
  const netIncome = convert(latest.netIncome, latest.netIncomeCommonStockholders);
  const operatingCF = convert(latest.operatingCashFlow, latest.cashFlowFromContinuingOperatingActivities);
  const investingCF = convert(latest.investingCashFlow, latest.cashFlowFromContinuingInvestingActivities);
  const netTangibleAssets = convert(latest.netTangibleAssets, latest.tangibleBookValue);

  const yahooPe = pick(summary.summaryDetail?.trailingPE, summary.defaultKeyStatistics?.trailingPE);
  const yahooPb = pick(summary.defaultKeyStatistics?.priceToBook);
  const latestStatementEps = pick(latest.dilutedEPS, latest.basicEPS);
  const latestConvertedEps = latestStatementEps === null ? null : latestStatementEps * data.financialFx.rate;
  const epsFromYahooRatio = yahooPe && price ? price / yahooPe : null;
  const shareScale = latestConvertedEps && epsFromYahooRatio ? epsFromYahooRatio / latestConvertedEps : 1;
  const epsAdj = epsFromYahooRatio ?? (latestConvertedEps === null ? null : latestConvertedEps * shareScale);
  const bvps = yahooPb && price ? price / yahooPb : equity !== null && shares ? (equity / shares) * shareScale : null;
  const pe = epsAdj !== null && epsAdj > 0 ? ratio(price, epsAdj) : null;
  const pb = bvps !== null && bvps > 0 ? ratio(price, bvps) : null;
  const fcf = operatingCF !== null && investingCF !== null ? operatingCF + investingCF : null;
  const tie = interestExpense === 0 && ebit !== null && ebit > 0 ? Infinity : ratio(ebit, interestExpense);
  const epsHistory = sortedStatements(data.annual)
    .map((row) => {
      const eps = pick(row.dilutedEPS, row.basicEPS);
      return {
        year: new Date(row.date).getFullYear(),
        eps: eps === null ? null : eps * data.financialFx.rate * shareScale,
      };
    })
    .filter((item) => item.eps !== null)
    .slice(0, 5);

  const snapshot = {
    price,
    pe,
    pb,
    pePb: pe !== null && pb !== null ? pe * pb : null,
    debtRatio: ratio(totalLiabilities, equity),
    currentRatio: ratio(currentAssets, currentLiabilities),
    quickRatio: currentAssets !== null && currentLiabilities ? ratio(currentAssets - inventory, currentLiabilities) : null,
    fcf,
    epsAllPositive: epsHistory.length > 0 ? epsHistory.every((item) => item.eps > 0) : null,
    epsGrowing: epsHistory.length > 1 ? epsHistory.every((item, index, arr) => index === arr.length - 1 || item.eps >= arr[index + 1].eps) : null,
    roe: ratio(netIncome, equity),
    roa: ratio(netIncome, totalAssets),
    tie,
    epsAdj,
    bvps,
    grahamFormula: epsAdj !== null && epsAdj > 0 && bvps !== null && bvps > 0 ? Math.sqrt(22.5 * epsAdj * bvps) : null,
    source: "Yahoo Finance fundamentalsTimeSeries + FX",
    sourceDate: new Date(latest.date).toISOString().slice(0, 10),
    epsHistory,
    yahoo: {
      symbol: data.symbol,
      priceCurrency: data.priceCurrency,
      financialCurrency: data.financialCurrency,
      priceFx: data.priceFx,
      financialFx: data.financialFx,
      shareScale,
    },
  };

  const required = [snapshot.price, snapshot.pe, snapshot.pb, snapshot.debtRatio, snapshot.currentRatio];
  const ok = required.every((value) => value !== null && value !== undefined && Number.isFinite(Number(value)));
  const warnings = [];
  if (data.priceCurrency !== data.expectedCurrency) warnings.push(`Precio convertido de ${data.priceCurrency} a ${data.expectedCurrency}.`);
  if (data.financialCurrency !== data.expectedCurrency) warnings.push(`Fundamentales convertidos de ${data.financialCurrency} a ${data.expectedCurrency}.`);
  if (shareScale !== 1) warnings.push("Escala por accion inferida desde P/E Yahoo para alinear ADR/listado con estados financieros.");

  return {
    ok,
    symbol: data.symbol,
    snapshot,
    warnings,
    reason: ok ? "Snapshot Yahoo completo con FX validado." : "Yahoo time series no entrego todos los ratios minimos.",
  };
}

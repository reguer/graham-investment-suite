import YahooFinance from "yahoo-finance2";

const YAHOO_QUOTE_SUMMARY = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/";

function yahooClient() {
  return new YahooFinance({ suppressNotices: ["yahooSurvey"] });
}

function raw(value) {
  const candidate = value && typeof value === "object" && "raw" in value ? value.raw : value;
  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : null;
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

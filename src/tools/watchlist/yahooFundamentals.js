const YAHOO_QUOTE_SUMMARY = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/";

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

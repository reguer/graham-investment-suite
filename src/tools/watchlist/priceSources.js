const STOOQ_BASE_URL = "https://stooq.com/q/l/";
const YAHOO_CHART_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/";

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

export async function fetchStooqQuotes(tickers, fetchImpl = fetch) {
  if (!tickers.length) return {};

  const symbols = tickers.map((ticker) => `${ticker.toLowerCase()}.us`).join("+");
  const url = `${STOOQ_BASE_URL}?s=${symbols}&f=sd2t2ohlcv&h&e=csv`;
  const response = await fetchImpl(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`Stooq devolvio ${response.status}: ${response.statusText}`);

  const text = await response.text();
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const quotes = {};

  for (const line of lines.slice(1)) {
    const [symbol, date, time, open, high, low, close, volume] = parseCsvLine(line);
    if (!symbol || close === "N/D") continue;
    const ticker = symbol.replace(/\.US$/i, "").toUpperCase();
    const price = Number(close);
    if (!Number.isFinite(price)) continue;
    quotes[ticker] = {
      ticker,
      price,
      date,
      time,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      volume: Number(volume),
      source: "Stooq",
    };
  }

  return quotes;
}

function normalizeQuoteTarget(target) {
  if (typeof target === "string") return { ticker: target, symbol: target };
  return {
    ticker: target.ticker,
    symbol: target.symbol || target.yahooSymbol || target.ticker,
  };
}

function yahooTimestampToIso(seconds) {
  if (!seconds) return "";
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

export async function fetchYahooChartQuote(target, fetchImpl = fetch) {
  const { ticker, symbol } = normalizeQuoteTarget(target);
  const url = `${YAHOO_CHART_BASE_URL}${encodeURIComponent(symbol)}?range=1d&interval=1d`;
  const response = await fetchImpl(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`Yahoo Finance devolvio ${response.status}: ${response.statusText}`);

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const meta = result?.meta;
  const close = result?.indicators?.quote?.[0]?.close?.at(-1);
  const price = Number(meta?.regularMarketPrice ?? close);
  if (!Number.isFinite(price)) throw new Error(`Yahoo Finance no devolvio precio valido para ${symbol}`);

  return {
    ticker,
    symbol,
    price,
    currency: meta?.currency || "",
    date: yahooTimestampToIso(meta?.regularMarketTime),
    time: meta?.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString().slice(11, 19) : "",
    open: Number(meta?.regularMarketDayOpen ?? result?.indicators?.quote?.[0]?.open?.at(-1)),
    high: Number(meta?.regularMarketDayHigh ?? result?.indicators?.quote?.[0]?.high?.at(-1)),
    low: Number(meta?.regularMarketDayLow ?? result?.indicators?.quote?.[0]?.low?.at(-1)),
    volume: Number(meta?.regularMarketVolume ?? result?.indicators?.quote?.[0]?.volume?.at(-1)),
    exchangeName: meta?.exchangeName || "",
    fullExchangeName: meta?.fullExchangeName || "",
    source: "Yahoo Finance Chart",
  };
}

export async function fetchYahooChartQuotes(targets, fetchImpl = fetch) {
  const quotes = {};
  for (const target of targets) {
    try {
      const quote = await fetchYahooChartQuote(target, fetchImpl);
      quotes[quote.ticker] = quote;
    } catch {
      // Keep the batch resilient; unresolved symbols stay on their local snapshot.
    }
  }
  return quotes;
}

export async function fetchMarketQuotes(targets, fetchImpl = fetch) {
  const items = targets.map(normalizeQuoteTarget);
  const yahooQuotes = await fetchYahooChartQuotes(items, fetchImpl);
  const unresolvedUsTickers = items
    .filter((item) => !yahooQuotes[item.ticker] && !item.symbol.includes(".") && !item.symbol.includes("^") && !item.symbol.includes("="))
    .map((item) => item.ticker);

  if (!unresolvedUsTickers.length) return yahooQuotes;

  try {
    return {
      ...yahooQuotes,
      ...(await fetchStooqQuotes(unresolvedUsTickers, fetchImpl)),
    };
  } catch {
    return yahooQuotes;
  }
}

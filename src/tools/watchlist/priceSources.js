const STOOQ_BASE_URL = "https://stooq.com/q/l/";

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

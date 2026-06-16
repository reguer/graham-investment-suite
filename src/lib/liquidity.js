// liquidity: how easily a stock can be bought/sold without moving the price.
// The driving metric is the average DAILY DOLLAR VOLUME (avg share volume × price)
// — far more meaningful than share count, since it measures the actual money that
// changes hands. Market cap is a secondary guard. Returns a label + color so the
// UI can flag "fácilmente vendible" vs "ilíquida".

import { AC } from "./colors.js";

function isNum(value) {
  return typeof value === "number" && Number.isFinite(value);
}

// Thresholds in USD of average daily traded value. These are pragmatic retail
// cutoffs: above ~$50M/day a position is trivially tradable; below ~$1M/day exit
// can be slow and move the price.
const DOLLAR_VOL = { high: 50_000_000, medium: 5_000_000, low: 1_000_000 };
const MARKET_CAP = { high: 10_000_000_000, medium: 2_000_000_000 }; // large / mid cap

// liquidityLabel({ avgVolume, price, marketCap }) -> { level, label, color, detail }
// level: "high" | "medium" | "low" | "very_low" | "unknown".
export function liquidityLabel({ avgVolume, price, marketCap } = {}) {
  const dollarVol = isNum(avgVolume) && isNum(price) ? avgVolume * price : null;

  if (dollarVol === null && !isNum(marketCap)) {
    return { level: "unknown", label: "Liquidez N/D", color: AC.gray, detail: "Sin datos de volumen" };
  }

  // Prefer dollar volume; fall back to market cap when volume is missing.
  const byDollar = dollarVol !== null
    ? dollarVol >= DOLLAR_VOL.high ? "high"
      : dollarVol >= DOLLAR_VOL.medium ? "medium"
      : dollarVol >= DOLLAR_VOL.low ? "low"
      : "very_low"
    : null;

  const byCap = isNum(marketCap)
    ? marketCap >= MARKET_CAP.high ? "high"
      : marketCap >= MARKET_CAP.medium ? "medium"
      : "low"
    : null;

  const level = byDollar ?? byCap;
  const money = dollarVol !== null ? `$${formatShort(dollarVol)}/día` : `cap $${formatShort(marketCap)}`;

  switch (level) {
    case "high":
      return { level, label: "Liquidez alta", color: AC.green, detail: `${money} · fácil de vender` };
    case "medium":
      return { level, label: "Liquidez media", color: AC.blue, detail: `${money} · vendible` };
    case "low":
      return { level, label: "Liquidez baja", color: AC.yellow, detail: `${money} · salida puede ser lenta` };
    default:
      return { level: "very_low", label: "Poco líquida", color: AC.red, detail: `${money} · difícil de vender` };
  }
}

// Compact money formatting: 1_234_567_890 -> "1.2B", 45_000_000 -> "45.0M".
export function formatShort(value) {
  if (!isNum(value)) return "N/D";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(Math.round(value));
}

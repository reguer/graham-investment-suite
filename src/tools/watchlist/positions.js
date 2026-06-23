export const POSITIONS_STORAGE_KEY = "graham-watchlist:positions";
export const DEFAULT_USD_MXN = 18.5;

export function parseMoney(value) {
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizePositions(payload) {
  const items = Array.isArray(payload) ? payload : [];
  return items
    .map((item) => ({
      ticker: String(item.ticker || "").trim().toUpperCase(),
      shares: parseMoney(item.shares) ?? 0,
      entryPriceMxn: parseMoney(item.entryPriceMxn),
      notes: String(item.notes || "").trim(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
    }))
    .filter((item) => item.ticker && item.entryPriceMxn !== null);
}

export function quoteCurrencyFor(company) {
  return String(company?.quoteCurrency || company?.currency || "USD").toUpperCase();
}

export function priceToMxn(price, currency = "USD", usdMxn = DEFAULT_USD_MXN) {
  const parsedPrice = parseMoney(price);
  const parsedFx = parseMoney(usdMxn);
  if (parsedPrice === null) return null;
  if (currency === "MXN") return parsedPrice;
  if (currency === "USD" && parsedFx) return parsedPrice * parsedFx;
  return null;
}

export function entryPriceInQuoteCurrency(entryPriceMxn, currency = "USD", usdMxn = DEFAULT_USD_MXN) {
  const parsedEntry = parseMoney(entryPriceMxn);
  const parsedFx = parseMoney(usdMxn);
  if (parsedEntry === null) return null;
  if (currency === "MXN") return parsedEntry;
  if (currency === "USD" && parsedFx) return parsedEntry / parsedFx;
  return null;
}

export function positionRecommendation({ currentPriceMxn, defensivePriceMxn, gainPct, alertLevel }) {
  if (currentPriceMxn === null) return { action: "Revisar datos", tone: "muted", reason: "Sin precio actualizado convertible a MXN." };
  if (defensivePriceMxn !== null && currentPriceMxn <= defensivePriceMxn) {
    return { action: "Comprar / acumular", tone: "buy", reason: "Precio actual dentro del maximo defensivo Graham." };
  }
  if (gainPct !== null && gainPct >= 0.35 && defensivePriceMxn !== null && currentPriceMxn > defensivePriceMxn * 1.25) {
    return { action: "Revisar venta parcial", tone: "sell", reason: "Ganancia alta y precio lejos del rango defensivo." };
  }
  if (["watch", "pending"].includes(alertLevel) && gainPct !== null && gainPct <= -0.15) {
    return { action: "Revisar tesis", tone: "sell", reason: "Perdida relevante en empresa no aprobada por el sistema." };
  }
  if (defensivePriceMxn !== null && currentPriceMxn > defensivePriceMxn * 1.15) {
    return { action: "Mantener, no aumentar", tone: "hold", reason: "Por encima del precio defensivo; mejor esperar margen de seguridad." };
  }
  return { action: "Mantener", tone: "hold", reason: "Sin senal fuerte de compra o venta bajo las reglas actuales." };
}

export function evaluatePositions(positions, companies, { usdMxn = DEFAULT_USD_MXN } = {}) {
  const byTicker = new Map(companies.map((company) => [String(company.ticker).toUpperCase(), company]));
  return normalizePositions(positions).map((position) => {
    const company = byTicker.get(position.ticker);
    const currency = quoteCurrencyFor(company);
    const livePrice = company?.livePrice ?? company?.lastPrice ?? company?.price;
    const currentPriceMxn = priceToMxn(livePrice, currency, usdMxn);
    const entryPriceQuote = entryPriceInQuoteCurrency(position.entryPriceMxn, currency, usdMxn);
    const defensivePriceMxn = priceToMxn(company?.ratios?.maxDefensivePrice, currency, usdMxn);
    const gainPct = currentPriceMxn !== null && position.entryPriceMxn
      ? (currentPriceMxn - position.entryPriceMxn) / position.entryPriceMxn
      : null;
    const marketValueMxn = currentPriceMxn !== null && position.shares ? currentPriceMxn * position.shares : null;
    const costMxn = position.entryPriceMxn !== null && position.shares ? position.entryPriceMxn * position.shares : null;
    const recommendation = positionRecommendation({
      currentPriceMxn,
      defensivePriceMxn,
      gainPct,
      alertLevel: company?.alertLevel,
    });

    return {
      ...position,
      company,
      currency,
      currentPriceMxn,
      entryPriceQuote,
      defensivePriceMxn,
      gainPct,
      marketValueMxn,
      costMxn,
      recommendation,
    };
  });
}

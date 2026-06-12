// Shared Graham valuation formulas, so the manual analyzer (calcRatios) and the
// watchlist re-pricing path (deriveSnapshot) compute them from one definition and
// can never drift apart. Each returns null on missing/invalid inputs.

export function safeDiv(numerator, denominator) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

// Graham number: the fair price = sqrt(22.5 * EPS * BVPS). Requires both positive.
export function grahamNumber(eps, bvps) {
  if (eps === null || bvps === null || eps <= 0 || bvps <= 0) return null;
  return Math.sqrt(22.5 * eps * bvps);
}

// Defensive ceiling: the lowest of the Graham number, the P/E 20 price and the
// P/B 2 price. Falls back to the P/E 20 price when book value is unavailable.
export function maxDefensivePrice({ grahamFormula, pricePe20, pricePb2 }) {
  return grahamFormula !== null && pricePb2 !== null
    ? Math.min(grahamFormula, pricePe20, pricePb2)
    : pricePe20;
}

// Margin of safety of a fair value vs the market price: (value - price) / price.
export function marginOfSafety(value, price) {
  return value !== null && price ? (value - price) / price : null;
}

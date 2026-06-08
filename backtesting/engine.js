import { calculateBacktestMetrics } from "./metrics.js";
import { GRAHAM_DEFENSIVE_STRATEGY, shouldEnterGrahamDefensive, shouldExitGrahamDefensive } from "./strategies/graham-defensive.js";

function toPriceMap(company) {
  return new Map((company.prices || []).map((point) => [point.date, Number(point.close)]));
}

function uniqueDates(universe) {
  return [...new Set(universe.flatMap((company) => (company.prices || []).map((point) => point.date)))].sort();
}

function daysBetween(start, end) {
  return Math.max(Math.round((new Date(end) - new Date(start)) / (24 * 60 * 60 * 1000)), 0);
}

function marketValue(position, price) {
  return position.shares * price;
}

export function runBacktest({
  universe,
  initialCapital = 100000,
  maxPositionPct = 0.1,
  commissionPct = 0.001,
  slippagePct = 0.001,
  stopLossPct = -0.2,
  exitPePb = 28,
  strategy = GRAHAM_DEFENSIVE_STRATEGY,
} = {}) {
  const companies = universe || [];
  const dates = uniqueDates(companies);
  const priceMaps = new Map(companies.map((company) => [company.ticker, toPriceMap(company)]));
  const positions = new Map();
  const completedTickers = new Set();
  const trades = [];
  const equityCurve = [];
  let cash = initialCapital;

  for (const date of dates) {
    for (const company of companies) {
      const price = priceMaps.get(company.ticker).get(date);
      const position = positions.get(company.ticker);
      if (!position || !Number.isFinite(price)) continue;
      const exit = shouldExitGrahamDefensive(position, company, price, { stopLossPct, exitPePb });
      if (!exit.ok) continue;

      const exitPrice = price * (1 - slippagePct);
      const proceeds = position.shares * exitPrice;
      const commission = proceeds * commissionPct;
      const pnl = proceeds - commission - position.capitalInvested;
      cash += proceeds - commission;
      position.exitDate = date;
      position.exitPrice = exitPrice;
      position.exitCondition = exit.reason;
      position.grossReturnPct = (exitPrice - position.entryPrice) / position.entryPrice;
      position.netReturnPct = pnl / position.capitalInvested;
      position.pnl = pnl;
      position.holdDays = daysBetween(position.entryDate, date);
      trades.push(position);
      positions.delete(company.ticker);
      completedTickers.add(company.ticker);
    }

    for (const company of companies) {
      if (positions.has(company.ticker) || completedTickers.has(company.ticker)) continue;
      const price = priceMaps.get(company.ticker).get(date);
      if (!Number.isFinite(price)) continue;
      const entry = shouldEnterGrahamDefensive(company, price);
      if (!entry.ok) continue;

      const entryPrice = price * (1 + slippagePct);
      const allocation = Math.min(initialCapital * maxPositionPct, cash);
      const shares = Math.floor(allocation / entryPrice);
      if (shares <= 0) continue;
      const capitalInvested = shares * entryPrice;
      const commission = capitalInvested * commissionPct;
      if (capitalInvested + commission > cash) continue;
      cash -= capitalInvested + commission;
      positions.set(company.ticker, {
        id: `${strategy.id}-${company.ticker}-${date}`,
        ticker: company.ticker,
        companyName: company.companyName || company.ticker,
        strategy: strategy.id,
        strategyVersion: strategy.version,
        entryDate: date,
        entryPrice,
        entryCondition: entry.reason,
        shares,
        capitalInvested: capitalInvested + commission,
      });
    }

    let equity = cash;
    for (const [ticker, position] of positions) {
      const price = priceMaps.get(ticker).get(date);
      equity += Number.isFinite(price) ? marketValue(position, price) : 0;
    }
    equityCurve.push({ date, equity, cash, openPositions: positions.size });
  }

  const lastDate = dates.at(-1);
  for (const [ticker, position] of positions) {
    const company = companies.find((item) => item.ticker === ticker);
    const price = priceMaps.get(ticker).get(lastDate);
    if (!Number.isFinite(price)) continue;
    const exitPrice = price * (1 - slippagePct);
    const proceeds = position.shares * exitPrice;
    const commission = proceeds * commissionPct;
    const pnl = proceeds - commission - position.capitalInvested;
    position.exitDate = lastDate;
    position.exitPrice = exitPrice;
    position.exitCondition = "Cierre del periodo de backtest.";
    position.grossReturnPct = (exitPrice - position.entryPrice) / position.entryPrice;
    position.netReturnPct = pnl / position.capitalInvested;
    position.pnl = pnl;
    position.holdDays = daysBetween(position.entryDate, lastDate);
    trades.push(position);
    cash += proceeds - commission;
    positions.delete(ticker);
    completedTickers.add(ticker);
    if (company) company.lastBacktestExit = lastDate;
  }

  if (equityCurve.length) {
    equityCurve[equityCurve.length - 1] = {
      ...equityCurve[equityCurve.length - 1],
      equity: cash,
      cash,
      openPositions: 0,
    };
  }

  const metrics = calculateBacktestMetrics({ equityCurve, trades, initialCapital });
  return {
    strategy,
    initialCapital,
    dates,
    trades,
    equityCurve,
    metrics,
    assumptions: [
      "Backtesting v2.0 basico usa fundamentales snapshot como proxy historico.",
      "No incluye impuestos, dividendos, FX ni datos fundamentales trimestrales historicos.",
    ],
  };
}

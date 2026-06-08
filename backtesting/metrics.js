function pctChange(a, b) {
  return a ? (b - a) / a : 0;
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

export function calculateMaxDrawdown(equityCurve) {
  let peak = -Infinity;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    peak = Math.max(peak, point.equity);
    if (peak > 0) maxDrawdown = Math.min(maxDrawdown, (point.equity - peak) / peak);
  }
  return maxDrawdown;
}

export function calculateBacktestMetrics({ equityCurve, trades, initialCapital, riskFreeRate = 0 } = {}) {
  const finalEquity = equityCurve.at(-1)?.equity ?? initialCapital;
  const totalReturn = pctChange(initialCapital, finalEquity);
  const firstDate = new Date(equityCurve[0]?.date);
  const lastDate = new Date(equityCurve.at(-1)?.date);
  const years = Number.isFinite(firstDate.getTime()) && Number.isFinite(lastDate.getTime())
    ? Math.max((lastDate - firstDate) / (365.25 * 24 * 60 * 60 * 1000), 1 / 365.25)
    : 1;
  const annualizedReturn = (1 + totalReturn) ** (1 / years) - 1;
  const closedTrades = trades.filter((trade) => trade.exitDate);
  const winners = closedTrades.filter((trade) => trade.netReturnPct > 0);
  const losses = closedTrades.filter((trade) => trade.netReturnPct < 0);
  const grossProfit = winners.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0));
  const dailyReturns = equityCurve.slice(1).map((point, index) => pctChange(equityCurve[index].equity, point.equity));
  const alphaValues = closedTrades.map((trade) => trade.alphaVsBenchmark).filter((value) => value !== null && value !== undefined && Number.isFinite(Number(value)));
  const downsideReturns = dailyReturns.filter((value) => value < 0);
  const dailyRiskFree = riskFreeRate / 252;
  const excessDaily = dailyReturns.map((value) => value - dailyRiskFree);
  const sharpe = stdDev(excessDaily) ? (mean(excessDaily) / stdDev(excessDaily)) * Math.sqrt(252) : null;
  const sortino = stdDev(downsideReturns) ? (mean(excessDaily) / stdDev(downsideReturns)) * Math.sqrt(252) : null;

  return {
    initialCapital,
    finalEquity,
    totalReturn,
    annualizedReturn,
    maxDrawdown: calculateMaxDrawdown(equityCurve),
    tradeCount: closedTrades.length,
    openTradeCount: trades.length - closedTrades.length,
    winRate: closedTrades.length ? winners.length / closedTrades.length : null,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : null,
    averageHoldDays: closedTrades.length ? mean(closedTrades.map((trade) => trade.holdDays)) : null,
    averageAlphaVsBenchmark: alphaValues.length ? mean(alphaValues) : null,
    sharpe,
    sortino,
  };
}

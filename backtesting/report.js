function pct(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function money(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  return Number(value).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function renderBacktestMarkdown(result, { title = "Backtest Graham defensivo" } = {}) {
  const metrics = result.metrics || {};
  return `# ${title}

Estrategia: ${result.strategy.label} (${result.strategy.id} v${result.strategy.version})

## Supuestos

${result.assumptions.map((item) => `- ${item}`).join("\n")}

## Metricas

| Metrica | Valor |
|---|---:|
| Capital inicial | ${money(metrics.initialCapital)} |
| Equity final | ${money(metrics.finalEquity)} |
| Rendimiento total | ${pct(metrics.totalReturn)} |
| Rendimiento anualizado | ${pct(metrics.annualizedReturn)} |
| Max drawdown | ${pct(metrics.maxDrawdown)} |
| Trades cerrados | ${metrics.tradeCount ?? 0} |
| Win rate | ${pct(metrics.winRate)} |
| Profit factor | ${metrics.profitFactor === Infinity ? "Infinity" : metrics.profitFactor?.toFixed?.(2) ?? "N/A"} |
| Sharpe | ${metrics.sharpe?.toFixed?.(2) ?? "N/A"} |
| Sortino | ${metrics.sortino?.toFixed?.(2) ?? "N/A"} |

## Trades

| Ticker | Entrada | Salida | Precio entrada | Precio salida | Retorno neto | Motivo salida |
|---|---|---|---:|---:|---:|---|
${result.trades.map((trade) => `| ${trade.ticker} | ${trade.entryDate} | ${trade.exitDate || ""} | ${money(trade.entryPrice)} | ${money(trade.exitPrice)} | ${pct(trade.netReturnPct)} | ${trade.exitCondition || ""} |`).join("\n")}

## Equity Curve

| Fecha | Equity | Cash | Posiciones |
|---|---:|---:|---:|
${result.equityCurve.map((point) => `| ${point.date} | ${money(point.equity)} | ${money(point.cash)} | ${point.openPositions} |`).join("\n")}
`;
}

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
  const benchmark = result.benchmark || null;
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
| Benchmark | ${benchmark ? benchmark.name : "N/A"} |
| Retorno benchmark | ${pct(benchmark?.totalReturn)} |
| Exceso vs benchmark | ${pct(benchmark?.excessReturn)} |
| Alfa promedio por trade | ${pct(metrics.averageAlphaVsBenchmark)} |
| Sharpe | ${metrics.sharpe?.toFixed?.(2) ?? "N/A"} |
| Sortino | ${metrics.sortino?.toFixed?.(2) ?? "N/A"} |

## Trades

| Ticker | Entrada | Salida | Precio entrada | Precio salida | Retorno neto | Benchmark | Alfa | Motivo salida |
|---|---|---|---:|---:|---:|---:|---:|---|
${result.trades.map((trade) => `| ${trade.ticker} | ${trade.entryDate} | ${trade.exitDate || ""} | ${money(trade.entryPrice)} | ${money(trade.exitPrice)} | ${pct(trade.netReturnPct)} | ${pct(trade.benchmarkReturnInPeriod)} | ${pct(trade.alphaVsBenchmark)} | ${trade.exitCondition || ""} |`).join("\n")}

## Equity Curve

| Fecha | Equity | Cash | Posiciones |
|---|---:|---:|---:|
${result.equityCurve.map((point) => `| ${point.date} | ${money(point.equity)} | ${money(point.cash)} | ${point.openPositions} |`).join("\n")}
`;
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function renderTradesCsv(trades = []) {
  const rows = trades.map((trade) => [
    trade.id,
    trade.ticker,
    trade.companyName,
    trade.entryDate,
    trade.exitDate,
    trade.entryPrice,
    trade.exitPrice,
    trade.shares,
    trade.capitalInvested,
    trade.pnl,
    trade.netReturnPct,
    trade.benchmarkReturnInPeriod,
    trade.alphaVsBenchmark,
    trade.exitCondition,
  ]);
  const headers = ["id", "ticker", "company", "entry_date", "exit_date", "entry_price", "exit_price", "shares", "capital_invested", "pnl", "net_return_pct", "benchmark_return_pct", "alpha_vs_benchmark", "exit_condition"];
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
}

export function renderEquityCurveCsv(equityCurve = []) {
  const headers = ["date", "equity", "cash", "open_positions"];
  const rows = equityCurve.map((point) => [point.date, point.equity, point.cash, point.openPositions]);
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
}

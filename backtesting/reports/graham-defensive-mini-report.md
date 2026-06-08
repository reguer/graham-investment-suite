# Backtest Graham defensivo

Estrategia: Graham defensivo basico (graham-defensive v0.1.0)

## Supuestos

- Backtesting v2.0 basico usa fundamentales snapshot como proxy historico.
- No incluye impuestos, dividendos, FX ni datos fundamentales trimestrales historicos.

## Metricas

| Metrica | Valor |
|---|---:|
| Capital inicial | $100,000.00 |
| Equity final | $119,363.54 |
| Rendimiento total | 19.36% |
| Rendimiento anualizado | 19.44% |
| Max drawdown | -22.33% |
| Trades cerrados | 3 |
| Win rate | 66.67% |
| Profit factor | 8.99 |
| Sharpe | 5.79 |
| Sortino | N/A |

## Trades

| Ticker | Entrada | Salida | Precio entrada | Precio salida | Retorno neto | Motivo salida |
|---|---|---|---:|---:|---:|---|
| DROP | 2024-01-02 | 2024-03-29 | $50.05 | $37.96 | -24.30% | Stop loss -20%. |
| EXIT | 2024-01-02 | 2024-06-28 | $40.04 | $119.88 | 198.80% | P/E x P/B 90.00 > 28. |
| SAFE | 2024-01-02 | 2024-12-31 | $50.05 | $59.94 | 19.52% | Cierre del periodo de backtest. |

## Equity Curve

| Fecha | Equity | Cash | Posiciones |
|---|---:|---:|---:|
| 2024-01-02 | $99,940.25 | $70,080.25 | 3 |
| 2024-03-29 | $77,627.13 | $77,627.13 | 2 |
| 2024-06-28 | $107,447.40 | $107,447.40 | 1 |
| 2024-12-31 | $119,363.54 | $119,363.54 | 0 |

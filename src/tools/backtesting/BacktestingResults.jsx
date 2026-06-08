import { useEffect, useMemo, useState } from "react";
import { SURFACE } from "../../lib/colors.js";

function pct(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function money(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  return Number(value).toLocaleString("es-MX", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function Metric({ label, value }) {
  return (
    <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, padding: 12, background: "rgba(15, 23, 42, 0.74)" }}>
      <div style={{ color: SURFACE.muted, fontSize: 12 }}>{label}</div>
      <div style={{ color: SURFACE.text, fontSize: 18, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default function BacktestingResults() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const base = import.meta.env.BASE_URL || "/";
    fetch(`${base}data/backtesting-summary.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`No se pudo cargar backtesting-summary.json (${response.status}).`);
        return response.json();
      })
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, []);

  const trades = useMemo(() => (summary?.trades || []).slice().sort((a, b) => String(a.entryDate).localeCompare(String(b.entryDate))), [summary]);
  const metrics = summary?.metrics || {};
  const benchmark = summary?.benchmark || {};

  if (error) {
    return <div style={{ color: "#fecaca", border: "1px solid rgba(248,113,113,.35)", borderRadius: 8, padding: 16 }}>{error}</div>;
  }
  if (!summary) return <div style={{ color: SURFACE.muted }}>Cargando backtesting...</div>;

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24 }}>Backtesting Graham</h1>
        <p style={{ color: SURFACE.muted, margin: "6px 0 0", maxWidth: 840 }}>
          Estrategia defensiva básica con precios históricos y fundamentales snapshot como proxy. No es una simulación histórica definitiva.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <Metric label="Capital inicial" value={money(metrics.initialCapital)} />
        <Metric label="Equity final" value={money(metrics.finalEquity)} />
        <Metric label="Rendimiento" value={pct(metrics.totalReturn)} />
        <Metric label="Benchmark" value={pct(benchmark.totalReturn)} />
        <Metric label="Exceso" value={pct(benchmark.excessReturn)} />
        <Metric label="Max drawdown" value={pct(metrics.maxDrawdown)} />
        <Metric label="Trades" value={metrics.tradeCount ?? 0} />
        <Metric label="Win rate" value={pct(metrics.winRate)} />
      </div>

      <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, overflow: "auto", background: "rgba(15, 23, 42, 0.55)" }}>
        <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(30,41,59,.95)", color: SURFACE.muted }}>
              {["Ticker", "Entrada", "Salida", "Precio entrada", "Precio salida", "Retorno", "Benchmark", "Alfa", "Motivo"].map((header) => (
                <th key={header} style={{ textAlign: "left", padding: 10, borderBottom: `1px solid ${SURFACE.border}` }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} style={{ borderBottom: `1px solid ${SURFACE.border}` }}>
                <td style={{ padding: 10, fontWeight: 700 }}>{trade.ticker}</td>
                <td style={{ padding: 10 }}>{trade.entryDate}</td>
                <td style={{ padding: 10 }}>{trade.exitDate}</td>
                <td style={{ padding: 10 }}>{money(trade.entryPrice)}</td>
                <td style={{ padding: 10 }}>{money(trade.exitPrice)}</td>
                <td style={{ padding: 10, color: trade.netReturnPct >= 0 ? "#bbf7d0" : "#fecaca" }}>{pct(trade.netReturnPct)}</td>
                <td style={{ padding: 10 }}>{pct(trade.benchmarkReturnInPeriod)}</td>
                <td style={{ padding: 10 }}>{pct(trade.alphaVsBenchmark)}</td>
                <td style={{ padding: 10 }}>{trade.exitCondition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ color: SURFACE.muted, fontSize: 13 }}>
        Generado: {summary.generatedAt || "N/A"} · Benchmark: {benchmark.name || benchmark.ticker || "N/A"}
      </div>
    </section>
  );
}

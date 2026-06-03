import { useMemo } from "react";
import Dot from "../../components/ui/Dot.jsx";
import MetricCard from "../../components/ui/MetricCard.jsx";
import { AC, SURFACE } from "../../lib/colors.js";
import { fmt, pct } from "../../lib/formatters.js";
import { screenWatchlist, summarizeScreen } from "./screen.js";
import { watchlist } from "./watchlist.js";

function colorFor(level) {
  if (level === "approved") return AC.green;
  if (level === "near") return AC.yellow;
  return AC.gray;
}

export default function Watchlist() {
  const results = useMemo(() => screenWatchlist(watchlist), []);
  const summary = useMemo(() => summarizeScreen(results), [results]);

  return (
    <section>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0 }}>Watchlist Semanal</h1>
        <p style={{ margin: "5px 0 0", color: SURFACE.muted }}>
          Radar de alertas Graham con snapshot financiero. Ejecuta <code>npm run weekly:screen</code> para actualizar precios y generar reporte.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <MetricCard label="Aprobadas" value={String(summary.approved.length)} color={AC.green} />
        <MetricCard label="Cerca" value={String(summary.near.length)} color={AC.yellow} />
        <MetricCard label="Observacion" value={String(summary.watch.length)} color={AC.gray} />
        <MetricCard label="Universo" value={String(results.length)} color={AC.blue} />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {results.map((result) => (
          <article key={result.ticker} style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "#0b1020", padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Dot color={colorFor(result.alertLevel)} />
                  <strong style={{ fontSize: 18 }}>{result.ticker}</strong>
                  <span style={{ color: SURFACE.muted }}>{result.companyName}</span>
                </div>
                <div style={{ marginTop: 5, color: SURFACE.muted, fontSize: 12 }}>{result.sector} · {result.alertLabel}</div>
              </div>
              <div style={{ textAlign: "right", fontFamily: "IBM Plex Mono, monospace" }}>
                <div>{fmt(result.livePrice)}</div>
                <div style={{ color: SURFACE.muted, fontSize: 12 }}>Max defensivo {fmt(result.ratios.maxDefensivePrice)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 12 }}>
              <small>P/E <strong>{fmt(result.ratios.pe)}</strong></small>
              <small>P/B <strong>{fmt(result.ratios.pb)}</strong></small>
              <small>P/E x P/B <strong>{fmt(result.ratios.pePb)}</strong></small>
              <small>Debt <strong>{fmt(result.ratios.debtRatio)}</strong></small>
              <small>Current <strong>{fmt(result.ratios.currentRatio)}</strong></small>
              <small>MoS <strong>{pct(result.ratios.marginOfSafety)}</strong></small>
            </div>

            <p style={{ color: SURFACE.text, margin: "12px 0 0", lineHeight: 1.5 }}>{result.watchReason}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

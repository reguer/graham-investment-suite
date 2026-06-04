import { useMemo, useState } from "react";
import Dot from "../../components/ui/Dot.jsx";
import MetricCard from "../../components/ui/MetricCard.jsx";
import { AC, SURFACE } from "../../lib/colors.js";
import { fmt, pct } from "../../lib/formatters.js";
import { screenWatchlist, summarizeScreen } from "./screen.js";
import { watchlist, watchlistMeta } from "./watchlist.js";

function colorFor(level) {
  if (level === "approved") return AC.green;
  if (level === "near") return AC.yellow;
  if (level === "pending") return AC.blue;
  return AC.gray;
}

export default function Watchlist() {
  const [view, setView] = useState("all");
  const [query, setQuery] = useState("");
  const results = useMemo(() => screenWatchlist(watchlist), []);
  const summary = useMemo(() => summarizeScreen(results), [results]);
  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return results.filter((result) => {
      const matchesView =
        view === "all" ||
        (view === "analyzed" && result.analysisStatus === "analyzed") ||
        (view === "requested" && result.priority === "requested") ||
        (view === "pending" && result.alertLevel === "pending") ||
        (view === "bmv" && result.market === "BMV SIC");
      const matchesQuery =
        !normalizedQuery ||
        [result.ticker, result.yahooSymbol, result.companyName, result.sector, result.market]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      return matchesView && matchesQuery;
    });
  }, [query, results, view]);

  return (
    <section>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0 }}>Watchlist Semanal</h1>
        <p style={{ margin: "5px 0 0", color: SURFACE.muted }}>
          Radar Graham con {watchlistMeta.analyzedCount} analizadas y {watchlistMeta.pendingCount} pendientes de primer analisis. Ejecuta <code>npm run universe:refresh</code> para actualizar precios Yahoo.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <MetricCard label="Aprobadas" value={String(summary.approved.length)} color={AC.green} />
        <MetricCard label="Cerca" value={String(summary.near.length)} color={AC.yellow} />
        <MetricCard label="Observacion" value={String(summary.watch.length)} color={AC.gray} />
        <MetricCard label="Pendientes" value={String(summary.pending.length)} color={AC.blue} />
        <MetricCard label="Universo" value={String(results.length)} color={AC.blue} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          ["all", "Todo"],
          ["analyzed", "Analizadas"],
          ["requested", "Lote solicitado"],
          ["pending", "Pendientes"],
          ["bmv", "BMV/SIC"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            style={{
              border: `1px solid ${view === id ? AC.blue : SURFACE.border}`,
              background: view === id ? "#16345f" : "#111827",
              color: SURFACE.text,
              borderRadius: 6,
              padding: "8px 10px",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar ticker, empresa, sector"
          style={{
            minWidth: 240,
            flex: "1 1 240px",
            border: `1px solid ${SURFACE.border}`,
            background: "#0b1020",
            color: SURFACE.text,
            borderRadius: 6,
            padding: "8px 10px",
          }}
        />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filteredResults.map((result) => (
          <article key={result.ticker} style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "#0b1020", padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Dot color={colorFor(result.alertLevel)} />
                  <strong style={{ fontSize: 18 }}>{result.ticker}</strong>
                  <span style={{ color: SURFACE.muted }}>{result.companyName}</span>
                </div>
                <div style={{ marginTop: 5, color: SURFACE.muted, fontSize: 12 }}>
                  {result.yahooSymbol || result.ticker} · {result.market || "Mercado no definido"} · {result.sector} · {result.alertLabel}
                </div>
              </div>
              <div style={{ textAlign: "right", fontFamily: "IBM Plex Mono, monospace" }}>
                <div>{fmt(result.livePrice)}</div>
                <div style={{ color: SURFACE.muted, fontSize: 12 }}>
                  {result.ratios ? `Max defensivo ${fmt(result.ratios.maxDefensivePrice)}` : "Sin fundamentales"}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 12 }}>
              <small>P/E <strong>{fmt(result.ratios?.pe)}</strong></small>
              <small>P/B <strong>{fmt(result.ratios?.pb)}</strong></small>
              <small>P/E x P/B <strong>{fmt(result.ratios?.pePb)}</strong></small>
              <small>Debt <strong>{fmt(result.ratios?.debtRatio)}</strong></small>
              <small>Current <strong>{fmt(result.ratios?.currentRatio)}</strong></small>
              <small>MoS <strong>{pct(result.ratios?.marginOfSafety)}</strong></small>
            </div>

            <p style={{ color: SURFACE.text, margin: "12px 0 0", lineHeight: 1.5 }}>{result.watchReason}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

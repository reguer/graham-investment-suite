import React, { useMemo, useState } from "react";
import { AC, SURFACE } from "../../lib/colors.js";
import { fmt } from "../../lib/formatters.js";
import { liquidityLabel } from "../../lib/liquidity.js";

// UniverseSearch: a search box over the WHOLE catalog (not just candidates), so
// the user can look up any of the ~388 companies by ticker or name and see its
// Graham verdict, key ratios, and a liquidity tag ("fácilmente vendible" or not).
// `universe` is the screened list (each item carries classification + ratios +
// the catalog fields marketCap/avgVolume/livePrice).

function verdictColor(item) {
  return item.classification?.color || SURFACE.muted;
}

export default function UniverseSearch({ universe = [] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return universe
      .filter((item) =>
        (item.ticker || "").toLowerCase().includes(q) ||
        (item.companyName || "").toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [query, universe]);

  return (
    <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: SURFACE.panel, padding: 14, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <strong style={{ fontSize: 15 }}>Buscar en el universo</strong>
        <span style={{ color: SURFACE.muted, fontSize: 12 }}>{universe.length} empresas en catálogo</span>
      </div>
      <input
        type="text"
        placeholder="Buscar por ticker o empresa (p. ej. AAPL, Baidu, banco)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", background: SURFACE.panelDark, border: `1px solid ${SURFACE.border}`, borderRadius: 6, padding: "9px 12px", color: SURFACE.text, fontSize: 14 }}
      />

      {query.trim() && results.length === 0 ? (
        <p style={{ color: SURFACE.muted, fontSize: 13, margin: "12px 2px 2px" }}>Sin resultados para "{query}".</p>
      ) : null}

      {results.length > 0 ? (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {results.map((item) => {
            const liq = liquidityLabel({ avgVolume: item.avgVolume, price: item.livePrice ?? item.price, marketCap: item.marketCap });
            const r = item.ratios || {};
            return (
              <div key={item.ticker} style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, padding: "10px 12px", background: SURFACE.panelDark }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                  <div>
                    <strong style={{ fontSize: 14 }}>{item.ticker}</strong>
                    <span style={{ color: SURFACE.muted, fontSize: 12, marginLeft: 8 }}>{item.companyName || "—"}</span>
                  </div>
                  <span style={{ color: verdictColor(item), fontSize: 12, fontWeight: 600 }}>
                    {item.classification?.label || item.alertLabel || "—"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 7, fontSize: 12, color: SURFACE.muted, fontFamily: "IBM Plex Mono, monospace" }}>
                  <span>P/E {fmt(r.pe)}</span>
                  <span>P/B {fmt(r.pb)}</span>
                  <span>P/E×P/B {fmt(r.pePb)}</span>
                  <span>Deuda {fmt(r.debtRatio)}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ border: `1px solid ${liq.color}`, color: liq.color, borderRadius: 999, padding: "2px 9px", fontSize: 11, whiteSpace: "nowrap" }}>
                    {liq.label}
                  </span>
                  <span style={{ color: SURFACE.muted, fontSize: 11 }}>{liq.detail}</span>
                  {item.sector ? <span style={{ color: SURFACE.muted, fontSize: 11 }}>· {item.sector}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

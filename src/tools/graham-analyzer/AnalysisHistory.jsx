import { SURFACE } from "../../lib/colors.js";
import { fmt } from "../../lib/formatters.js";

export default function AnalysisHistory({ history, onLoad, onClear }) {
  return (
    <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "rgba(15, 23, 42, 0.35)", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Historial</h2>
        <button type="button" onClick={onClear} style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.panel, color: SURFACE.text, borderRadius: 8, padding: "9px 12px" }}>
          Vaciar historial
        </button>
      </div>
      {history.length === 0 ? (
        <p style={{ color: SURFACE.muted }}>Todavia no hay analisis guardados.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {history.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onLoad(item)}
              style={{ textAlign: "left", border: `1px solid ${SURFACE.border}`, background: SURFACE.panel, color: SURFACE.text, borderRadius: 8, padding: 12 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <strong>{item.form.ticker || "SIN TICKER"} · {item.form.companyName || "Empresa"}</strong>
                <span style={{ color: item.classification.color }}>{item.classification.label}</span>
              </div>
              <div style={{ color: SURFACE.muted, marginTop: 6, fontSize: 12 }}>
                {new Date(item.savedAt).toLocaleString()} · Precio {fmt(item.ratios.price)} · P/E {fmt(item.ratios.pe)} · P/B {fmt(item.ratios.pb)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

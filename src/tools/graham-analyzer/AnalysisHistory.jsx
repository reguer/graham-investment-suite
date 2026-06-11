import { useMemo, useState } from "react";
import { AC, SURFACE } from "../../lib/colors.js";
import { fmt } from "../../lib/formatters.js";

function SortIcon({ active, dir }) {
  const up = dir === "asc" ? AC.blueText : SURFACE.muted;
  const down = dir === "desc" ? AC.blueText : SURFACE.muted;
  if (!active) return <span style={{ color: SURFACE.muted, fontSize: 10, marginLeft: 4 }}>⇅</span>;
  return <span style={{ color: AC.blueText, fontSize: 10, marginLeft: 4 }}>{dir === "asc" ? "↑" : "↓"}</span>;
}

function HeaderCell({ label, col, sortCol, sortDir, onSort }) {
  const active = sortCol === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{ padding: "8px 10px", textAlign: "left", cursor: "pointer", userSelect: "none", color: active ? AC.blueText : SURFACE.muted, fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${SURFACE.border}`, whiteSpace: "nowrap" }}
    >
      {label}
      <SortIcon active={active} dir={active ? sortDir : "asc"} />
    </th>
  );
}

export default function AnalysisHistory({ history, onLoad, onClear }) {
  const [filter, setFilter] = useState("");
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "date" ? "desc" : "asc");
    }
  }

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    const base = query
      ? history.filter((item) =>
          (item.form.ticker || "").toLowerCase().includes(query) ||
          (item.form.companyName || "").toLowerCase().includes(query),
        )
      : history;

    return [...base].sort((a, b) => {
      let valA, valB;
      if (sortCol === "date") {
        valA = new Date(a.savedAt).getTime();
        valB = new Date(b.savedAt).getTime();
      } else if (sortCol === "ticker") {
        valA = (a.form.ticker || "").toLowerCase();
        valB = (b.form.ticker || "").toLowerCase();
        const cmp = valA.localeCompare(valB);
        return sortDir === "asc" ? cmp : -cmp;
      } else if (sortCol === "pePb") {
        valA = a.ratios?.pePb ?? Infinity;
        valB = b.ratios?.pePb ?? Infinity;
      } else {
        return 0;
      }
      return sortDir === "asc" ? valA - valB : valB - valA;
    });
  }, [history, filter, sortCol, sortDir]);

  return (
    <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "rgba(15, 23, 42, 0.35)", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Historial</h2>
        <button type="button" onClick={onClear} style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.panel, color: SURFACE.text, borderRadius: 8, padding: "9px 12px" }}>
          Vaciar historial
        </button>
      </div>

      {history.length > 0 ? (
        <input
          type="text"
          placeholder="Filtrar por ticker o empresa..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", marginBottom: 12, background: SURFACE.panel, border: `1px solid ${SURFACE.border}`, borderRadius: 6, padding: "7px 10px", color: SURFACE.text, fontSize: 13 }}
        />
      ) : null}

      {history.length === 0 ? (
        <p style={{ color: SURFACE.muted }}>Todavia no hay analisis guardados.</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: SURFACE.muted }}>Sin resultados para "{filter}".</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
            <thead>
              <tr>
                <HeaderCell label="Empresa" col="ticker" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <HeaderCell label="Fecha" col="date" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <HeaderCell label="P/E × P/B" col="pePb" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th style={{ padding: "8px 10px", textAlign: "left", color: SURFACE.muted, fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${SURFACE.border}` }}>Clasificación</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onLoad(item)}
                  style={{ cursor: "pointer", borderBottom: `1px solid ${SURFACE.border}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(56, 189, 248, 0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                >
                  <td style={{ padding: "10px 10px", fontSize: 13 }}>
                    <strong>{item.form.ticker || "SIN TICKER"}</strong>
                    <div style={{ color: SURFACE.muted, fontSize: 11, marginTop: 2 }}>{item.form.companyName || "Empresa"}</div>
                  </td>
                  <td style={{ padding: "10px 10px", color: SURFACE.muted, fontSize: 12, whiteSpace: "nowrap" }}>
                    {new Date(item.savedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 10px", fontFamily: "IBM Plex Mono, monospace", fontSize: 13 }}>
                    {fmt(item.ratios?.pePb)}
                  </td>
                  <td style={{ padding: "10px 10px" }}>
                    <span style={{ color: item.classification.color, fontSize: 12 }}>{item.classification.label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { AC, SURFACE } from "../../lib/colors.js";
import { buildComparison } from "./compareAnalyses.js";
import { analysesToCsv, triggerDownload, exportFilename } from "../../lib/exportAnalysis.js";

const MAX_SELECTED = 3;

// CompareView: pick 2-3 saved analyses and read their Graham metrics side by side.
// The best value in each row is highlighted (green), so relative quality is visible
// at a glance without re-opening each analysis. Selection is capped at 3 columns to
// keep the table legible on narrow screens.
export default function CompareView({ history }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const selected = useMemo(
    () => selectedIds.map((id) => history.find((item) => item.id === id)).filter(Boolean),
    [selectedIds, history],
  );
  const comparison = useMemo(() => (selected.length >= 2 ? buildComparison(selected) : []), [selected]);

  function toggle(id) {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= MAX_SELECTED) return current;
      return [...current, id];
    });
  }

  const atLimit = selectedIds.length >= MAX_SELECTED;

  return (
    <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "rgba(15, 23, 42, 0.35)", padding: 16 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>Comparar análisis</h2>
      <p style={{ margin: "0 0 14px", color: SURFACE.muted, fontSize: 13 }}>
        Selecciona entre 2 y {MAX_SELECTED} análisis guardados para verlos lado a lado. El mejor valor de cada fila se resalta en verde.
      </p>

      {history.length === 0 ? (
        <p style={{ color: SURFACE.muted }}>No hay análisis guardados todavía. Guarda algunos desde Results para compararlos.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {history.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const disabled = !isSelected && atLimit;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  disabled={disabled}
                  style={{
                    border: `1px solid ${isSelected ? "rgba(56, 189, 248, 0.55)" : SURFACE.border}`,
                    background: isSelected ? "rgba(56, 189, 248, 0.14)" : SURFACE.panel,
                    color: disabled ? SURFACE.muted : isSelected ? AC.blueText : SURFACE.text,
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {item.form.ticker || "SIN TICKER"}
                </button>
              );
            })}
          </div>

          {selected.length < 2 ? (
            <p style={{ color: SURFACE.muted, fontSize: 13 }}>Selecciona al menos 2 análisis para comparar.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => triggerDownload(exportFilename("comparacion", "csv"), analysesToCsv(selected))}
                  style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.panel, color: SURFACE.text, borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
                >
                  Exportar CSV
                </button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "8px 10px", textAlign: "left", color: SURFACE.muted, fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${SURFACE.border}` }}>Métrica</th>
                    {selected.map((item) => (
                      <th key={item.id} style={{ padding: "8px 10px", textAlign: "right", borderBottom: `1px solid ${SURFACE.border}` }}>
                        <div style={{ fontSize: 13, color: SURFACE.text }}>{item.form.ticker || "SIN TICKER"}</div>
                        <div style={{ fontSize: 11, color: item.classification?.color || SURFACE.muted, fontWeight: 400 }}>{item.classification?.label || ""}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr key={row.key} style={{ borderBottom: `1px solid ${SURFACE.border}` }}>
                      <td style={{ padding: "9px 10px", fontSize: 13, color: SURFACE.muted }}>{row.label}</td>
                      {row.cells.map((cell, index) => {
                        const isBest = index === row.bestIndex;
                        return (
                          <td
                            key={index}
                            style={{
                              padding: "9px 10px",
                              textAlign: "right",
                              fontFamily: "IBM Plex Mono, monospace",
                              fontSize: 13,
                              color: isBest ? AC.greenText : SURFACE.text,
                              background: isBest ? "rgba(34, 197, 94, 0.1)" : "transparent",
                              fontWeight: isBest ? 600 : 400,
                            }}
                          >
                            {cell.text}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

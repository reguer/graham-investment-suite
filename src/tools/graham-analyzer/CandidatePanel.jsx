import { AC, SURFACE } from "../../lib/colors.js";
import Dot from "../../components/ui/Dot.jsx";

export default function CandidatePanel({ candidates }) {
  return (
    <section style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "rgba(15, 23, 42, 0.35)", padding: 14, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap", marginBottom: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, letterSpacing: 0 }}>Candidatas Graham investigadas</h2>
          <p style={{ margin: "4px 0 0", color: SURFACE.muted, fontSize: 12 }}>Filtro preliminar Finviz; verificacion con StockAnalysis y reglas del proyecto. Abre la pestana Candidatas para ver notas y recalculo en vivo.</p>
        </div>
        <span style={{ color: "#bbf7d0", fontSize: 12 }}>{candidates.length} aprobadas</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead>
            <tr style={{ color: SURFACE.muted, fontSize: 12, textAlign: "left" }}>
              <th style={cellStyle}>Ticker</th>
              <th style={cellStyle}>Empresa</th>
              <th style={cellStyle}>Sector</th>
              <th style={cellStyle}>P/E</th>
              <th style={cellStyle}>P/B</th>
              <th style={cellStyle}>P/E x P/B</th>
              <th style={cellStyle}>Debt</th>
              <th style={cellStyle}>Current</th>
              <th style={cellStyle}>Nota</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.ticker} style={{ borderTop: `1px solid ${SURFACE.border}` }}>
                <td style={cellStyle}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Dot color={AC.green} />{candidate.ticker}</span></td>
                <td style={cellStyle}>{candidate.companyName}</td>
                <td style={{ ...cellStyle, color: SURFACE.muted }}>{candidate.sector}</td>
                <td style={monoStyle}>{candidate.pe.toFixed(2)}</td>
                <td style={monoStyle}>{candidate.pb.toFixed(2)}</td>
                <td style={monoStyle}>{candidate.pePb.toFixed(2)}</td>
                <td style={monoStyle}>{candidate.debtRatio.toFixed(2)}</td>
                <td style={monoStyle}>{candidate.currentRatio.toFixed(2)}</td>
                <td style={{ ...cellStyle, color: SURFACE.muted, minWidth: 260 }}>{candidate.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const cellStyle = {
  padding: "9px 8px",
  verticalAlign: "top",
};

const monoStyle = {
  ...cellStyle,
  fontFamily: "IBM Plex Mono, monospace",
};

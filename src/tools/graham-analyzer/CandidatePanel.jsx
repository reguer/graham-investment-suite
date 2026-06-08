import React from "react";
import { AC, SURFACE } from "../../lib/colors.js";
import Dot from "../../components/ui/Dot.jsx";

export default function CandidatePanel({ candidates }) {
  return (
    <section style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "rgba(15, 23, 42, 0.35)", padding: 14, marginBottom: 16 }}>
      <style>{`
        .candidate-panel-table { display: block; overflow-x: auto; }
        .candidate-panel-cards { display: none; }
        @media (max-width: 999px) {
          .candidate-panel-table { display: none; }
          .candidate-panel-cards { display: grid; gap: 10px; }
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap", marginBottom: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, letterSpacing: 0 }}>Oportunidades Graham actuales</h2>
          <p style={{ margin: "4px 0 0", color: SURFACE.muted, fontSize: 12 }}>Aprobadas y cercanas tomadas del radar persistido. Abre la pestana Candidatas para ver notas y recalculo en vivo.</p>
        </div>
        <span style={{ color: "#bbf7d0", fontSize: 12 }}>{candidates.length} oportunidades</span>
      </div>
      <div className="candidate-panel-table">
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
                <td style={monoStyle}>{Number(candidate.pe).toFixed(2)}</td>
                <td style={monoStyle}>{Number(candidate.pb).toFixed(2)}</td>
                <td style={monoStyle}>{Number(candidate.pePb).toFixed(2)}</td>
                <td style={monoStyle}>{Number(candidate.debtRatio).toFixed(2)}</td>
                <td style={monoStyle}>{Number(candidate.currentRatio).toFixed(2)}</td>
                <td style={{ ...cellStyle, color: SURFACE.muted, minWidth: 260 }}>{candidate.note || candidate.watchReason || candidate.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="candidate-panel-cards">
        {candidates.map((candidate) => (
          <article key={candidate.ticker} style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "#0b1020", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                  <Dot color={AC.green} />
                  {candidate.ticker}
                </div>
                <div style={{ color: SURFACE.muted, fontSize: 12, marginTop: 3 }}>{candidate.companyName}</div>
              </div>
              <div style={{ color: SURFACE.muted, fontSize: 12, textAlign: "right" }}>{candidate.sector}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 10 }}>
              {[
                ["P/E", candidate.pe],
                ["P/B", candidate.pb],
                ["P/E x P/B", candidate.pePb],
                ["Debt", candidate.debtRatio],
                ["Current", candidate.currentRatio],
              ].map(([label, value]) => (
                <div key={label} style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 6, padding: "7px 8px", background: "#060911" }}>
                  <div style={{ color: SURFACE.muted, fontSize: 11 }}>{label}</div>
                  <div style={{ fontFamily: "IBM Plex Mono, monospace", marginTop: 2 }}>{Number(value).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <p style={{ color: SURFACE.muted, fontSize: 12, lineHeight: 1.45, margin: "10px 0 0" }}>{candidate.note || candidate.watchReason || candidate.notes}</p>
          </article>
        ))}
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

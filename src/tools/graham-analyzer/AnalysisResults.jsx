import MetricCard from "../../components/ui/MetricCard.jsx";
import SectionTitle from "../../components/ui/SectionTitle.jsx";
import { AC, SURFACE } from "../../lib/colors.js";
import { fmt, fmtM, pct } from "../../lib/formatters.js";
import { colorForState, boolState, NA_PLACEHOLDER } from "../../lib/metricState.js";
import { alertFor } from "./constants.js";
import EntryPrices from "./EntryPrices.jsx";
import InterpretationPanel from "./InterpretationPanel.jsx";

// Renders SI / NO / N/D for a tri-state boolean (true / false / null = missing data).
function boolLabel(value) {
  const state = boolState(value);
  return state === "unknown" ? NA_PLACEHOLDER : state === "pass" ? "SI" : "NO";
}

function boolColor(value) {
  const state = boolState(value);
  return state === "unknown" ? AC.gray : state === "pass" ? AC.green : AC.red;
}

function metricGrid(children) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>{children}</div>;
}

function peValue(ratios) {
  if (ratios.pe !== null) return fmt(ratios.pe);
  if (ratios.epsAdj !== null && ratios.epsAdj <= 0) return "N/A (EPS negativo)";
  return "—";
}

export default function AnalysisResults({ form, ratios, classification, checks, validation, aiText, aiError, aiLoading, onRequestAI, onSave }) {
  const hasDataGaps = validation && (validation.missing.length > 0 || validation.warnings.length > 0);
  return (
    <div>
      {hasDataGaps ? (
        <div style={{ background: "rgba(234, 179, 8, 0.1)", border: "1px solid rgba(234, 179, 8, 0.45)", borderRadius: 8, padding: "12px 14px", marginBottom: 14, color: AC.yellow, fontSize: 13 }}>
          <strong style={{ display: "block", marginBottom: 4 }}>Datos incompletos — el veredicto puede no ser concluyente</strong>
          {validation.missing.length > 0 ? (
            <div style={{ color: SURFACE.text }}>Faltan: {validation.missing.map((m) => m.label).join(", ")}.</div>
          ) : null}
          {validation.warnings.map((warning) => (
            <div key={warning} style={{ color: SURFACE.text }}>{warning}</div>
          ))}
        </div>
      ) : null}
      <div style={{ background: "rgba(15, 23, 42, 0.5)", border: `1px solid ${classification.color}`, borderRadius: 8, padding: 16, display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: SURFACE.muted, fontSize: 12 }}>{form.ticker || "SIN TICKER"} · {form.companyName || "Empresa sin nombre"}</div>
          <h2 style={{ margin: "6px 0", color: classification.color, fontSize: 24 }}>{classification.label}</h2>
          <p style={{ margin: 0, color: SURFACE.text }}>{classification.reason}</p>
        </div>
        <button type="button" onClick={onSave} style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.panel, color: SURFACE.text, borderRadius: 8, padding: "10px 13px", alignSelf: "center" }}>
          Guardar analisis
        </button>
      </div>

      <SectionTitle number="1" title="Valuacion" />
      {ratios.hasNegativeEquity ? (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.45)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, color: AC.redText, fontSize: 13 }}>
          Patrimonio neto negativo — P/B no interpretable como Graham. La empresa debe más de lo que vale en libros.
        </div>
      ) : null}
      {metricGrid(
        <>
          <MetricCard label="P/E" value={peValue(ratios)} sublabel="P/E se anula con EPS <= 0" color={alertFor("pe", ratios.pe)} ref="Graham: ideal <= 15" />
          <MetricCard label="P/B" value={ratios.hasNegativeEquity ? "N/A (equity neg.)" : fmt(ratios.pb)} sublabel={`BVPS ${fmt(ratios.bvps)}`} color={ratios.hasNegativeEquity ? AC.red : alertFor("pb", ratios.pb)} ref="Defensivo <= 2" />
          <MetricCard label="P/E x P/B" value={fmt(ratios.pePb)} sublabel="Regla 22.5" color={alertFor("pePb", ratios.pePb)} ref="15 x 1.5" />
          <MetricCard label="Margen seguridad" value={pct(ratios.mosGraham)} sublabel={`Formula ${fmt(ratios.grahamFormula)}`} color={alertFor("mos", ratios.mosGraham)} ref="Cap. 20" />
          <MetricCard label="P/B tangible" value={fmt(ratios.pbTangible)} sublabel={`TBVPS ${fmt(ratios.tangibleBvps)}`} color={alertFor("pb", ratios.pbTangible)} ref="Activos tangibles" />
          {ratios.pePbTangible !== null ? (
            <MetricCard label="P/E x P/B tangible" value={fmt(ratios.pePbTangible)} sublabel="Regla 22.5 sin intangibles" color={alertFor("pePb", ratios.pePbTangible)} ref="Sin goodwill/intangibles" />
          ) : null}
          <MetricCard label="Peso intangibles" value={pct(ratios.intangibleWeight)} sublabel={`Tangible equity ${fmtM(ratios.tangibleEquity)}`} color={colorForState(ratios.intangibleWeight, (v) => (v < 0.1 ? AC.green : v <= 0.3 ? AC.yellow : AC.red))} />
        </>,
      )}

      <SectionTitle number="2" title="Fortaleza financiera" />
      {metricGrid(
        <>
          <MetricCard label="Debt Ratio" value={fmt(ratios.debtRatio)} color={alertFor("debtRatio", ratios.debtRatio)} ref="Pasivos / patrimonio" />
          <MetricCard label="Current Ratio" value={fmt(ratios.currentRatio)} color={alertFor("currentRatio", ratios.currentRatio)} ref="Minimo Graham 2" />
          <MetricCard label="Quick Ratio" value={fmt(ratios.quickRatio)} color={alertFor("quickRatio", ratios.quickRatio)} ref="Liquidez sin inventario" />
          <MetricCard label="TIE" value={ratios.tie === Infinity ? "∞" : fmt(ratios.tie)} color={alertFor("tie", ratios.tie)} ref="EBIT / intereses" />
        </>,
      )}

      <SectionTitle number="3" title="Rentabilidad" />
      {metricGrid(
        <>
          <MetricCard label="Margen neto" value={pct(ratios.netMargin)} color={alertFor("netMargin", ratios.netMargin)} />
          <MetricCard label="ROE" value={pct(ratios.roe)} color={alertFor("roe", ratios.roe)} />
          <MetricCard label="ROA" value={pct(ratios.roa)} color={alertFor("roa", ratios.roa)} />
          <MetricCard label="FCF" value={fmtM(ratios.fcf)} sublabel="Operating CF + Investing CF" color={alertFor("fcf", ratios.fcf)} />
        </>,
      )}

      <SectionTitle number="4" title="Consistencia EPS" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {ratios.epsHistory.map((entry) => (
          <div key={entry.year} style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, padding: 12, background: SURFACE.panel }}>
            <div style={{ color: SURFACE.muted, fontSize: 12 }}>{entry.year}</div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 20 }}>{fmt(entry.value)}</div>
          </div>
        ))}
        <MetricCard label="EPS positivo" value={boolLabel(ratios.epsAllPositive)} color={boolColor(ratios.epsAllPositive)} />
        <MetricCard label="EPS creciente" value={boolLabel(ratios.epsGrowing)} sublabel={`CAGR ${pct(ratios.epsCagr)}`} color={boolColor(ratios.epsGrowing)} />
      </div>

      <SectionTitle number="5" title="Precios de entrada Graham" />
      <EntryPrices ratios={ratios} />

      <SectionTitle number="6" title="Interpretacion" />
      <InterpretationPanel checks={checks} aiText={aiText} aiError={aiError} aiLoading={aiLoading} onRequestAI={onRequestAI} />
    </div>
  );
}

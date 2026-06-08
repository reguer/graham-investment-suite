import InputField from "../../components/ui/InputField.jsx";
import NumericInput from "../../components/ui/NumericInput.jsx";
import SectionTitle from "../../components/ui/SectionTitle.jsx";
import { AC, SURFACE } from "../../lib/colors.js";

function Grid({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>{children}</div>;
}

function Toolbar({ prefillOptions, onPrefill, onReset, onAnalyze }) {
  function handleReset() {
    if (window.confirm("¿Limpiar todos los campos? Se perderán los datos no guardados.")) {
      onReset();
    }
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        flexWrap: "wrap",
        padding: "10px 0",
        background: SURFACE.page,
        borderBottom: `1px solid ${SURFACE.border}`,
        marginBottom: 16,
      }}
    >
      {prefillOptions.map((option) => (
        <button key={option.id} type="button" onClick={() => onPrefill(option.data)} style={buttonStyle("secondary")}>
          Cargar {option.label}
        </button>
      ))}
      <button type="button" onClick={handleReset} style={buttonStyle("secondary")}>Limpiar</button>
      <button type="button" onClick={onAnalyze} style={buttonStyle("primary")}>Calcular resultados</button>
    </div>
  );
}

function buttonStyle(kind) {
  return {
    border: kind === "primary" ? "1px solid rgba(34, 197, 94, 0.45)" : `1px solid ${SURFACE.border}`,
    background: kind === "primary" ? "rgba(34, 197, 94, 0.14)" : SURFACE.panel,
    color: kind === "primary" ? AC.greenText : SURFACE.text,
    borderRadius: 8,
    padding: "10px 13px",
    cursor: "pointer",
  };
}

export default function AnalysisForm({ form, onChange, prefillOptions = [], onPrefill, onReset, onAnalyze }) {
  return (
    <div style={{ background: "rgba(15, 23, 42, 0.35)", border: `1px solid ${SURFACE.border}`, borderRadius: 8, padding: 16 }}>
      <Toolbar prefillOptions={prefillOptions} onPrefill={onPrefill} onReset={onReset} onAnalyze={onAnalyze} />

      <SectionTitle number="0" title="Identificacion" />
      <Grid>
        <InputField label="Ticker" value={form.ticker} onChange={(value) => onChange("ticker", value.toUpperCase())} placeholder="TSM" />
        <InputField label="Empresa" value={form.companyName} onChange={(value) => onChange("companyName", value)} placeholder="Taiwan Semiconductor" />
        <InputField label="Fecha" value={form.date} onChange={(value) => onChange("date", value)} type="date" />
        <NumericInput label="Precio de mercado" value={form.price} onChange={(value) => onChange("price", value)} />
      </Grid>

      <SectionTitle number="1" title="Balance Sheet" />
      <Grid>
        <NumericInput label="Total Assets" value={form.totalAssets} onChange={(value) => onChange("totalAssets", value)} />
        <NumericInput label="Current Assets" value={form.currentAssets} onChange={(value) => onChange("currentAssets", value)} />
        <NumericInput label="Inventory" value={form.inventory} onChange={(value) => onChange("inventory", value)} />
        <NumericInput label="Total Liabilities" value={form.totalLiabilities} onChange={(value) => onChange("totalLiabilities", value)} />
        <NumericInput label="Current Liabilities" value={form.currentLiabilities} onChange={(value) => onChange("currentLiabilities", value)} />
        <NumericInput label="Equity" value={form.equity} onChange={(value) => onChange("equity", value)} />
        <NumericInput label="Goodwill + Intangibles" value={form.intangiblesTotal} onChange={(value) => onChange("intangiblesTotal", value)} />
        <NumericInput label="Net Tangible Assets override" value={form.netTangibleAssets} onChange={(value) => onChange("netTangibleAssets", value)} />
        <NumericInput label="Shares Outstanding" value={form.sharesOutstanding} onChange={(value) => onChange("sharesOutstanding", value)} />
      </Grid>

      <SectionTitle number="2" title="Income Statement" />
      <Grid>
        <NumericInput label="Revenue" value={form.revenue} onChange={(value) => onChange("revenue", value)} />
        <NumericInput label="Gross Profit" value={form.grossProfit} onChange={(value) => onChange("grossProfit", value)} />
        <NumericInput label="Operating Income" value={form.operatingIncome} onChange={(value) => onChange("operatingIncome", value)} />
        <NumericInput label="EBIT" value={form.ebit} onChange={(value) => onChange("ebit", value)} />
        <NumericInput label="Interest Expense" value={form.interestExpense} onChange={(value) => onChange("interestExpense", value)} />
        <NumericInput label="Net Income" value={form.netIncome} onChange={(value) => onChange("netIncome", value)} />
        <NumericInput label="EPS TTM" value={form.epsTTM} onChange={(value) => onChange("epsTTM", value)} />
      </Grid>

      <SectionTitle number="3" title="EPS historico" subtitle="Ordenado del mas reciente al mas antiguo." />
      <Grid>
        {[1, 2, 3, 4, 5].map((index) => {
          const yearVal = form[`epsYear${index}`];
          const epsLabel = yearVal ? `EPS ${yearVal}` : `EPS ${index}`;
          return (
            <div key={index} style={{ display: "grid", gridTemplateColumns: "0.75fr 1fr", gap: 8 }}>
              <InputField label={`Año ${index}`} value={yearVal} onChange={(value) => onChange(`epsYear${index}`, value)} placeholder="2024" />
              <NumericInput label={epsLabel} value={form[`eps${index}`]} onChange={(value) => onChange(`eps${index}`, value)} />
            </div>
          );
        })}
      </Grid>

      <SectionTitle number="4" title="Cash Flow" />
      <Grid>
        <NumericInput label="Operating CF" value={form.operatingCF} onChange={(value) => onChange("operatingCF", value)} />
        <NumericInput label="Investing CF" value={form.investingCF} onChange={(value) => onChange("investingCF", value)} />
        <NumericInput label="Financing CF" value={form.financingCF} onChange={(value) => onChange("financingCF", value)} />
      </Grid>

      <SectionTitle number="5" title="ADR / ADS" />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 220px) minmax(160px, 220px)", gap: 12, alignItems: "end" }}>
        <label style={{ display: "flex", gap: 10, alignItems: "center", color: SURFACE.text, padding: "10px 0" }}>
          <input type="checkbox" checked={form.isADR} onChange={(event) => onChange("isADR", event.target.checked)} />
          Es ADR / ADS
        </label>
        <NumericInput label="ADR ratio" value={form.adrRatio} onChange={(value) => onChange("adrRatio", value)} allowNegative={false} />
      </div>

      <SectionTitle number="6" title="Notas" />
      <textarea
        value={form.notes}
        onChange={(event) => onChange("notes", event.target.value)}
        rows={3}
        style={{ width: "100%", resize: "vertical", background: SURFACE.panel, color: SURFACE.text, border: `1px solid ${SURFACE.border}`, borderRadius: 8, padding: 11 }}
      />
    </div>
  );
}

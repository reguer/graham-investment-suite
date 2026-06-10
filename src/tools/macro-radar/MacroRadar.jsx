import { useState } from "react";
import NumericInput from "../../components/ui/NumericInput.jsx";
import Dot from "../../components/ui/Dot.jsx";
import { SURFACE } from "../../lib/colors.js";
import { macroIndicators } from "./indicators.js";
import { alertForIndicator } from "./alertRules.js";

export default function MacroRadar() {
  const [indicators, setIndicators] = useState(macroIndicators);

  function updateIndicator(id, field, value) {
    setIndicators((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  return (
    <section>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0 }}>Macro Radar</h1>
        <p style={{ margin: "5px 0 0", color: SURFACE.muted }}>Placeholder funcional para migrar el artifact macro_radar.jsx cuando este disponible.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {indicators.map((indicator) => {
          const color = alertForIndicator(indicator);
          return (
            <article key={indicator.id} style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.panel, borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Dot color={color} />
                <strong>{indicator.label}</strong>
              </div>
              <NumericInput label="Valor actual" value={indicator.value} onChange={(value) => updateIndicator(indicator.id, "value", value)} />
              <label style={{ display: "grid", gap: 6, marginTop: 10 }}>
                <span style={{ color: SURFACE.muted, fontSize: 12 }}>Tendencia</span>
                <select
                  value={indicator.trend}
                  onChange={(event) => updateIndicator(indicator.id, "trend", event.target.value)}
                  style={{ background: SURFACE.page, color: SURFACE.text, border: `1px solid ${SURFACE.border}`, borderRadius: 8, padding: 10 }}
                >
                  <option value="up">Subiendo</option>
                  <option value="neutral">Neutral</option>
                  <option value="down">Bajando</option>
                </select>
              </label>
              <p style={{ color: SURFACE.muted, fontSize: 12, margin: "10px 0 0" }}>{indicator.threshold}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

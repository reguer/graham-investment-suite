import Dot from "../../components/ui/Dot.jsx";
import { AC, SURFACE } from "../../lib/colors.js";

export default function InterpretationPanel({ checks, aiText, aiError, aiLoading, onRequestAI }) {
  const hasAnthropicApiKey = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.9fr) minmax(280px, 1.1fr)", gap: 14 }}>
      <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, padding: 14, background: "#0b1020" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Checklist Graham</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {checks.map((check) => (
            <div key={check.id} style={{ display: "grid", gridTemplateColumns: "14px 1fr", gap: 8, alignItems: "start" }}>
              <Dot color={check.pass ? AC.green : AC.red} />
              <div>
                <div style={{ color: SURFACE.text, fontSize: 13 }}>{check.label}</div>
                <div style={{ color: SURFACE.muted, fontSize: 11 }}>{check.ref}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, padding: 14, background: "#0b1020" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Analisis IA</h3>
          <button
            type="button"
            onClick={onRequestAI}
            disabled={aiLoading}
            style={{ border: "1px solid rgba(56, 189, 248, 0.45)", background: "rgba(56, 189, 248, 0.12)", color: "#bae6fd", borderRadius: 8, padding: "9px 12px", opacity: aiLoading ? 0.65 : 1 }}
          >
            {aiLoading ? "Generando..." : "Generar IA"}
          </button>
        </div>
        {!hasAnthropicApiKey ? (
          <div style={{ display: "inline-block", color: AC.yellow, border: `1px solid ${AC.yellow}`, background: "rgba(245, 158, 11, 0.08)", borderRadius: 6, padding: "4px 7px", fontSize: 11, marginBottom: 10 }}>
            VITE_ANTHROPIC_API_KEY no configurada — ver .env.example
          </div>
        ) : null}
        {aiError ? <div style={{ color: "#fecaca", marginBottom: 10 }}>{aiError}</div> : null}
        <pre style={{ whiteSpace: "pre-wrap", margin: 0, color: aiText ? SURFACE.text : SURFACE.muted, fontFamily: "Instrument Sans, sans-serif", lineHeight: 1.55 }}>
          {aiText || "La interpretacion por reglas ya esta en el checklist. La IA requiere entorno compatible o VITE_ANTHROPIC_API_KEY."}
        </pre>
      </div>
    </div>
  );
}

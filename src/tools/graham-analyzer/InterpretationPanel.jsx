import Dot from "../../components/ui/Dot.jsx";
import { AC, SURFACE } from "../../lib/colors.js";

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="5" fill="none" stroke={AC.blueText} strokeWidth="2" strokeDasharray="20 12" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" values="0 7 7;360 7 7" dur="0.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function formatAiError(message) {
  if (!message) return "";
  const lower = message.toLowerCase();
  if (lower.includes("api_key") || lower.includes("api key") || lower.includes("authentication") || lower.includes("401") || lower.includes("403"))
    return "API key no válida o no configurada. Revisa VITE_ANTHROPIC_API_KEY en .env.";
  if (lower.includes("rate") || lower.includes("429"))
    return "Límite de llamadas alcanzado. Espera un momento e inténtalo de nuevo.";
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("aborted"))
    return "Tiempo de espera agotado. Verifica tu conexión e inténtalo de nuevo.";
  if (lower.includes("failed to fetch") || lower.includes("network") || lower.includes("cors"))
    return "Error de red. Verifica tu conexión a Internet o la configuración CORS.";
  if (lower.includes("500") || lower.includes("502") || lower.includes("503") || lower.includes("service unavailable"))
    return "Error del servidor de Anthropic. Inténtalo más tarde.";
  return message;
}

export default function InterpretationPanel({ checks, aiText, aiError, aiLoading, onRequestAI }) {
  const hasAnthropicApiKey = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.9fr) minmax(280px, 1.1fr)", gap: 14 }}>
      <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, padding: 14, background: SURFACE.panel }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Checklist Graham</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {checks.map((check) => (
            <div key={check.id} style={{ display: "grid", gridTemplateColumns: "14px 1fr", gap: 8, alignItems: "start" }}>
              <Dot color={check.status === "unknown" ? AC.gray : check.status === "pass" || check.pass ? AC.green : AC.red} />
              <div>
                <div style={{ color: SURFACE.text, fontSize: 13 }}>
                  {check.label}
                  {check.status === "unknown" ? <span style={{ color: SURFACE.muted, fontSize: 11, marginLeft: 6 }}>(sin datos)</span> : null}
                </div>
                <div style={{ color: SURFACE.muted, fontSize: 11 }}>{check.ref}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, padding: 14, background: SURFACE.panel }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Analisis IA</h3>
          <button
            type="button"
            onClick={onRequestAI}
            disabled={aiLoading}
            style={{
              border: "1px solid rgba(56, 189, 248, 0.45)",
              background: "rgba(56, 189, 248, 0.12)",
              color: AC.blueText,
              borderRadius: 8,
              padding: "9px 12px",
              opacity: aiLoading ? 0.65 : 1,
              cursor: aiLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            {aiLoading ? <><Spinner />Generando...</> : "Generar IA"}
          </button>
        </div>
        {!hasAnthropicApiKey ? (
          <div style={{ display: "inline-block", color: AC.yellow, border: `1px solid ${AC.yellow}`, background: "rgba(245, 158, 11, 0.08)", borderRadius: 6, padding: "4px 7px", fontSize: 11, marginBottom: 10 }}>
            VITE_ANTHROPIC_API_KEY no configurada — ver .env.example
          </div>
        ) : null}
        {aiError ? (
          <div style={{ color: AC.redText, marginBottom: 10, fontSize: 13, lineHeight: 1.5 }}>
            {formatAiError(aiError)}
          </div>
        ) : null}
        <pre style={{ whiteSpace: "pre-wrap", margin: 0, color: aiText ? SURFACE.text : SURFACE.muted, fontFamily: "Instrument Sans, sans-serif", lineHeight: 1.55 }}>
          {aiText || "La interpretacion por reglas ya esta en el checklist. La IA requiere entorno compatible o VITE_ANTHROPIC_API_KEY."}
        </pre>
      </div>
    </div>
  );
}

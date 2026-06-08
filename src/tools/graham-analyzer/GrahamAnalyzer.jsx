import { useEffect, useState } from "react";
import { AC, SURFACE } from "../../lib/colors.js";
import { generateAnalysis } from "../../lib/anthropic.js";
import { usePersistedState } from "../../hooks/usePersistedState.js";
import { useAnalysis } from "../../hooks/useAnalysis.js";
import { EMPTY_FORM } from "./constants.js";
import { prefillOptions } from "./prefills.js";
import { grahamCandidates } from "./candidates.js";
import { buildPrompt } from "./prompts.js";
import AnalysisForm from "./AnalysisForm.jsx";
import AnalysisResults from "./AnalysisResults.jsx";
import AnalysisHistory from "./AnalysisHistory.jsx";
import CandidatePanel from "./CandidatePanel.jsx";
import CandidateAnalysis from "./CandidateAnalysis.jsx";

const views = [
  { id: "input", label: "Input" },
  { id: "results", label: "Results" },
  { id: "candidates", label: "Candidatas" },
  { id: "history", label: "History" },
];

export default function GrahamAnalyzer() {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [view, setView] = useState("input");
  const [history, setHistory] = usePersistedState([]);
  const [aiText, setAiText] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saveToast, setSaveToast] = useState("");
  const analysis = useAnalysis(form);

  useEffect(() => {
    if (!saveToast) return;
    const timer = setTimeout(() => setSaveToast(""), 2200);
    return () => clearTimeout(timer);
  }, [saveToast]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveAnalysis() {
    const item = {
      id: `${Date.now()}-${form.ticker || "company"}`,
      savedAt: new Date().toISOString(),
      form,
      ratios: analysis.ratios,
      classification: analysis.classification,
      aiText,
    };
    setHistory((current) => [item, ...current].slice(0, 50));
    setSaveToast(`Análisis de ${form.ticker || "empresa"} guardado`);
    setView("history");
  }

  async function requestAI() {
    setAiLoading(true);
    setAiError("");
    try {
      const prompt = buildPrompt(form, analysis.ratios, analysis.classification);
      const text = await generateAnalysis(prompt);
      setAiText(text);
    } catch (error) {
      setAiError(error.message || "No se pudo generar el analisis IA.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <section>
      {saveToast ? (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 100,
            background: "rgba(34, 197, 94, 0.16)",
            border: `1px solid rgba(34, 197, 94, 0.45)`,
            color: AC.greenText,
            borderRadius: 8,
            padding: "12px 18px",
            fontSize: 14,
            pointerEvents: "none",
          }}
        >
          {saveToast}
        </div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0 }}>Graham Analyzer</h1>
          <p style={{ margin: "5px 0 0", color: SURFACE.muted }}>Captura manual desde Yahoo Finance, calculo automatico y lectura Graham.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              style={{
                border: `1px solid ${view === item.id ? "rgba(56, 189, 248, 0.45)" : SURFACE.border}`,
                background: view === item.id ? "rgba(56, 189, 248, 0.12)" : SURFACE.panel,
                color: view === item.id ? AC.blueText : SURFACE.text,
                borderRadius: 8,
                padding: "9px 12px",
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {view === "input" ? (
        <>
          <CandidatePanel candidates={grahamCandidates} />
          <AnalysisForm
            form={form}
            onChange={updateField}
            prefillOptions={prefillOptions}
            onPrefill={(prefill) => setForm({ ...EMPTY_FORM, ...prefill })}
            onReset={() => setForm({ ...EMPTY_FORM })}
            onAnalyze={() => setView("results")}
          />
        </>
      ) : null}

      {view === "results" ? (
        <AnalysisResults
          form={form}
          ratios={analysis.ratios}
          classification={analysis.classification}
          checks={analysis.checks}
          aiText={aiText}
          aiError={aiError}
          aiLoading={aiLoading}
          onRequestAI={requestAI}
          onSave={saveAnalysis}
        />
      ) : null}

      {view === "candidates" ? <CandidateAnalysis candidates={grahamCandidates} /> : null}

      {view === "history" ? (
        <AnalysisHistory
          history={history}
          onLoad={(item) => {
            setForm(item.form);
            setAiText(item.aiText || "");
            setView("results");
          }}
          onClear={() => setHistory([])}
        />
      ) : null}
    </section>
  );
}

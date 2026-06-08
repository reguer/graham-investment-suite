import { useEffect, useState } from "react";
import { SURFACE } from "../../lib/colors.js";
import { generateAnalysis } from "../../lib/anthropic.js";
import { usePersistedState } from "../../hooks/usePersistedState.js";
import { useAnalysis } from "../../hooks/useAnalysis.js";
import { EMPTY_FORM } from "./constants.js";
import { prefillOptions } from "./prefills.js";
import { buildPrompt } from "./prompts.js";
import AnalysisForm from "./AnalysisForm.jsx";
import AnalysisResults from "./AnalysisResults.jsx";
import AnalysisHistory from "./AnalysisHistory.jsx";
import CandidatePanel from "./CandidatePanel.jsx";
import CandidateAnalysis from "./CandidateAnalysis.jsx";
import { screenWatchlist, summarizeScreen } from "../watchlist/screen.js";
import { watchlist } from "../watchlist/watchlist.js";

const views = [
  { id: "input", label: "Input" },
  { id: "results", label: "Results" },
  { id: "candidates", label: "Candidatas" },
  { id: "history", label: "History" },
];

export default function GrahamAnalyzer({ manualDraft = null, onManualDraftLoaded }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [view, setView] = useState("input");
  const [history, setHistory] = usePersistedState([]);
  const [aiText, setAiText] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const analysis = useAnalysis(form);
  const screened = screenWatchlist(watchlist);
  const summary = summarizeScreen(screened);
  const candidateOpportunities = [...summary.approved, ...summary.near]
    .filter((item) => item.ratios)
    .map((item) => ({
      ticker: item.ticker,
      companyName: item.companyName,
      sector: item.sector || item.market || "",
      price: item.livePrice ?? item.price,
      pe: item.ratios.pe,
      pb: item.ratios.pb,
      pePb: item.ratios.pePb,
      debtRatio: item.ratios.debtRatio,
      currentRatio: item.ratios.currentRatio,
      quickRatio: item.ratios.quickRatio,
      fcf: item.ratios.fcf,
      epsAllPositive: item.ratios.epsAllPositive,
      source: item.source || "watchlist",
      sourceDate: item.sourceDate || "",
      note: item.watchReason || item.notes,
    }));
  const hasInputData = Boolean(form.ticker || form.companyName || form.price || form.epsTTM);

  useEffect(() => {
    if (!manualDraft) return;
    setForm({
      ...EMPTY_FORM,
      ticker: manualDraft.ticker || "",
      companyName: manualDraft.companyName || "",
      date: new Date().toISOString().slice(0, 10),
      price: manualDraft.livePrice ? String(manualDraft.livePrice) : manualDraft.price ? String(manualDraft.price) : "",
      notes: `Captura manual solicitada desde Watchlist. Fuente sugerida: Yahoo Finance. Razon actual: ${manualDraft.watchReason || manualDraft.notes || "pendiente de fundamentales"}`,
    });
    setView("input");
    onManualDraftLoaded?.();
  }, [manualDraft, onManualDraftLoaded]);

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
                background: view === item.id ? "rgba(56, 189, 248, 0.12)" : "#0b1020",
                color: view === item.id ? "#bae6fd" : SURFACE.text,
                borderRadius: 8,
                padding: "9px 12px",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {view === "input" ? (
        <>
          <CandidatePanel candidates={candidateOpportunities} />
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

      {view === "results" && !hasInputData ? (
        <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "#0b1020", padding: 18 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>Sin datos para mostrar resultados</h2>
          <p style={{ margin: 0, color: SURFACE.muted }}>
            Captura una empresa en Input o usa un prefill antes de abrir Results. No se calculan ratios Graham con campos vacios.
          </p>
        </div>
      ) : null}

      {view === "results" && hasInputData ? (
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

      {view === "candidates" ? <CandidateAnalysis candidates={candidateOpportunities} /> : null}

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

import { useMemo, useState } from "react";
import Dot from "../../components/ui/Dot.jsx";
import MetricCard from "../../components/ui/MetricCard.jsx";
import NumericInput from "../../components/ui/NumericInput.jsx";
import { AC, SURFACE } from "../../lib/colors.js";
import { fmt } from "../../lib/formatters.js";
import { classify } from "./classify.js";
import { getChecks } from "./getChecks.js";

function buildRatios(candidate, price) {
  const epsAdj = candidate.price / candidate.pe;
  const bvps = candidate.price / candidate.pb;
  const pe = price / epsAdj;
  const pb = price / bvps;
  const pePb = pe * pb;

  return {
    pe,
    pb,
    pePb,
    debtRatio: candidate.debtRatio,
    currentRatio: candidate.currentRatio,
    quickRatio: candidate.quickRatio,
    fcf: candidate.fcf,
    epsAllPositive: candidate.epsAllPositive,
    epsGrowing: null,
    roe: null,
    roa: null,
    tie: null,
    epsAdj,
    bvps,
    price,
  };
}

export default function CandidateAnalysis({ candidates }) {
  const [selectedTicker, setSelectedTicker] = useState(candidates[0]?.ticker ?? "");
  const [priceByTicker, setPriceByTicker] = useState(
    Object.fromEntries(candidates.map((candidate) => [candidate.ticker, String(candidate.price)])),
  );

  const selected = candidates.find((candidate) => candidate.ticker === selectedTicker) ?? candidates[0];
  const price = Number(priceByTicker[selected.ticker] || selected.price);
  const ratios = useMemo(() => buildRatios(selected, price), [selected, price]);
  const classification = useMemo(() => classify(ratios), [ratios]);
  const checks = useMemo(() => getChecks(ratios).filter((check) => ["pe", "pb", "pePb", "debt", "current", "quick", "fcf", "eps"].includes(check.id)), [ratios]);

  function updatePrice(value) {
    setPriceByTicker((current) => ({ ...current, [selected.ticker]: value }));
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 280px) minmax(0, 1fr)", gap: 14 }}>
      <aside style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "rgba(15, 23, 42, 0.35)", padding: 10 }}>
        <div style={{ color: SURFACE.muted, fontSize: 12, margin: "0 0 8px 2px" }}>Selecciona compania</div>
        <div style={{ display: "grid", gap: 7 }}>
          {candidates.map((candidate) => {
            const active = candidate.ticker === selected.ticker;
            return (
              <button
                key={candidate.ticker}
                type="button"
                onClick={() => setSelectedTicker(candidate.ticker)}
                style={{
                  textAlign: "left",
                  border: `1px solid ${active ? "rgba(34, 197, 94, 0.45)" : SURFACE.border}`,
                  background: active ? "rgba(34, 197, 94, 0.12)" : "#0b1020",
                  color: SURFACE.text,
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                  <Dot color={AC.green} />
                  {candidate.ticker}
                </div>
                <div style={{ color: SURFACE.muted, fontSize: 12, marginTop: 3 }}>{candidate.companyName}</div>
              </button>
            );
          })}
        </div>
      </aside>

      <section style={{ display: "grid", gap: 14 }}>
        <div style={{ border: `1px solid ${classification.color}`, borderRadius: 8, background: "rgba(15, 23, 42, 0.45)", padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "start" }}>
            <div>
              <div style={{ color: SURFACE.muted, fontSize: 12 }}>{selected.ticker} · {selected.sector}</div>
              <h2 style={{ margin: "5px 0", color: classification.color, fontSize: 24 }}>{classification.label}</h2>
              <p style={{ margin: 0, color: SURFACE.text }}>{classification.reason}</p>
            </div>
            <div style={{ width: 220 }}>
              <NumericInput label="Precio para recalcular" value={priceByTicker[selected.ticker]} onChange={updatePrice} allowNegative={false} />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <MetricCard label="P/E vivo" value={fmt(ratios.pe)} color={ratios.pe <= 20 ? AC.green : AC.red} />
          <MetricCard label="P/B vivo" value={fmt(ratios.pb)} color={ratios.pb <= 2 ? AC.green : AC.red} />
          <MetricCard label="P/E x P/B vivo" value={fmt(ratios.pePb)} color={ratios.pePb <= 22.5 ? AC.green : AC.red} />
          <MetricCard label="Debt Ratio" value={fmt(ratios.debtRatio)} color={ratios.debtRatio < 1 ? AC.green : AC.red} />
          <MetricCard label="Current Ratio" value={fmt(ratios.currentRatio)} color={ratios.currentRatio >= 2 ? AC.green : AC.red} />
          <MetricCard label="Quick Ratio" value={fmt(ratios.quickRatio)} color={ratios.quickRatio >= 1 ? AC.green : AC.yellow} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.9fr) minmax(280px, 1.1fr)", gap: 14 }}>
          <article style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "#0b1020", padding: 14 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Checklist en tiempo real</h3>
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
          </article>

          <article style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "#0b1020", padding: 14 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Notas de investigacion</h3>
            <p style={{ margin: 0, color: SURFACE.text, lineHeight: 1.55 }}>{selected.note}</p>
            <div style={{ color: SURFACE.muted, fontSize: 12, marginTop: 12 }}>
              Fuente: {selected.source} · Snapshot: {selected.sourceDate}
            </div>
            <div style={{ color: SURFACE.muted, fontSize: 12, marginTop: 8 }}>
              El calculo vivo deriva EPS y BVPS desde el snapshot inicial y recalcula multiplos al cambiar el precio. Para un analisis completo, captura estados financieros actualizados en Input.
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

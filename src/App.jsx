import { lazy, Suspense, useState } from "react";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import { SURFACE } from "./lib/colors.js";

const GrahamAnalyzer = lazy(() => import("./tools/graham-analyzer/GrahamAnalyzer.jsx"));
const MacroRadar = lazy(() => import("./tools/macro-radar/MacroRadar.jsx"));
const Watchlist = lazy(() => import("./tools/watchlist/Watchlist.jsx"));
const BacktestingResults = lazy(() => import("./tools/backtesting/BacktestingResults.jsx"));

const tabs = [
  { id: "graham", label: "Graham Analyzer" },
  { id: "watchlist", label: "Watchlist" },
  { id: "backtesting", label: "Backtesting" },
  { id: "macro", label: "Macro Radar" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("graham");
  const [manualDraft, setManualDraft] = useState(null);

  function openManualCapture(company) {
    setManualDraft(company);
    setActiveTab("graham");
  }

  return (
    <div style={{ minHeight: "100vh", background: SURFACE.page, color: SURFACE.text }}>
      <Header tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 18px 48px" }}>
        <Suspense fallback={<div style={{ color: SURFACE.muted }}>Cargando...</div>}>
          {activeTab === "graham" ? <GrahamAnalyzer manualDraft={manualDraft} onManualDraftLoaded={() => setManualDraft(null)} /> : null}
          {activeTab === "watchlist" ? <Watchlist onManualCapture={openManualCapture} /> : null}
          {activeTab === "backtesting" ? <BacktestingResults /> : null}
          {activeTab === "macro" ? <MacroRadar /> : null}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

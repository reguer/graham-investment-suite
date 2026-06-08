import { useState } from "react";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import GrahamAnalyzer from "./tools/graham-analyzer/GrahamAnalyzer.jsx";
import MacroRadar from "./tools/macro-radar/MacroRadar.jsx";
import Watchlist from "./tools/watchlist/Watchlist.jsx";
import { SURFACE } from "./lib/colors.js";

const tabs = [
  { id: "graham", label: "Graham Analyzer" },
  { id: "watchlist", label: "Watchlist" },
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
        {activeTab === "graham" ? <GrahamAnalyzer manualDraft={manualDraft} onManualDraftLoaded={() => setManualDraft(null)} /> : null}
        {activeTab === "watchlist" ? <Watchlist onManualCapture={openManualCapture} /> : null}
        {activeTab === "macro" ? <MacroRadar /> : null}
      </main>
      <Footer />
    </div>
  );
}

import { SURFACE } from "../../lib/colors.js";

export default function Header({ tabs, activeTab, onTabChange }) {
  return (
    <header style={{ borderBottom: `1px solid ${SURFACE.border}`, background: "rgba(6, 9, 17, 0.94)", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 18px", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: SURFACE.text, fontWeight: 700, letterSpacing: 0, fontSize: 20 }}>Graham Investment Suite</div>
          <div style={{ color: SURFACE.muted, fontSize: 13 }}>Analisis financiero defensivo basado en Benjamin Graham</div>
        </div>
        <nav style={{ display: "flex", gap: 8 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                border: `1px solid ${activeTab === tab.id ? "rgba(34, 197, 94, 0.45)" : SURFACE.border}`,
                background: activeTab === tab.id ? "rgba(34, 197, 94, 0.12)" : "rgba(15, 23, 42, 0.75)",
                color: activeTab === tab.id ? "#bbf7d0" : SURFACE.text,
                borderRadius: 8,
                padding: "9px 12px",
                minWidth: 132,
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

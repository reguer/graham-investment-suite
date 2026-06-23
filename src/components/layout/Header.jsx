import { SURFACE } from "../../lib/colors.js";

export default function Header({ tabs, activeTab, onTabChange }) {
  return (
    <header style={{ borderBottom: `1px solid ${SURFACE.border}`, background: SURFACE.header, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(10px)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 18px", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: SURFACE.text, fontWeight: 700, letterSpacing: 0, fontSize: 20 }}>Graham Investment Suite</div>
          <div style={{ color: SURFACE.muted, fontSize: 13 }}>Analisis financiero defensivo basado en Benjamin Graham</div>
        </div>
        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                border: `1px solid ${activeTab === tab.id ? SURFACE.borderStrong : SURFACE.border}`,
                background: activeTab === tab.id ? SURFACE.activeBlue : SURFACE.navInactive,
                color: activeTab === tab.id ? SURFACE.text : SURFACE.muted,
                borderRadius: 8,
                padding: "9px 12px",
                minWidth: 132,
                boxShadow: activeTab === tab.id ? "0 0 0 1px rgba(138, 168, 255, 0.08) inset" : "none",
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

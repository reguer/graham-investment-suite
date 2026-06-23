import { SURFACE } from "../../lib/colors.js";

export default function Header({ tabs, activeTab, onTabChange }) {
  return (
    <header style={{ borderBottom: `4px solid ${SURFACE.border}`, background: SURFACE.header, position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ minHeight: 92, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "18px 24px" }}>
        <button
          type="button"
          onClick={() => onTabChange("watchlist")}
          style={{
            position: "absolute",
            left: 34,
            top: 20,
            border: `3px solid ${SURFACE.border}`,
            background: SURFACE.header,
            color: SURFACE.text,
            padding: "15px 22px",
            fontWeight: 800,
            boxShadow: `5px 5px 0 ${SURFACE.shadow}`,
          }}
        >
          {"<"} WATCHLIST
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: SURFACE.text, fontWeight: 900, letterSpacing: 8, fontSize: 28 }}>GRAHAM ANALYZER</div>
          <div style={{ color: SURFACE.text, fontSize: 11, fontWeight: 800, marginTop: 8, letterSpacing: 1.5 }}>VALUE WATCHLIST + DEFENSIVE SCREENING</div>
        </div>
      </div>
      <div style={{ borderTop: `4px solid ${SURFACE.border}`, background: SURFACE.header }}>
        <nav style={{ maxWidth: 1180, margin: "0 auto", display: "flex", gap: 30, justifyContent: "center", flexWrap: "wrap", padding: "13px 18px" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                border: 0,
                borderBottom: activeTab === tab.id ? `2px solid ${SURFACE.border}` : "2px solid transparent",
                background: "transparent",
                color: SURFACE.text,
                padding: "3px 0",
                fontSize: 12,
                fontWeight: 900,
                boxShadow: "none",
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

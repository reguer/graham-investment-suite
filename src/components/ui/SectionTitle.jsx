import { SURFACE } from "../../lib/colors.js";

export default function SectionTitle({ number, title, subtitle }) {
  return (
    <div style={{ margin: "26px 0 12px", display: "flex", gap: 12, alignItems: "baseline" }}>
      {number ? <span style={{ color: "#38bdf8", fontFamily: "IBM Plex Mono, monospace", fontWeight: 700 }}>{number}</span> : null}
      <div>
        <h2 style={{ margin: 0, fontSize: 18, letterSpacing: 0 }}>{title}</h2>
        {subtitle ? <p style={{ margin: "3px 0 0", color: SURFACE.muted, fontSize: 13 }}>{subtitle}</p> : null}
      </div>
    </div>
  );
}

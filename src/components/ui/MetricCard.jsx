import Dot from "./Dot.jsx";
import { ABG, ABR, AC, SURFACE } from "../../lib/colors.js";

function keyForColor(color) {
  return Object.entries(AC).find(([, value]) => value === color)?.[0] || "gray";
}

// `note` is the small reference line under the value (e.g. "Defensivo <= 2").
// It must NOT be named `ref`: React reserves `ref`, so a string value there is
// treated as a legacy string ref and throws under React 18, crashing the card.
export default function MetricCard({ label, value, sublabel, note, color = AC.gray }) {
  const key = keyForColor(color);
  return (
    <article style={{ background: ABG[key], border: `1px solid ${ABR[key]}`, borderRadius: 8, padding: 14, minHeight: 126 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: SURFACE.muted, fontSize: 12 }}>
        <Dot color={color} />
        <span>{label}</span>
      </div>
      <div style={{ marginTop: 10, fontFamily: "IBM Plex Mono, monospace", color: SURFACE.text, fontSize: 26, fontWeight: 600, wordBreak: "break-word" }}>
        {value}
      </div>
      {sublabel ? <div style={{ marginTop: 8, color: SURFACE.muted, fontSize: 12 }}>{sublabel}</div> : null}
      {note ? <div style={{ marginTop: 6, color: "#7dd3fc", fontSize: 11 }}>{note}</div> : null}
    </article>
  );
}

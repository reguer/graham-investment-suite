import { fmtNum } from "../../lib/formatters.js";
import { SURFACE } from "../../lib/colors.js";

export default function NumericInput({ label, value, onChange, placeholder = "", allowNegative = true }) {
  function handleChange(event) {
    const raw = event.target.value.replace(/,/g, "");
    const pattern = allowNegative ? /^-?\d*(\.\d*)?$/ : /^\d*(\.\d*)?$/;
    if (raw === "" || pattern.test(raw)) onChange(raw);
  }

  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: SURFACE.muted, fontSize: 12 }}>{label}</span>
      <input
        inputMode="decimal"
        value={fmtNum(value)}
        placeholder={placeholder}
        onChange={handleChange}
        style={{
          width: "100%",
          background: "#0b1020",
          color: SURFACE.text,
          border: `1px solid ${SURFACE.border}`,
          borderRadius: 8,
          padding: "10px 11px",
          outline: "none",
          fontFamily: "IBM Plex Mono, monospace",
        }}
      />
    </label>
  );
}

import { SURFACE } from "../../lib/colors.js";

export default function InputField({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: SURFACE.muted, fontSize: 12 }}>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: "100%",
          background: SURFACE.panel,
          color: SURFACE.text,
          border: `1px solid ${SURFACE.border}`,
          borderRadius: 8,
          padding: "10px 11px",
          outline: "none",
        }}
      />
    </label>
  );
}

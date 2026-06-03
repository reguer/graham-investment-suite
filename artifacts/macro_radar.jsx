import React, { useState } from "react";

const indicators = [
  "PMI manufactura USA",
  "PMI manufactura Mexico",
  "Curva rendimiento USA",
  "CPI USA",
  "INPC Mexico",
  "Desempleo USA",
  "Confianza consumidor"
];

export default function MacroRadarArtifact() {
  const [values, setValues] = useState(Object.fromEntries(indicators.map((name) => [name, ""])));
  return React.createElement("div", {
    style: { minHeight: "100vh", background: "#060911", color: "#e2e8f0", padding: 24, fontFamily: "system-ui, sans-serif" }
  }, [
    React.createElement("h1", { key: "h", style: { marginTop: 0 } }, "Macro Radar"),
    React.createElement("p", { key: "p", style: { color: "#94a3b8" } }, "Placeholder standalone funcional mientras se migra macro_radar.jsx original."),
    React.createElement("div", { key: "grid", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 } },
      indicators.map((name) => React.createElement("label", { key: name, style: { display: "grid", gap: 6, border: "1px solid rgba(148,163,184,.18)", borderRadius: 8, padding: 12, background: "#0b1020" } }, [
        React.createElement("span", { key: "s" }, name),
        React.createElement("input", {
          key: "i",
          value: values[name],
          onChange: (event) => setValues((current) => ({ ...current, [name]: event.target.value })),
          style: { background: "#060911", color: "#e2e8f0", border: "1px solid rgba(148,163,184,.18)", borderRadius: 8, padding: 10 }
        })
      ]))
    )
  ]);
}

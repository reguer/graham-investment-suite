import { SURFACE } from "../../lib/colors.js";

export default function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${SURFACE.border}`, color: SURFACE.muted, fontSize: 12 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px" }}>
        No es asesoria financiera. Captura manual desde Yahoo Finance; verifica magnitudes, moneda y ADR ratio antes de decidir.
      </div>
    </footer>
  );
}

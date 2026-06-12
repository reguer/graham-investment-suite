import { AC, SURFACE } from "../../lib/colors.js";
import { freshness } from "../../lib/dataProvenance.js";

const LEVEL_STYLE = {
  fresh: { color: AC.green, label: "Dato fresco" },
  aging: { color: AC.yellow, label: "Dato algo viejo" },
  stale: { color: AC.red, label: "Dato obsoleto" },
  unknown: { color: AC.gray, label: "Sin fecha de dato" },
};

// Shows how old the analyzed data is and its source, so the user never decides
// on stale numbers without knowing it.
export default function FreshnessBadge({ asOf, source, staleAfterDays = 30 }) {
  const { level, ageDays } = freshness(asOf, { staleAfterDays });
  const style = LEVEL_STYLE[level] || LEVEL_STYLE.unknown;
  const agePart = ageDays === null ? "" : ` · hace ${ageDays} día${ageDays === 1 ? "" : "s"}`;
  return (
    <span
      title={`${style.label}${asOf ? ` (${asOf})` : ""}${source ? ` · ${source}` : ""}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${style.color}`, background: SURFACE.panel, color: style.color, borderRadius: 999, padding: "3px 10px", fontSize: 12 }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: style.color }} />
      {asOf ? `Datos a ${asOf}${agePart}` : "Sin fecha de dato"}
      {source ? <span style={{ color: SURFACE.muted }}>· {source}</span> : null}
    </span>
  );
}

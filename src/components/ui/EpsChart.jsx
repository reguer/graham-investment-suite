import React from "react";
import { AC, SURFACE } from "../../lib/colors.js";

// EpsChart: a dependency-free SVG bar chart of the historical EPS series, so the
// "EPS consistency" verdict is backed by a visible trend instead of bare numbers.
// Bars are drawn chronologically (oldest → newest); negative EPS draws below the
// zero baseline in red. Entries without a numeric value are skipped (rendered as
// a gap), never plotted as zero, so missing data is not mistaken for a real value.

const WIDTH = 520;
const HEIGHT = 180;
const PAD = { top: 18, right: 12, bottom: 26, left: 12 };

function isNum(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export default function EpsChart({ history }) {
  // epsHistory comes newest-first from calcRatios; chart reads left→right oldest→newest.
  const series = [...(history || [])].reverse();
  const values = series.map((entry) => entry.value).filter(isNum);

  if (values.length < 2) {
    return (
      <div style={{ color: SURFACE.muted, fontSize: 12, padding: "8px 0" }}>
        Serie de EPS insuficiente para graficar (se necesitan al menos 2 años con dato).
      </div>
    );
  }

  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / series.length;
  const barW = Math.min(slot * 0.62, 48);

  // y of a value, and y of the zero baseline, within the plot area.
  const y = (v) => PAD.top + ((max - v) / span) * plotH;
  const zeroY = y(0);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label="Evolución histórica del EPS"
      style={{ background: SURFACE.panel, border: `1px solid ${SURFACE.border}`, borderRadius: 8, maxWidth: WIDTH }}
    >
      {/* zero baseline */}
      <line x1={PAD.left} x2={WIDTH - PAD.right} y1={zeroY} y2={zeroY} stroke={SURFACE.border} strokeWidth="1" />
      {series.map((entry, index) => {
        const cx = PAD.left + slot * index + slot / 2;
        if (!isNum(entry.value)) {
          return (
            <text key={`${entry.year}-${index}`} x={cx} y={HEIGHT - 8} textAnchor="middle" fontSize="11" fill={SURFACE.muted}>
              {entry.year}
            </text>
          );
        }
        const positive = entry.value >= 0;
        const top = positive ? y(entry.value) : zeroY;
        const barH = Math.max(Math.abs(zeroY - y(entry.value)), 1);
        const color = positive ? AC.blue : AC.red;
        return (
          <g key={`${entry.year}-${index}`}>
            <rect x={cx - barW / 2} y={top} width={barW} height={barH} rx="2" fill={color} fillOpacity="0.85" />
            <text x={cx} y={(positive ? top : top + barH) - 5} textAnchor="middle" fontSize="11" fill={SURFACE.text} fontFamily="IBM Plex Mono, monospace">
              {entry.value.toFixed(2)}
            </text>
            <text x={cx} y={HEIGHT - 8} textAnchor="middle" fontSize="11" fill={SURFACE.muted}>
              {entry.year}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

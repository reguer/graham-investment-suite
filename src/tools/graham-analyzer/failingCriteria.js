import { DEFAULT_PROFILE } from "./sectorProfiles.js";

// failingCriteria: turns a Graham verdict into an actionable reason — the concrete
// criteria a company misses, with its value vs the sector threshold (e.g.
// "P/B 3.1 > 2.0 · Deuda 1.4 > 1.0"). Replaces the generic, uninformative
// "No cumple los criterios mínimos defensivos de Graham" in the dashboard.
//
// It mirrors classify()'s gates and the same sector profile, so what it reports
// as failing is exactly what made classify withhold approval.

function isNum(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function fmt(value) {
  return isNum(value) ? Number(value).toFixed(2) : "N/D";
}

// Each criterion: label, the ratio value, the threshold, comparison, and whether
// the sector omits it. A criterion "fails" when not omitted and either the data
// is missing or the value is on the wrong side of the threshold.
export function failingCriteria(ratios, profile = DEFAULT_PROFILE) {
  const t = profile.thresholds;
  const omit = new Set(profile.omit || []);
  const pb = profile.useTangibleBook ? ratios.pbTangible : ratios.pb;
  const pePb = profile.useTangibleBook ? ratios.pePbTangible : ratios.pePb;

  const criteria = [
    { key: "pe", label: "P/E", value: ratios.pe, limit: t.peMax, op: "<=", sym: ">" },
    { key: "pb", label: profile.useTangibleBook ? "P/B tang." : "P/B", value: pb, limit: t.pbMax, op: "<=", sym: ">" },
    { key: "pePb", label: "P/E×P/B", value: pePb, limit: t.pePbMax, op: "<=", sym: ">" },
    { key: "debt", label: "Deuda", value: ratios.debtRatio, limit: t.debtMax, op: "<", sym: ">=" },
    { key: "current", label: "Corriente", value: ratios.currentRatio, limit: t.currentMin, op: ">=", sym: "<" },
  ];

  const failures = [];
  for (const c of criteria) {
    if (omit.has(c.key) || c.limit === null || c.limit === undefined) continue;
    if (!isNum(c.value)) {
      failures.push(`${c.label} N/D`);
      continue;
    }
    const v = Number(c.value);
    const ok = c.op === "<=" ? v <= c.limit : c.op === "<" ? v < c.limit : v >= c.limit;
    if (!ok) failures.push(`${c.label} ${fmt(v)} ${c.sym} ${fmt(c.limit)}`);
  }

  if (ratios.epsAllPositive !== true) failures.push("EPS no siempre positivo");
  if (ratios.hasNegativeEquity) failures.push("Patrimonio negativo");

  return failures;
}

// One-line actionable reason for the dashboard. Empty failures (i.e. it passes)
// returns a positive note instead of a list.
export function actionableReason(ratios, profile = DEFAULT_PROFILE) {
  const failures = failingCriteria(ratios, profile);
  return failures.length === 0 ? "Cumple los criterios defensivos del sector." : `Falla: ${failures.join(" · ")}`;
}

import React, { useMemo, useState } from "react";

const AC = { green: "#22c55e", yellow: "#eab308", orange: "#f97316", red: "#ef4444", gray: "#64748b" };
const emptyForm = {
  ticker: "", companyName: "", date: "", price: "", totalAssets: "", currentAssets: "", inventory: "",
  totalLiabilities: "", currentLiabilities: "", equity: "", intangiblesTotal: "", netTangibleAssets: "",
  sharesOutstanding: "", revenue: "", ebit: "", interestExpense: "", netIncome: "", epsTTM: "",
  eps1: "", epsYear1: "2025", eps2: "", epsYear2: "2024", eps3: "", epsYear3: "2023", eps4: "", epsYear4: "2022",
  operatingCF: "", investingCF: "", financingCF: "", isADR: false, adrRatio: "1", notes: ""
};
const tsm = {
  ...emptyForm, ticker: "TSM", companyName: "Taiwan Semiconductor Manufacturing", date: "2026-04-17", price: "371.00",
  totalAssets: "252557864", currentAssets: "121525973", inventory: "9172541", totalLiabilities: "80758462",
  currentLiabilities: "48469086", equity: "171799401", intangiblesTotal: "7322865", sharesOutstanding: "25932525",
  revenue: "121268841", ebit: "65393986", interestExpense: "393836", netIncome: "54046609", epsTTM: "10.55",
  eps1: "10.42", eps2: "7.11", eps3: "5.15", eps4: "6.24", isADR: true, adrRatio: "5",
  operatingCF: "72428386", investingCF: "-36434046", financingCF: "-14019249"
};

function p(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).trim().replace(/,/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;
  if (!/^-?\d*(\.\d*)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}
function fmt(value, digits = 2) {
  const parsed = p(value);
  if (parsed === null) return "—";
  if (parsed === Infinity) return "∞";
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(parsed);
}
function pct(value) {
  const parsed = p(value);
  return parsed === null ? "—" : `${fmt(parsed * 100, 1)}%`;
}
function fmtNum(value) {
  const raw = String(value ?? "").replace(/,/g, "").trim();
  if (raw === "" || raw === "-" || raw === "." || raw === "-.") return raw;
  if (!/^-?\d*(\.\d*)?$/.test(raw)) return String(value ?? "");
  const sign = raw.startsWith("-") ? "-" : "";
  const [integer, decimal] = (sign ? raw.slice(1) : raw).split(".");
  const grouped = (integer || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimal !== undefined || raw.endsWith(".") ? `${sign}${grouped}.${decimal ?? ""}` : `${sign}${grouped}`;
}
function div(a, b) {
  if (a === null || b === null || b === 0) return null;
  const result = a / b;
  return Number.isFinite(result) ? result : null;
}
function calc(form) {
  const price = p(form.price), equity = p(form.equity), shares = p(form.sharesOutstanding), epsTTM = p(form.epsTTM);
  const currentAssets = p(form.currentAssets), totalLiabilities = p(form.totalLiabilities), currentLiabilities = p(form.currentLiabilities);
  const inventory = p(form.inventory) ?? 0, totalAssets = p(form.totalAssets), revenue = p(form.revenue), netIncome = p(form.netIncome);
  const ebit = p(form.ebit), interestExpense = p(form.interestExpense), intangiblesTotal = p(form.intangiblesTotal) ?? 0;
  const netTangibleAssets = p(form.netTangibleAssets), operatingCF = p(form.operatingCF) ?? 0, investingCF = p(form.investingCF) ?? 0;
  const adrRatio = form.isADR ? p(form.adrRatio) || 1 : 1;
  const tangibleEquity = netTangibleAssets !== null && netTangibleAssets > 0 ? netTangibleAssets : equity !== null ? equity - intangiblesTotal : null;
  const epsAdj = epsTTM !== null ? epsTTM * adrRatio : null;
  const bvps = equity !== null && shares ? (equity / shares) * adrRatio : null;
  const tangibleBvps = tangibleEquity !== null && shares ? (tangibleEquity / shares) * adrRatio : null;
  const pe = epsAdj !== null && epsAdj > 0 ? div(price, epsAdj) : null;
  const pb = bvps !== null && bvps > 0 ? div(price, bvps) : null;
  const pePb = pe !== null && pb !== null ? pe * pb : null;
  const grahamFormula = pe === null || bvps === null || bvps <= 0 ? null : Math.sqrt(22.5 * epsAdj * bvps);
  const epsHistory = [1, 2, 3, 4].map((i) => ({ year: form[`epsYear${i}`], value: p(form[`eps${i}`]) })).filter((x) => x.value !== null);
  return {
    price, epsAdj, bvps, tangibleBvps, pe, pb, pePb, tangibleEquity, grahamFormula,
    currentRatio: div(currentAssets, currentLiabilities),
    quickRatio: currentAssets !== null && currentLiabilities ? div(currentAssets - inventory, currentLiabilities) : null,
    debtRatio: div(totalLiabilities, equity),
    tie: interestExpense === 0 && ebit !== null && ebit > 0 ? Infinity : div(ebit, interestExpense),
    roe: div(netIncome, equity), roa: div(netIncome, totalAssets), netMargin: div(netIncome, revenue),
    fcf: operatingCF + investingCF,
    ncav: currentAssets !== null && totalLiabilities !== null && shares ? ((currentAssets - totalLiabilities) / shares) * adrRatio : null,
    mosGraham: grahamFormula !== null && price ? (grahamFormula - price) / price : null,
    epsHistory,
    epsAllPositive: epsHistory.length > 0 && epsHistory.every((x) => x.value > 0),
    epsGrowing: epsHistory.length > 1 && epsHistory.every((x, i) => i === epsHistory.length - 1 || x.value >= epsHistory[i + 1].value)
  };
}
function classify(r) {
  if (r.pePb <= 22.5 && r.debtRatio < 1 && r.currentRatio >= 2 && r.epsAllPositive && r.pe <= 20 && r.pb <= 2) return ["APROBADA GRAHAMIANA", AC.green];
  const strong = r.roe > 0.1 && r.roa > 0.05 && r.tie > 5 && r.quickRatio >= 1 && r.fcf > 0 && r.pePb > 22.5 && r.epsAllPositive;
  if (strong && r.epsGrowing) return ["EXCELENTE, PERO CARA", AC.yellow];
  if (strong) return ["BUENA EMPRESA, SOBREVALORADA", AC.orange];
  return ["RECHAZADA", AC.red];
}
function Field({ label, value, onChange, numeric = true }) {
  return React.createElement("label", { style: { display: "grid", gap: 5, color: "#94a3b8", fontSize: 12 } }, [
    label,
    React.createElement("input", {
      key: "i", value: numeric ? fmtNum(value) : value, onChange: (e) => onChange(numeric ? e.target.value.replace(/,/g, "") : e.target.value),
      style: { background: "#0b1020", color: "#e2e8f0", border: "1px solid rgba(148,163,184,.18)", borderRadius: 8, padding: 10, fontFamily: numeric ? "monospace" : "inherit" }
    })
  ]);
}
function Card({ label, value }) {
  return React.createElement("div", { style: { border: "1px solid rgba(148,163,184,.18)", borderRadius: 8, padding: 12, background: "#0b1020" } }, [
    React.createElement("div", { key: "l", style: { color: "#94a3b8", fontSize: 12 } }, label),
    React.createElement("div", { key: "v", style: { fontFamily: "monospace", fontSize: 24, marginTop: 8 } }, value)
  ]);
}

export default function GrahamAnalyzerArtifact() {
  const [form, setForm] = useState(emptyForm);
  const ratios = useMemo(() => calc(form), [form]);
  const [label, color] = classify(ratios);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const fields = ["price", "totalAssets", "currentAssets", "inventory", "totalLiabilities", "currentLiabilities", "equity", "intangiblesTotal", "netTangibleAssets", "sharesOutstanding", "revenue", "ebit", "interestExpense", "netIncome", "epsTTM", "operatingCF", "investingCF", "financingCF"];
  return React.createElement("div", { style: { minHeight: "100vh", background: "#060911", color: "#e2e8f0", padding: 24, fontFamily: "system-ui, sans-serif" } }, [
    React.createElement("h1", { key: "h", style: { marginTop: 0 } }, "Graham Analyzer"),
    React.createElement("div", { key: "top", style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 } }, [
      React.createElement("button", { key: "demo", onClick: () => setForm(tsm) }, "Cargar TSM"),
      React.createElement("button", { key: "clear", onClick: () => setForm(emptyForm) }, "Limpiar"),
      React.createElement("label", { key: "adr", style: { display: "flex", gap: 8, alignItems: "center" } }, [React.createElement("input", { key: "c", type: "checkbox", checked: form.isADR, onChange: (e) => set("isADR", e.target.checked) }), "ADR"])
    ]),
    React.createElement("div", { key: "meta", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 14 } }, [
      React.createElement(Field, { key: "ticker", label: "Ticker", value: form.ticker, numeric: false, onChange: (v) => set("ticker", v.toUpperCase()) }),
      React.createElement(Field, { key: "company", label: "Empresa", value: form.companyName, numeric: false, onChange: (v) => set("companyName", v) }),
      React.createElement(Field, { key: "adrRatio", label: "ADR ratio", value: form.adrRatio, onChange: (v) => set("adrRatio", v) })
    ]),
    React.createElement("div", { key: "fields", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 } }, fields.map((key) => React.createElement(Field, { key, label: key, value: form[key], onChange: (v) => set(key, v) }))),
    React.createElement("h2", { key: "verdict", style: { color, marginTop: 22 } }, label),
    React.createElement("div", { key: "cards", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 } }, [
      React.createElement(Card, { key: "pe", label: "P/E", value: ratios.pe === null && ratios.epsAdj <= 0 ? "N/A (EPS negativo)" : fmt(ratios.pe) }),
      React.createElement(Card, { key: "pb", label: "P/B", value: fmt(ratios.pb) }),
      React.createElement(Card, { key: "pepb", label: "P/E x P/B", value: fmt(ratios.pePb) }),
      React.createElement(Card, { key: "current", label: "Current Ratio", value: fmt(ratios.currentRatio) }),
      React.createElement(Card, { key: "quick", label: "Quick Ratio", value: fmt(ratios.quickRatio) }),
      React.createElement(Card, { key: "tie", label: "TIE", value: fmt(ratios.tie) }),
      React.createElement(Card, { key: "roe", label: "ROE", value: pct(ratios.roe) }),
      React.createElement(Card, { key: "roa", label: "ROA", value: pct(ratios.roa) }),
      React.createElement(Card, { key: "fcf", label: "FCF", value: fmt(ratios.fcf) }),
      React.createElement(Card, { key: "gf", label: "Formula Graham", value: fmt(ratios.grahamFormula) }),
      React.createElement(Card, { key: "mos", label: "MoS Graham", value: pct(ratios.mosGraham) }),
      React.createElement(Card, { key: "ncav", label: "NCAV", value: fmt(ratios.ncav) })
    ])
  ]);
}

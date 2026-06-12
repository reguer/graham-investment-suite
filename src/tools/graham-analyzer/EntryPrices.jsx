import MetricCard from "../../components/ui/MetricCard.jsx";
import { AC } from "../../lib/colors.js";
import { fmt, pct } from "../../lib/formatters.js";
import { colorForState } from "../../lib/metricState.js";

// Entry-price targets are green when the target sits at/above the current price
// (i.e. there is margin), red otherwise. Missing data must stay gray, never red.
function targetColor(target, price) {
  return colorForState(target, (value) => (price && value >= price ? AC.green : AC.red));
}

export default function EntryPrices({ ratios }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
      <MetricCard label="P/E 15" value={fmt(ratios.pricePE15)} sublabel="EPS ajustado x 15" color={targetColor(ratios.pricePE15, ratios.price)} />
      <MetricCard label="P/B 1.5" value={fmt(ratios.pricePB15)} sublabel="BVPS ajustado x 1.5" color={targetColor(ratios.pricePB15, ratios.price)} />
      <MetricCard label="Formula Graham" value={fmt(ratios.grahamFormula)} sublabel={`MoS ${pct(ratios.mosGraham)}`} color={colorForState(ratios.mosGraham, (v) => (v > 0 ? AC.green : AC.red))} />
      <MetricCard label="Formula tangible" value={fmt(ratios.grahamFormulaTangible)} sublabel={`MoS tangible ${pct(ratios.mosGrahamTangible)}`} color={colorForState(ratios.mosGrahamTangible, (v) => (v > 0 ? AC.green : AC.red))} />
      <MetricCard label="Valor crecimiento" value={fmt(ratios.grahamGrowthValue)} sublabel={`V = EPS x (8.5 + 2g) · MoS ${pct(ratios.mosGrowth)}`} color={colorForState(ratios.mosGrowth, (v) => (v > 0 ? AC.green : AC.red))} />
      <MetricCard label="NCAV" value={fmt(ratios.ncav)} sublabel="Current Assets - Liabilities / shares x ADR" color={colorForState(ratios.ncav, (v) => (v > ratios.price ? AC.green : AC.yellow))} />
      <MetricCard label="P/B tangible 1.5" value={fmt(ratios.pricePB15Tangible)} sublabel="TBVPS ajustado x 1.5" color={targetColor(ratios.pricePB15Tangible, ratios.price)} />
    </div>
  );
}

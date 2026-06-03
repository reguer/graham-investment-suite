import MetricCard from "../../components/ui/MetricCard.jsx";
import { AC } from "../../lib/colors.js";
import { fmt, pct } from "../../lib/formatters.js";

export default function EntryPrices({ ratios }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
      <MetricCard label="P/E 15" value={fmt(ratios.pricePE15)} sublabel="EPS ajustado x 15" color={ratios.pricePE15 && ratios.pricePE15 >= ratios.price ? AC.green : AC.red} />
      <MetricCard label="P/B 1.5" value={fmt(ratios.pricePB15)} sublabel="BVPS ajustado x 1.5" color={ratios.pricePB15 && ratios.pricePB15 >= ratios.price ? AC.green : AC.red} />
      <MetricCard label="Formula Graham" value={fmt(ratios.grahamFormula)} sublabel={`MoS ${pct(ratios.mosGraham)}`} color={ratios.mosGraham > 0 ? AC.green : AC.red} />
      <MetricCard label="Formula tangible" value={fmt(ratios.grahamFormulaTangible)} sublabel={`MoS tangible ${pct(ratios.mosGrahamTangible)}`} color={ratios.mosGrahamTangible > 0 ? AC.green : AC.red} />
      <MetricCard label="NCAV" value={fmt(ratios.ncav)} sublabel="Current Assets - Liabilities / shares x ADR" color={ratios.ncav > ratios.price ? AC.green : AC.yellow} />
      <MetricCard label="P/B tangible 1.5" value={fmt(ratios.pricePB15Tangible)} sublabel="TBVPS ajustado x 1.5" color={ratios.pricePB15Tangible && ratios.pricePB15Tangible >= ratios.price ? AC.green : AC.red} />
    </div>
  );
}

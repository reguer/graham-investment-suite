import { p } from "../../lib/formatters.js";

function div(numerator, denominator) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

function grahamPrice(eps, bvps) {
  if (eps === null || bvps === null || eps <= 0 || bvps <= 0) return null;
  return Math.sqrt(22.5 * eps * bvps);
}

export function calcRatios(form) {
  const price = p(form.price);
  const totalAssets = p(form.totalAssets);
  const currentAssets = p(form.currentAssets);
  const inventory = p(form.inventory) ?? 0;
  const totalLiabilities = p(form.totalLiabilities);
  const currentLiabilities = p(form.currentLiabilities);
  const equity = p(form.equity);
  const intangiblesTotal = p(form.intangiblesTotal) ?? 0;
  const netTangibleAssets = p(form.netTangibleAssets);
  const shares = p(form.sharesOutstanding);
  const revenue = p(form.revenue);
  const ebit = p(form.ebit);
  const interestExpense = p(form.interestExpense);
  const netIncome = p(form.netIncome);
  const epsTTM = p(form.epsTTM);
  const operatingCF = p(form.operatingCF) ?? 0;
  const investingCF = p(form.investingCF) ?? 0;
  const adrRatioRaw = p(form.adrRatio);
  const adrRatio = form.isADR ? adrRatioRaw || 1 : 1;

  const tangibleEquity =
    netTangibleAssets !== null && netTangibleAssets > 0
      ? netTangibleAssets
      : equity !== null
        ? equity - intangiblesTotal
        : null;

  const epsAdj = epsTTM !== null ? epsTTM * adrRatio : null;
  const bvps = equity !== null && shares ? (equity / shares) * adrRatio : null;
  const tangibleBvps = tangibleEquity !== null && shares ? (tangibleEquity / shares) * adrRatio : null;
  const ncav = currentAssets !== null && totalLiabilities !== null && shares
    ? ((currentAssets - totalLiabilities) / shares) * adrRatio
    : null;

  const pe = epsAdj !== null && epsAdj > 0 ? div(price, epsAdj) : null;
  const pb = bvps !== null && bvps > 0 ? div(price, bvps) : null;
  const pbTangible = tangibleBvps !== null && tangibleBvps > 0 ? div(price, tangibleBvps) : null;
  const pePb = pe !== null && pb !== null ? pe * pb : null;
  const pePbTangible = pe !== null && pbTangible !== null ? pe * pbTangible : null;

  const debtRatio = div(totalLiabilities, equity);
  const currentRatio = div(currentAssets, currentLiabilities);
  const quickRatio = currentAssets !== null && currentLiabilities ? div(currentAssets - inventory, currentLiabilities) : null;
  const tie =
    interestExpense === 0 && ebit !== null && ebit > 0
      ? Infinity
      : div(ebit, interestExpense);

  const netMargin = div(netIncome, revenue);
  const roe = div(netIncome, equity);
  const roa = div(netIncome, totalAssets);
  const fcf = operatingCF + investingCF;

  const pricePE15 = epsAdj !== null && epsAdj > 0 ? epsAdj * 15 : null;
  const pricePB15 = bvps !== null && bvps > 0 ? bvps * 1.5 : null;
  const pricePB15Tangible = tangibleBvps !== null && tangibleBvps > 0 ? tangibleBvps * 1.5 : null;
  const grahamFormula = grahamPrice(epsAdj, bvps);
  const grahamFormulaTangible = grahamPrice(epsAdj, tangibleBvps);
  const mosGraham = grahamFormula !== null && price ? (grahamFormula - price) / price : null;
  const mosGrahamTangible = grahamFormulaTangible !== null && price ? (grahamFormulaTangible - price) / price : null;
  const intangibleWeight =
    equity !== null && equity !== 0 && tangibleEquity !== null ? (equity - tangibleEquity) / equity : null;

  const epsHistory = [1, 2, 3, 4, 5]
    .map((index) => ({
      year: form[`epsYear${index}`],
      value: p(form[`eps${index}`]),
    }))
    .filter((entry) => entry.value !== null);
  const epsAllPositive = epsHistory.length > 0 && epsHistory.every((entry) => entry.value > 0);
  // null = insufficient data (< 2 entries); matches secFundamentals.js contract
  const epsGrowing =
    epsHistory.length > 1
      ? epsHistory.every((entry, index) => index === epsHistory.length - 1 || entry.value >= epsHistory[index + 1].value)
      : null;
  const newest = epsHistory[0]?.value;
  const oldest = epsHistory[epsHistory.length - 1]?.value;
  const newestYear = Number(epsHistory[0]?.year) || null;
  const oldestYear = Number(epsHistory[epsHistory.length - 1]?.year) || null;
  const yearSpan = newestYear && oldestYear && newestYear > oldestYear
    ? newestYear - oldestYear
    : epsHistory.length - 1;
  const epsCagr =
    epsHistory.length > 1 && newest > 0 && oldest > 0 && yearSpan > 0
      ? Math.pow(newest / oldest, 1 / yearSpan) - 1
      : null;

  return {
    pe,
    pb,
    pbTangible,
    pePb,
    pePbTangible,
    bvps,
    tangibleBvps,
    tangibleEquity,
    debtRatio,
    currentRatio,
    quickRatio,
    tie,
    netMargin,
    roe,
    roa,
    fcf,
    pricePE15,
    pricePB15,
    pricePB15Tangible,
    grahamFormula,
    grahamFormulaTangible,
    ncav,
    mosGraham,
    mosGrahamTangible,
    intangibleWeight,
    epsHistory,
    epsGrowing,
    epsAllPositive,
    epsCagr,
    shares,
    epsAdj,
    price,
    hasNegativeEquity: equity !== null && equity < 0,
    adrRatio,
  };
}

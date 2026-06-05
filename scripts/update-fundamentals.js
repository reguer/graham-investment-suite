import { fetchYahooFundamentals, validateFundamentalCurrency, detectMagnitudeWarning } from "../src/tools/watchlist/yahooFundamentals.js";

export function parseArgs(argv) {
  const args = { expectedCurrency: "USD" };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--ticker") args.ticker = argv[index + 1];
    if (argv[index] === "--yahoo") args.yahooSymbol = argv[index + 1];
    if (argv[index] === "--expected-currency") args.expectedCurrency = argv[index + 1];
  }
  return args;
}

export async function updateFundamentals(args) {
  const symbol = args.yahooSymbol || args.ticker;
  if (!symbol) throw new Error("Falta --ticker o --yahoo");
  const data = await fetchYahooFundamentals(symbol);
  const priceCurrency = data.price?.currency;
  const financialCurrency = data.financialData?.financialCurrency;
  const currency = validateFundamentalCurrency({ priceCurrency, financialCurrency, expectedCurrency: args.expectedCurrency });
  const magnitudeWarning = detectMagnitudeWarning({
    totalCash: data.financialData?.totalCash?.raw,
    totalDebt: data.financialData?.totalDebt?.raw,
    revenue: data.financialData?.totalRevenue?.raw,
    grossProfits: data.financialData?.grossProfits?.raw,
  });
  return { symbol, currency, magnitudeWarning, raw: data };
}

const isCli = process.argv[1] && process.argv[1].endsWith("update-fundamentals.js");
if (isCli) {
  updateFundamentals(parseArgs(process.argv)).then((result) => {
    console.log(`Yahoo fundamentals: ${result.symbol}`);
    console.log(result.currency.message);
    if (result.magnitudeWarning) console.log(result.magnitudeWarning);
    if (!result.currency.ok) process.exitCode = 1;
  }).catch((error) => {
    console.error(`No se pudo actualizar fundamentales: ${error.message}`);
    console.error("Si Yahoo responde 401, usa captura manual o configura un cliente Yahoo con cookies/crumb en una fase posterior.");
    process.exit(1);
  });
}

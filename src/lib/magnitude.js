// Pure magnitude sanity check, extracted so browser-side code (validateFinancials,
// useAnalysis) can use it without importing yahooFundamentals.js — which pulls in
// the Node-only yahoo-finance2 client and would leak Node polyfills into the bundle.
export function detectMagnitudeWarning(values) {
  const numeric = Object.values(values).map(Number).filter(Number.isFinite);
  if (!numeric.length) return null;
  const max = Math.max(...numeric.map(Math.abs));
  if (max > 1_000_000_000_000) return "Magnitud muy alta: revisar si Yahoo entrego unidades completas.";
  if (max < 10_000 && numeric.length >= 4) return "Magnitud baja: revisar si los datos estan en millones/miles o faltan campos.";
  return null;
}

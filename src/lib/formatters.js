export function p(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const cleaned = value.trim().replace(/,/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;
  if (!/^-?\d*(\.\d*)?$/.test(cleaned)) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function fmt(value, digits = 2, placeholder = "—") {
  const parsed = p(value);
  if (parsed === null) return placeholder;
  if (parsed === Infinity) return "∞";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(parsed);
}

export function fmtM(value, digits = 1, placeholder = "—") {
  const parsed = p(value);
  if (parsed === null) return placeholder;
  return `${fmt(parsed / 1_000_000, digits)} M`;
}

export function pct(value, digits = 1, placeholder = "—") {
  const parsed = p(value);
  if (parsed === null) return placeholder;
  return `${fmt(parsed * 100, digits)}%`;
}

export function fmtNum(value) {
  if (value === null || value === undefined) return "";
  const raw = String(value).replace(/,/g, "").trim();
  if (raw === "" || raw === "-" || raw === "." || raw === "-.") return raw;
  if (!/^-?\d*(\.\d*)?$/.test(raw)) return String(value);

  const sign = raw.startsWith("-") ? "-" : "";
  const unsigned = sign ? raw.slice(1) : raw;
  const [integerPart, decimalPart] = unsigned.split(".");
  const integer = integerPart.replace(/^0+(?=\d)/, "") || "0";
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (raw.endsWith(".")) return `${sign}${grouped}.`;
  return decimalPart !== undefined ? `${sign}${grouped}.${decimalPart}` : `${sign}${grouped}`;
}

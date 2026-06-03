import { describe, expect, it } from "vitest";
import { fmt, fmtNum, p, pct } from "../src/lib/formatters.js";

describe("formatters", () => {
  it("parses comma strings", () => {
    expect(p("1,234.56")).toBe(1234.56);
  });

  it("parses negative comma strings", () => {
    expect(p("-1,234.56")).toBe(-1234.56);
  });

  it("does not turn empty or invalid data into misleading zeroes", () => {
    expect(p("")).toBeNull();
    expect(p(null)).toBeNull();
    expect(p(undefined)).toBeNull();
    expect(p("abc")).toBeNull();
  });

  it("formats numeric strings with commas", () => {
    expect(fmtNum("1234567")).toBe("1,234,567");
  });

  it("formats percentages coherently", () => {
    expect(pct(0.1234)).toBe("12.3%");
  });

  it("uses a controlled placeholder for null formatted values", () => {
    expect(fmt(null)).toBe("—");
  });
});

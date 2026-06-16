import { describe, it, expect } from "vitest";
import { snapshotToForm, fetchCompanyByTicker } from "../src/tools/graham-analyzer/fetchCompany.js";

describe("snapshotToForm", () => {
  const snapshot = {
    price: 100,
    epsAdj: 5,
    sourceDate: "2026-06-01",
    source: "SEC EDGAR",
    epsHistory: [
      { year: 2025, eps: 5 },
      { year: 2024, eps: 4 },
      { year: 2023, eps: 3 },
    ],
    sec: { assets: 800, currentAssets: 300, inventory: 50, liabilities: 250, currentLiabilities: 100, equity: 550, shares: 10, netIncome: 60, operatingCashFlow: 90, investingCashFlow: -20 },
  };

  it("maps balance-sheet and price fields into the form", () => {
    const form = snapshotToForm(snapshot, { ticker: "msft", companyName: "Microsoft", sector: "Technology" });
    expect(form.ticker).toBe("MSFT");
    expect(form.companyName).toBe("Microsoft");
    expect(form.sector).toBe("Technology");
    expect(form.price).toBe("100");
    expect(form.totalAssets).toBe("800");
    expect(form.equity).toBe("550");
    expect(form.sharesOutstanding).toBe("10");
    expect(form.epsTTM).toBe("5");
    expect(form.date).toBe("2026-06-01");
  });

  it("maps the EPS history newest-first with years", () => {
    const form = snapshotToForm(snapshot);
    expect(form.eps1).toBe("5");
    expect(form.epsYear1).toBe("2025");
    expect(form.eps3).toBe("3");
    expect(form.epsYear3).toBe("2023");
  });

  it("leaves unknown fields empty for manual completion", () => {
    const form = snapshotToForm({ price: 10, sec: {} });
    expect(form.revenue).toBe("");
    expect(form.interestExpense).toBe("");
  });
});

describe("fetchCompanyByTicker", () => {
  function mockFetch({ ticker = "MSFT", cik = "0000789019", sic = "7372" } = {}) {
    return async (url) => {
      if (url.includes("company_tickers")) {
        return { ok: true, json: async () => ({ "0": { ticker, cik_str: 789019, title: "MICROSOFT CORP" } }) };
      }
      if (url.includes("/submissions/")) {
        return { ok: true, json: async () => ({ sicCode: sic }) };
      }
      if (url.includes("companyfacts")) {
        return { ok: true, json: async () => ({ facts: {} }) };
      }
      return { ok: false, status: 404, statusText: "not found" };
    };
  }

  it("resolves a known ticker to a pre-filled form", async () => {
    const form = await fetchCompanyByTicker("MSFT", { fetchImpl: mockFetch(), price: 420 });
    expect(form.ticker).toBe("MSFT");
    expect(form.companyName).toBe("MICROSOFT CORP");
    expect(form.price).toBe("420");
  });

  it("throws a clear error for an unknown ticker", async () => {
    await expect(fetchCompanyByTicker("ZZZZ", { fetchImpl: mockFetch() })).rejects.toThrow(/no encontrado/);
  });

  it("rejects an empty ticker", async () => {
    await expect(fetchCompanyByTicker("", { fetchImpl: mockFetch() })).rejects.toThrow(/vac/);
  });
});

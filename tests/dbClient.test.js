import { describe, expect, it } from "vitest";
import { normalizeCompany, sqlString, upsertCompanySql } from "../scripts/db-client.js";

describe("db client", () => {
  it("normalizes a company for local db and public export", () => {
    const company = normalizeCompany({ ticker: " msft ", name: "Microsoft", tags: "core,tech" });
    expect(company.ticker).toBe("MSFT");
    expect(company.companyName).toBe("Microsoft");
    expect(company.tags).toEqual(["core", "tech"]);
  });

  it("rejects invalid tickers", () => {
    expect(() => normalizeCompany({ ticker: "bad ticker" })).toThrow("Ticker invalido");
  });

  it("escapes sql strings", () => {
    expect(sqlString("O'Reilly")).toBe("'O''Reilly'");
  });

  it("builds an upsert statement", () => {
    const sql = upsertCompanySql({ ticker: "AAPL", name: "Apple Inc." });
    expect(sql).toContain("INSERT INTO companies");
    expect(sql).toContain("ON CONFLICT (ticker)");
  });
});

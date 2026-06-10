import { describe, expect, it } from "vitest";
import { companyFromArgs, parseArgs } from "../scripts/add-company.js";

describe("add company CLI", () => {
  it("parses ticker and metadata from CLI arguments", () => {
    const args = parseArgs([
      "node",
      "add-company.js",
      "--ticker",
      "msft",
      "--name",
      "Microsoft",
      "--type",
      "EQUITY",
      "--tags",
      "manual,watch",
    ]);

    const company = companyFromArgs(args);
    expect(company.ticker).toBe("MSFT");
    expect(company.companyName).toBe("Microsoft");
    expect(company.quoteType).toBe("EQUITY");
    expect(company.tags).toEqual(["manual", "watch"]);
  });

  it("supports Yahoo symbols that differ from the display ticker", () => {
    const company = companyFromArgs({
      ticker: "SP500",
      yahoo: "^GSPC",
      name: "S&P 500",
      type: "INDEX",
      tags: "index_reference",
    });

    expect(company.ticker).toBe("SP500");
    expect(company.yahooSymbol).toBe("^GSPC");
    expect(company.validationStatus).toBe("needs_manual_review");
  });
});

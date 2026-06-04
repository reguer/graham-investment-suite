import { describe, expect, it } from "vitest";
import { fetchYahooChartQuote } from "../src/tools/watchlist/priceSources.js";

describe("price sources", () => {
  it("uses yahooSymbol aliases instead of the display ticker", async () => {
    let requestedUrl = "";
    const fetchImpl = async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        async json() {
          return {
            chart: {
              result: [{
                meta: {
                  currency: "USD",
                  symbol: "^GSPC",
                  regularMarketPrice: 100,
                  regularMarketTime: 1780600000,
                  exchangeName: "SNP",
                  fullExchangeName: "SNP",
                },
                indicators: { quote: [{ close: [100] }] },
              }],
            },
          };
        },
      };
    };

    const quote = await fetchYahooChartQuote({ ticker: "SP500", yahooSymbol: "^GSPC" }, fetchImpl);
    expect(requestedUrl).toContain("%5EGSPC");
    expect(quote.ticker).toBe("SP500");
    expect(quote.symbol).toBe("^GSPC");
    expect(quote.price).toBe(100);
  });
});

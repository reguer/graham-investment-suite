import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("watchlist quality layer labels", () => {
  it("uses a neutral quality-layer label instead of calling it Buffett", () => {
    const source = readFileSync("src/tools/watchlist/Watchlist.jsx", "utf8");

    expect(source).toContain("Capa de calidad:");
    expect(source).not.toContain("Capa Buffett:");
  });
});

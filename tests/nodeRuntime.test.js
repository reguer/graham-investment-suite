import { describe, expect, it } from "vitest";
import { findPreferredNode, REQUIRED_NODE_MAJOR } from "../scripts/node-runtime.js";

describe("node runtime", () => {
  it("requires Node 22 or newer for Yahoo ingestion", () => {
    expect(REQUIRED_NODE_MAJOR).toBe(22);
  });

  it("returns a node executable path", () => {
    expect(findPreferredNode()).toMatch(/node(\.exe)?$/i);
  });
});

import { describe, expect, it } from "vitest";
import CandidatePanel from "../src/tools/graham-analyzer/CandidatePanel.jsx";

const candidates = [{
  ticker: "KBH",
  companyName: "KB Home",
  sector: "Residential Construction",
  pe: 9.93,
  pb: 0.84,
  pePb: 8.3,
  debtRatio: 0.74,
  currentRatio: 2.2,
  note: "Fixture note",
}];

function flatten(element, acc = []) {
  if (!element || typeof element !== "object") return acc;
  acc.push(element);
  const children = element.props?.children;
  const items = Array.isArray(children) ? children : [children];
  for (const child of items) flatten(child, acc);
  return acc;
}

describe("CandidatePanel", () => {
  it("renders a desktop table and mobile cards", () => {
    const tree = CandidatePanel({ candidates });
    const nodes = flatten(tree);
    const classNames = nodes.map((node) => node.props?.className).filter(Boolean);
    const styleText = nodes.find((node) => node.type === "style")?.props?.children;

    expect(classNames).toContain("candidate-panel-table");
    expect(classNames).toContain("candidate-panel-cards");
    expect(styleText).toContain("@media (max-width: 999px)");
  });
});

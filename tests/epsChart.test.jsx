import { describe, expect, it } from "vitest";
import EpsChart from "../src/components/ui/EpsChart.jsx";

function flatten(element, acc = []) {
  if (!element || typeof element !== "object") return acc;
  acc.push(element);
  const children = element.props?.children;
  const items = (Array.isArray(children) ? children : [children]).flat(Infinity);
  for (const child of items) flatten(child, acc);
  return acc;
}

function texts(tree) {
  return flatten(tree)
    .filter((node) => node.type === "text")
    .map((node) => {
      const c = node.props?.children;
      return Array.isArray(c) ? c.join("") : String(c);
    });
}

describe("EpsChart", () => {
  const history = [
    { year: "2024", value: 4 },
    { year: "2023", value: 3 },
    { year: "2022", value: 2 },
  ];

  it("renders a bar and label per year, oldest-to-newest", () => {
    const tree = EpsChart({ history });
    expect(tree.type).toBe("svg");
    const rects = flatten(tree).filter((node) => node.type === "rect");
    expect(rects).toHaveLength(3);
    // Year labels present.
    const labels = texts(tree);
    expect(labels).toContain("2022");
    expect(labels).toContain("2024");
    // First plotted year label is the oldest (chronological order).
    const yearLabels = labels.filter((t) => /^20\d\d$/.test(t));
    expect(yearLabels[0]).toBe("2022");
  });

  it("shows a fallback message when fewer than 2 numeric points", () => {
    const tree = EpsChart({ history: [{ year: "2024", value: 4 }] });
    expect(tree.type).not.toBe("svg");
    expect(JSON.stringify(tree)).toContain("insuficiente");
  });

  it("skips entries with missing values without plotting them as zero", () => {
    const withGap = [
      { year: "2024", value: 4 },
      { year: "2023", value: null },
      { year: "2022", value: 2 },
    ];
    const tree = EpsChart({ history: withGap });
    const rects = flatten(tree).filter((node) => node.type === "rect");
    expect(rects).toHaveLength(2);
  });
});

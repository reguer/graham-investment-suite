import { describe, expect, it } from "vitest";
import { APPROVED_DECISION_STATUS, estimateMaintenanceCapex } from "../src/tools/watchlist/buffettValuation.js";

describe("estimateMaintenanceCapex", () => {
  it("uses disclosed maintenance capex when the company reports it explicitly", () => {
    const result = estimateMaintenanceCapex({
      disclosedMaintenanceCapex: { value: 55 },
      buffettSeries: {
        capex: [{ fiscalYear: 2025, value: 80 }],
        depreciationAmortization: [{ fiscalYear: 2025, value: 60 }],
        revenue: [{ fiscalYear: 2025, value: 500 }],
      },
    });

    expect(result.maintenanceCapex).toBe(55);
    expect(result.methodId).toBe("maintenance_capex.disclosed");
    expect(result.confidence).toBe("high");
  });

  it("applies the heavy-sector floor with the approved factor", () => {
    const result = estimateMaintenanceCapex({
      sector: "Utilities",
      industry: "Regulated Electric",
      buffettSeries: {
        capex: [{ fiscalYear: 2025, value: 70 }],
        depreciationAmortization: [{ fiscalYear: 2025, value: 100 }],
        revenue: [{ fiscalYear: 2025, value: 900 }],
      },
    });

    expect(result.maintenanceCapex).toBe(80);
    expect(result.capitalIntensityTag).toBe("asset_heavy");
    expect(result.methodId).toBe("maintenance_capex.asset_heavy_floor");
    expect(result.decisionStatus).toBe(APPROVED_DECISION_STATUS);
  });

  it("applies the asset-light cap with low confidence", () => {
    const result = estimateMaintenanceCapex({
      sector: "Technology",
      industry: "Software - Infrastructure",
      buffettSeries: {
        capex: [{ fiscalYear: 2025, value: 50 }],
        depreciationAmortization: [{ fiscalYear: 2025, value: 100 }],
        revenue: [{ fiscalYear: 2025, value: 1000 }],
      },
    });

    expect(result.maintenanceCapex).toBe(50);
    expect(result.capitalIntensityTag).toBe("asset_light");
    expect(result.confidence).toBe("low");
    expect(result.reason).toContain("0.6 x D&A");
  });

  it("returns null plus reason when reported capex is missing", () => {
    const result = estimateMaintenanceCapex({
      buffettSeries: {
        depreciationAmortization: [{ fiscalYear: 2025, value: 100 }],
      },
    });

    expect(result.maintenanceCapex).toBeNull();
    expect(result.methodId).toBe("maintenance_capex.insufficient_data");
    expect(result.reason).toContain("reported capex");
  });
});

export const SYSTEM_STATUSES = {
  graham_approved: {
    id: "graham_approved",
    label: "Aprobada Graham",
    group: "opportunity",
    rank: 0,
    color: "#22c55e",
  },
  near_defensive: {
    id: "near_defensive",
    label: "Cerca de rango defensivo",
    group: "opportunity",
    rank: 1,
    color: "#eab308",
  },
  excellent_expensive: {
    id: "excellent_expensive",
    label: "Excelente, pero cara",
    group: "watch",
    rank: 2,
    color: "#eab308",
  },
  good_overvalued: {
    id: "good_overvalued",
    label: "Buena empresa, sobrevalorada",
    group: "watch",
    rank: 3,
    color: "#f97316",
  },
  rejected_model: {
    id: "rejected_model",
    label: "Rechazada por modelo",
    group: "discarded",
    rank: 4,
    color: "#ef4444",
  },
  watch_observation: {
    id: "watch_observation",
    label: "En observacion",
    group: "watch",
    rank: 5,
    color: "#64748b",
  },
  pending_fundamentals: {
    id: "pending_fundamentals",
    label: "Pendiente de fundamentales",
    group: "pending",
    rank: 6,
    color: "#38bdf8",
  },
  manual_review: {
    id: "manual_review",
    label: "Revision manual",
    group: "pending",
    rank: 7,
    color: "#a78bfa",
  },
  unsupported_analysis: {
    id: "unsupported_analysis",
    label: "No soportada",
    group: "pending",
    rank: 8,
    color: "#94a3b8",
  },
  index_reference: {
    id: "index_reference",
    label: "Referencia de mercado",
    group: "reference",
    rank: 9,
    color: "#38bdf8",
  },
};

export function mapSystemStatus(item) {
  if (
    item.alertLevel === "reference" ||
    item.analysisStatus === "index_reference" ||
    item.analysisStatus === "market_reference" ||
    item.validationStatus === "index_reference" ||
    item.validationStatus === "market_reference" ||
    ["INDEX", "ETF", "FUTURE"].includes(String(item.quoteType || "").toUpperCase())
  ) {
    return SYSTEM_STATUSES.index_reference;
  }
  if (item.alertLevel === "approved" || item.classification?.id === "graham_approved") {
    return SYSTEM_STATUSES.graham_approved;
  }
  if (item.alertLevel === "near") {
    return SYSTEM_STATUSES.near_defensive;
  }
  if (item.classification?.id === "excellent_expensive") {
    return SYSTEM_STATUSES.excellent_expensive;
  }
  if (item.classification?.id === "good_overvalued") {
    return SYSTEM_STATUSES.good_overvalued;
  }
  if (item.classification?.id === "rejected" || item.classification?.label === "RECHAZADA" || item.validationStatus === "yahoo_model_rejected") {
    return SYSTEM_STATUSES.rejected_model;
  }
  if (
    item.validationStatus === "needs_manual_review" ||
    item.validationStatus === "yahoo_partial_incomplete" ||
    item.validationStatus === "source_required" ||
    item.analysisStatus === "analysis_external_pending"
  ) {
    return SYSTEM_STATUSES.manual_review;
  }
  if (String(item.analysisStatus || "").startsWith("analysis_")) {
    return SYSTEM_STATUSES.unsupported_analysis;
  }
  if (item.analysisStatus === "pending_fundamentals" || item.alertLevel === "pending") {
    return SYSTEM_STATUSES.pending_fundamentals;
  }
  return SYSTEM_STATUSES.watch_observation;
}

export function listSystemStatuses() {
  return Object.values(SYSTEM_STATUSES).sort((a, b) => a.rank - b.rank);
}

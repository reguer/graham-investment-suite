import { useMemo } from "react";
import { calcRatios } from "../tools/graham-analyzer/calcRatios.js";
import { classify } from "../tools/graham-analyzer/classify.js";
import { getChecks } from "../tools/graham-analyzer/getChecks.js";

export function useAnalysis(form) {
  const ratios = useMemo(() => calcRatios(form), [form]);
  const classification = useMemo(() => classify(ratios), [ratios]);
  const checks = useMemo(() => getChecks(ratios), [ratios]);
  return { ratios, classification, checks };
}

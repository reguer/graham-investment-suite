import { useMemo } from "react";
import { calcRatios } from "../tools/graham-analyzer/calcRatios.js";
import { classify } from "../tools/graham-analyzer/classify.js";
import { getChecks } from "../tools/graham-analyzer/getChecks.js";
import { detectSector } from "../tools/graham-analyzer/detectSector.js";
import { getSectorProfile, profileAdjustments } from "../tools/graham-analyzer/sectorProfiles.js";
import { validateFinancials } from "../lib/validateFinancials.js";

export function useAnalysis(form) {
  const validation = useMemo(() => validateFinancials(form), [form]);
  const ratios = useMemo(() => calcRatios(form), [form]);
  const profile = useMemo(
    () => getSectorProfile(detectSector({ sector: form.sector, industry: form.industry, sicCode: form.sicCode })),
    [form.sector, form.industry, form.sicCode],
  );
  const classification = useMemo(() => classify(ratios, profile), [ratios, profile]);
  const checks = useMemo(() => getChecks(ratios, profile), [ratios, profile]);
  const adjustments = useMemo(() => profileAdjustments(profile), [profile]);
  return { ratios, classification, checks, validation, profile, adjustments };
}

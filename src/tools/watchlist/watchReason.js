import { businessNoteFor } from "./notes.js";

const PROCESS_NOTE_PREFIXES = ["snapshot", "sec ", "analisis", "análisis", "pendiente", "datos incompletos", "yahoo", "fundamentales"];

function normalizeReasonPrefix(reason) {
  return String(reason || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function shouldShowWatchReason(reason) {
  const text = String(reason || "").trim();
  if (text.length <= 40) return false;
  const normalized = normalizeReasonPrefix(text);
  return !PROCESS_NOTE_PREFIXES.some((prefix) => normalized.startsWith(prefix.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
}

export function getVisibleWatchReason(result) {
  const reason = businessNoteFor(result);
  return shouldShowWatchReason(reason) ? reason : "";
}

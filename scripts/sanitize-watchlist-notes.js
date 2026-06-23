import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { businessNoteFor, isTechnicalNote } from "../src/tools/watchlist/notes.js";
import { PUBLIC_COMPANIES_PATH } from "./db-client.js";

function sanitizeRecord(record) {
  const technicalNotes = [record.autoAnalysisNote, record.watchReason, record.notes]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter(isTechnicalNote);
  const note = businessNoteFor(record);
  return {
    ...record,
    notes: note,
    watchReason: note,
    ...(technicalNotes.length ? { autoAnalysisNote: technicalNotes[0] } : {}),
  };
}

function saveRecords(records) {
  const sorted = records.sort((a, b) => a.ticker.localeCompare(b.ticker));
  writeFileSync(PUBLIC_COMPANIES_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  mkdirSync(join(process.cwd(), "public", "data"), { recursive: true });
  writeFileSync(join(process.cwd(), "public", "data", "companies.json"), `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  return sorted;
}

export function sanitizeWatchlistNotes() {
  const records = JSON.parse(readFileSync(PUBLIC_COMPANIES_PATH, "utf8"));
  const sanitized = records.map(sanitizeRecord);
  saveRecords(sanitized);
  return {
    total: sanitized.length,
    changed: sanitized.filter((item, index) => item.notes !== records[index].notes || item.watchReason !== records[index].watchReason).length,
  };
}

const isCli = process.argv[1] && process.argv[1].endsWith("sanitize-watchlist-notes.js");
if (isCli) {
  const summary = sanitizeWatchlistNotes();
  console.log(`Notas revisadas: ${summary.total}`);
  console.log(`Notas ajustadas: ${summary.changed}`);
}

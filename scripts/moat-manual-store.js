import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { normalizeMoatManualMap, normalizeMoatManualRecord } from "../src/tools/watchlist/moatManual.js";

export function getLocalMoatManualPath(rootDir = process.cwd()) {
  return resolve(rootDir, "data/local/moat-manual.private.json");
}

export function readLocalMoatManual(rootDir = process.cwd()) {
  const filePath = getLocalMoatManualPath(rootDir);
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, "utf8");
  return normalizeMoatManualMap(JSON.parse(raw || "{}"));
}

export function writeLocalMoatManual(records = {}, rootDir = process.cwd()) {
  const filePath = getLocalMoatManualPath(rootDir);
  mkdirSync(dirname(filePath), { recursive: true });
  const normalized = normalizeMoatManualMap(records);
  writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return { filePath, records: normalized };
}

export function upsertLocalMoatManual(record, rootDir = process.cwd(), updatedAt = new Date().toISOString()) {
  const normalized = normalizeMoatManualRecord({ ...record, updatedAt });
  if (!normalized.ticker) throw new Error("Falta ticker para guardar moat manual.");
  const current = readLocalMoatManual(rootDir);
  current[normalized.ticker] = normalized;
  const saved = writeLocalMoatManual(current, rootDir);
  return { filePath: saved.filePath, record: current[normalized.ticker], records: current };
}

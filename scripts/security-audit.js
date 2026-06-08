import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

export const REQUIRED_GITIGNORE_PATTERNS = [
  ".env",
  ".env.*",
  ".local_runtime/",
  ".deploy-gh-pages/",
  "data/cache/",
  "data/export/",
  "data/*.db",
  "data/*.sqlite",
  "*.pid",
  "*.log",
];

export const FORBIDDEN_TRACKED_PATTERNS = [
  /^\.env(\.|$)(?!example$)/,
  /^\.local_runtime\//,
  /^data\/cache\//,
  /^data\/export\//,
  /(^|\/).+\.pid$/,
  /(^|\/).+\.log$/,
  /(^|\/).+\.(db|sqlite)$/,
];

export function auditGitignore(content = readFileSync(".gitignore", "utf8")) {
  const missing = REQUIRED_GITIGNORE_PATTERNS.filter((pattern) => !content.split(/\r?\n/).includes(pattern));
  return { ok: missing.length === 0, missing };
}

export function auditTrackedFiles(files) {
  const forbidden = files.filter((file) => FORBIDDEN_TRACKED_PATTERNS.some((pattern) => pattern.test(file)));
  return { ok: forbidden.length === 0, forbidden };
}

export function listTrackedFiles() {
  const result = spawnSync("git", ["ls-files"], { cwd: process.cwd(), encoding: "utf8", stdio: "pipe", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

export function runSecurityAudit() {
  const gitignore = auditGitignore();
  const tracked = auditTrackedFiles(listTrackedFiles());
  return { ok: gitignore.ok && tracked.ok, gitignore, tracked };
}

const isCli = process.argv[1] && process.argv[1].endsWith("security-audit.js");
if (isCli) {
  const result = runSecurityAudit();
  if (!result.ok) {
    if (!result.gitignore.ok) console.error(`Faltan patrones .gitignore: ${result.gitignore.missing.join(", ")}`);
    if (!result.tracked.ok) console.error(`Archivos sensibles trackeados: ${result.tracked.forbidden.join(", ")}`);
    process.exit(1);
  }
  console.log("Auditoria de seguridad OK: .gitignore y archivos trackeados sin hallazgos sensibles.");
}

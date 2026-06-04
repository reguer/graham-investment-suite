import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const DEPLOY_WORKTREE = ".deploy-gh-pages";
const SECRET_PATTERNS = [
  /ghp_[A-Za-z0-9_]{20,}/,
  /gho_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]+/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /-----BEGIN (RSA |OPENSSH |)PRIVATE KEY-----/,
];

export function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
    allowDirty: argv.includes("--allow-dirty"),
  };
}

function run(command, args, options = {}) {
  const isWindowsNpm = process.platform === "win32" && command === "npm";
  const executable = isWindowsNpm ? "cmd.exe" : command;
  const commandArgs = isWindowsNpm ? ["/d", "/s", "/c", ["npm", ...args].join(" ")] : args;
  const result = spawnSync(executable, commandArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    shell: false,
  });

  if (result.error) throw result.error;

  if (result.status !== 0) {
    const detail = result.stderr || result.stdout || `${command} ${args.join(" ")}`;
    throw new Error(detail.trim());
  }

  return result.stdout || "";
}

export function assertCleanGit({ allowDirty = false } = {}) {
  if (allowDirty) return true;
  const status = run("git", ["status", "--porcelain"], { capture: true }).trim();
  if (status) throw new Error("El repo tiene cambios sin commit. Haz commit antes de deploy.");
  return true;
}

function walkFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) files.push(...walkFiles(path));
    if (stats.isFile()) files.push(path);
  }
  return files;
}

export function scanDistForSecrets(distDir = "dist") {
  if (!existsSync(distDir)) throw new Error(`No existe ${distDir}. Ejecuta npm run build.`);
  const findings = [];
  for (const file of walkFiles(distDir)) {
    const content = readFileSync(file, "utf8");
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) findings.push(file);
    }
  }
  return [...new Set(findings)];
}

function copyDir(source, target) {
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source)) {
    const sourcePath = join(source, entry);
    const targetPath = join(target, entry);
    const stats = statSync(sourcePath);
    if (stats.isDirectory()) copyDir(sourcePath, targetPath);
    if (stats.isFile()) writeFileSync(targetPath, readFileSync(sourcePath));
  }
}

export function deployPages(argv = process.argv) {
  const args = parseArgs(argv);
  const deployPath = resolve(DEPLOY_WORKTREE);
  const root = resolve(".");

  if (existsSync(deployPath)) throw new Error(`${DEPLOY_WORKTREE} ya existe. Retiralo antes de deploy.`);
  if (!deployPath.startsWith(root)) throw new Error("Worktree de deploy fuera del repo.");

  assertCleanGit({ allowDirty: args.allowDirty });

  if (args.dryRun) {
    return { ok: true, dryRun: true, deployPath, message: "Deploy validado en dry-run." };
  }

  try {
    run("npm", ["run", "build"]);
    const findings = scanDistForSecrets("dist");
    if (findings.length) throw new Error(`Posibles secretos en dist: ${findings.join(", ")}`);

    run("git", ["fetch", "origin", "gh-pages:refs/remotes/origin/gh-pages"]);
    run("git", ["worktree", "add", DEPLOY_WORKTREE, "origin/gh-pages"]);

    for (const entry of readdirSync(deployPath, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      rmSync(join(deployPath, entry.name), { recursive: true, force: true });
    }
    copyDir("dist", deployPath);
    writeFileSync(join(deployPath, ".nojekyll"), "", "utf8");

    run("git", ["-C", DEPLOY_WORKTREE, "add", "-A"]);
    const deployedStatus = run("git", ["-C", DEPLOY_WORKTREE, "status", "--porcelain"], { capture: true }).trim();
    if (!deployedStatus) return { ok: true, changed: false, deployPath, message: "gh-pages ya estaba actualizado." };

    run("git", ["-C", DEPLOY_WORKTREE, "commit", "-m", "deploy: publish pages"]);
    run("git", ["-C", DEPLOY_WORKTREE, "push", "origin", "HEAD:gh-pages"]);
    return { ok: true, changed: true, deployPath, message: "GitHub Pages publicado." };
  } finally {
    if (existsSync(deployPath)) {
      spawnSync("git", ["worktree", "remove", DEPLOY_WORKTREE], { cwd: process.cwd(), stdio: "ignore", shell: false });
    }
  }
}

const isCli = process.argv[1] && process.argv[1].endsWith("deploy-pages.js");
if (isCli) {
  try {
    const result = deployPages();
    console.log(result.message);
  } catch (error) {
    console.error(`Deploy fallido: ${error.message}`);
    process.exit(1);
  }
}

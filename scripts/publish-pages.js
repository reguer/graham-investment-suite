import { spawnSync } from "node:child_process";
import { deployPages } from "./deploy-pages.js";

const DATA_PATHS = ["data/public", "public/data", "reports/weekly"];

function run(args) {
  const result = spawnSync("git", args, { cwd: process.cwd(), encoding: "utf8", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `git ${args.join(" ")}`).trim());
  }
  return (result.stdout || "").trim();
}

export function publishDataAndDeploy({ commitMessage } = {}) {
  const statusBefore = run(["status", "--porcelain", "--", ...DATA_PATHS]);
  let committed = false;

  if (statusBefore) {
    run(["add", "--", ...DATA_PATHS]);
    const message = commitMessage || `chore(data): auto-sync dashboard update ${new Date().toISOString()}`;
    run(["commit", "-m", message]);
    run(["push", "origin", "main"]);
    committed = true;
  }

  const deployResult = deployPages([]);
  return { ok: true, committed, deployResult };
}

const isCli = process.argv[1] && process.argv[1].endsWith("publish-pages.js");
if (isCli) {
  try {
    const result = publishDataAndDeploy();
    console.log(result.committed ? "Datos sincronizados a main." : "Sin cambios de datos para commitear.");
    console.log(result.deployResult.message);
  } catch (error) {
    console.error(`Publicacion fallida: ${error.message}`);
    process.exit(1);
  }
}

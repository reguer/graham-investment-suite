import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { initRuntime } from "./init-runtime.js";

export function parseArgs(argv) {
  const args = { limit: 80, noTelegram: false, dryRun: false };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--limit") args.limit = Number(argv[index + 1] || args.limit);
    if (argv[index] === "--no-telegram") args.noTelegram = true;
    if (argv[index] === "--dry-run") args.dryRun = true;
  }
  if (!Number.isFinite(args.limit) || args.limit < 1) throw new Error("--limit debe ser mayor o igual a 1.");
  return args;
}

export function buildPipelineSteps(args) {
  const weeklyArgs = ["run", "weekly:screen"];
  if (args.noTelegram) weeklyArgs.push("--", "--no-telegram");
  return [
    { id: "universe-sync", command: "npm", args: ["run", "universe:sync"] },
    { id: "universe-refresh", command: "npm", args: ["run", "universe:refresh"] },
    { id: "fundamentals-ingest", command: "npm", args: ["run", "fundamentals:ingest", "--", "--limit", String(args.limit)] },
    { id: "weekly-screen", command: "npm", args: weeklyArgs },
  ];
}

function runStep(step) {
  const result = spawnSync(step.command, step.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "pipe",
    shell: true,
  });
  if (result.error) throw result.error;
  return {
    id: step.id,
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export function runWeeklyPipeline(argv = process.argv, { runner = runStep } = {}) {
  const args = parseArgs(argv);
  const runtime = initRuntime();
  const steps = buildPipelineSteps(args);
  const payload = {
    startedAt: new Date().toISOString(),
    device: runtime.device,
    steps: [],
    dryRun: args.dryRun,
  };

  if (args.dryRun) {
    payload.steps = steps.map((step) => ({ id: step.id, command: `${step.command} ${step.args.join(" ")}` }));
    return payload;
  }

  for (const step of steps) {
    const result = runner(step);
    payload.steps.push({
      id: result.id,
      ok: result.ok,
      status: result.status,
      stdoutTail: String(result.stdout || "").split(/\r?\n/).filter(Boolean).slice(-8),
      stderrTail: String(result.stderr || "").split(/\r?\n/).filter(Boolean).slice(-8),
    });
    if (!result.ok) {
      payload.finishedAt = new Date().toISOString();
      payload.ok = false;
      writeFileSync(join(runtime.runtimeDir, "weekly-pipeline-last.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      throw new Error(`Paso fallido: ${step.id}`);
    }
  }

  payload.finishedAt = new Date().toISOString();
  payload.ok = true;
  writeFileSync(join(runtime.runtimeDir, "weekly-pipeline-last.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

const isCli = process.argv[1] && process.argv[1].endsWith("weekly-pipeline.js");
if (isCli) {
  try {
    const result = runWeeklyPipeline();
    console.log(`Pipeline semanal OK: ${result.steps.length} pasos.`);
  } catch (error) {
    console.error(`Pipeline semanal fallo: ${error.message}`);
    process.exit(1);
  }
}

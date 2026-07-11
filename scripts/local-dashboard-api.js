import { spawn } from "node:child_process";
import { dirname } from "node:path";
import { addCompany } from "./add-company.js";
import { loadEnvLocal } from "./db-client.js";
import { normalizeMoatManualRecord } from "../src/tools/watchlist/moatManual.js";
import { exportLocalMoatManualToPublic, readLocalMoatManual, upsertLocalMoatManual } from "./moat-manual-store.js";
import { findPreferredNode } from "./node-runtime.js";

const DEFAULT_CAPTURE_TIME = "18:00";

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

export function parseCaptureTime(value = DEFAULT_CAPTURE_TIME) {
  const match = String(value || DEFAULT_CAPTURE_TIME).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error(`Hora invalida: ${value}. Usa HH:mm, por ejemplo 18:00.`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Hora invalida: ${value}. Usa HH:mm en formato 24 horas.`);
  }
  return { hours, minutes, label: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}` };
}

export function nextCaptureRun(now = new Date(), captureTime = DEFAULT_CAPTURE_TIME) {
  const { hours, minutes } = parseCaptureTime(captureTime);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

export function loadLocalDashboardConfig(env = process.env) {
  const localEnv = loadEnvLocal();
  const merged = { ...localEnv, ...env };
  const enabled = String(merged.ENABLE_DAILY_CAPTURE ?? "true").toLowerCase() !== "false";
  const captureTime = parseCaptureTime(merged.CAPTURE_LOCAL_TIME || DEFAULT_CAPTURE_TIME).label;
  return {
    dailyCaptureEnabled: enabled,
    captureTime,
    hasDatabaseUrl: Boolean(merged.DATABASE_URL),
    telegramEnabled: String(merged.ENABLE_TELEGRAM_ALERTS || "false").toLowerCase() === "true",
  };
}

function runLocalScript(script, args = [], { cwd = process.cwd(), env = process.env } = {}) {
  return new Promise((resolve) => {
    const nodePath = findPreferredNode(env);
    const child = spawn(nodePath, [script, ...args], {
      cwd,
      env: { ...env, PATH: `${dirname(nodePath)};${env.PATH || ""}` },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      resolve({ ok: false, error: error.message, stdout, stderr });
    });
    child.on("exit", (code) => {
      resolve({ ok: code === 0, code, stdout, stderr });
    });
  });
}

function enrichRunResult(result) {
  return {
    ...result,
    reportPath: result.stdout.match(/Reporte guardado: (.+)/)?.[1]?.trim() || "",
    capturePath: result.stdout.match(/Captura guardada: (.+)/)?.[1]?.trim() || "",
    analyzed: Number(result.stdout.match(/Analizadas: (\d+)/)?.[1] || 0),
    unsupported: Number(result.stdout.match(/No soportadas\/fallidas: (\d+)/)?.[1] || 0),
  };
}

async function publishAfterRefresh(result, options) {
  if (!result.ok) return result;
  const publish = await runLocalScript("scripts/publish-pages.js", [], options);
  return {
    ...result,
    publishOk: publish.ok,
    publishStdout: publish.stdout,
    publishError: publish.ok ? "" : (publish.stderr || publish.error || "Publicacion a GitHub Pages fallida.").trim(),
  };
}

export async function runCompanyCapture(options = {}) {
  const analysis = await runLocalScript("scripts/analyze-watchlist.js", ["--all"], options);
  if (!analysis.ok) return enrichRunResult(analysis);
  const report = await runLocalScript("scripts/weekly-screen.js", [], options);
  return enrichRunResult({
    ok: report.ok,
    code: report.code,
    stdout: `${analysis.stdout}\n${report.stdout}`,
    stderr: `${analysis.stderr}\n${report.stderr}`,
  });
}

export async function runPriceRefresh(options = {}) {
  const prices = await runLocalScript("scripts/refresh-universe.js", [], options);
  if (!prices.ok) return enrichRunResult(prices);
  // Best-effort: retry tickers still flagged incomplete/rejected so gaps don't
  // sit untouched between the (expensive) full "Actualizar todo" runs.
  const incompleteRetry = await runLocalScript("scripts/data-ingestion.js", [], options);
  const report = await runLocalScript("scripts/weekly-screen.js", [], options);
  return enrichRunResult({
    ok: report.ok,
    code: report.code,
    stdout: `${prices.stdout}\n${incompleteRetry.stdout}\n${report.stdout}`,
    stderr: `${prices.stderr}\n${incompleteRetry.stderr}\n${report.stderr}`,
  });
}

export async function runYahooSupplemental(options = {}) {
  const yahoo = await runLocalScript("scripts/data-ingestion.js", ["--all-unsupported"], options);
  if (!yahoo.ok) return enrichRunResult(yahoo);
  const report = await runLocalScript("scripts/weekly-screen.js", [], options);
  const enriched = enrichRunResult({
    ok: report.ok,
    code: report.code,
    stdout: `${yahoo.stdout}\n${report.stdout}`,
    stderr: `${yahoo.stderr}\n${report.stderr}`,
  });
  return {
    ...enriched,
    partial: Number(yahoo.stdout.match(/Snapshots Yahoo USD\/FX: (\d+)/)?.[1] || 0),
    skipped: Number(yahoo.stdout.match(/Omitidas por datos\/moneda: (\d+)/)?.[1] || 0),
    failed: Number(yahoo.stdout.match(/Fallidas: (\d+)/)?.[1] || 0),
  };
}

export async function runFullRefresh(options = {}) {
  const fundamentals = await runLocalScript("scripts/data-ingestion.js", ["--all"], options);
  if (!fundamentals.ok) return enrichRunResult(fundamentals);
  const notes = await runLocalScript("scripts/sanitize-watchlist-notes.js", [], options);
  if (!notes.ok) return enrichRunResult({
    ...notes,
    stdout: `${fundamentals.stdout}\n${notes.stdout}`,
    stderr: `${fundamentals.stderr}\n${notes.stderr}`,
  });
  const prices = await runLocalScript("scripts/refresh-universe.js", [], options);
  if (!prices.ok) return enrichRunResult({
    ...prices,
    stdout: `${fundamentals.stdout}\n${notes.stdout}\n${prices.stdout}`,
    stderr: `${fundamentals.stderr}\n${notes.stderr}\n${prices.stderr}`,
  });
  const report = await runLocalScript("scripts/weekly-screen.js", ["--no-telegram"], options);
  return enrichRunResult({
    ok: report.ok,
    code: report.code,
    stdout: `${fundamentals.stdout}\n${notes.stdout}\n${prices.stdout}\n${report.stdout}`,
    stderr: `${fundamentals.stderr}\n${notes.stderr}\n${prices.stderr}\n${report.stderr}`,
  });
}

export function createLocalDashboardApiPlugin() {
  let captureInProgress = false;
  let lastCapture = null;
  let timer = null;
  let scheduledNextRun = null;

  async function executeCapture(trigger) {
    if (captureInProgress) {
      return { ok: false, busy: true, error: "Ya hay una captura en proceso." };
    }
    captureInProgress = true;
    const startedAt = new Date().toISOString();
    const result = await publishAfterRefresh(await runCompanyCapture());
    lastCapture = { ...result, trigger, startedAt, finishedAt: new Date().toISOString() };
    captureInProgress = false;
    return lastCapture;
  }

  function scheduleNextCapture() {
    const config = loadLocalDashboardConfig();
    if (!config.dailyCaptureEnabled) return null;
    const nextRun = nextCaptureRun(new Date(), config.captureTime);
    const delayMs = nextRun.getTime() - Date.now();
    timer = setTimeout(async () => {
      await executeCapture("scheduled");
      scheduledNextRun = scheduleNextCapture();
    }, delayMs);
    return nextRun;
  }

  return {
    name: "graham-local-dashboard-api",
    configureServer(server) {
      scheduledNextRun = scheduleNextCapture();

      server.httpServer?.once("close", () => {
        if (timer) clearTimeout(timer);
      });

      server.middlewares.use("/api/local/capture-status", (request, response) => {
        if (request.method !== "GET") {
          sendJson(response, 405, { ok: false, error: "Metodo no permitido." });
          return;
        }
        const config = loadLocalDashboardConfig();
        if (!scheduledNextRun && config.dailyCaptureEnabled) scheduledNextRun = scheduleNextCapture();
        sendJson(response, 200, {
          ok: true,
          localApi: true,
          captureInProgress,
          lastCapture,
          ...config,
          nextScheduledCapture: config.dailyCaptureEnabled ? scheduledNextRun?.toISOString() || "" : "",
        });
      });

      server.middlewares.use("/api/local/company-capture", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { ok: false, error: "Metodo no permitido." });
          return;
        }
        const result = await executeCapture("manual");
        sendJson(response, result.ok ? 200 : result.busy ? 409 : 500, result);
      });

      server.middlewares.use("/api/local/process-companies", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { ok: false, error: "Metodo no permitido." });
          return;
        }
        const result = await executeCapture("manual-process");
        sendJson(response, result.ok ? 200 : result.busy ? 409 : 500, result);
      });

      server.middlewares.use("/api/local/update-prices", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { ok: false, error: "Metodo no permitido." });
          return;
        }
        if (captureInProgress) {
          sendJson(response, 409, { ok: false, busy: true, error: "Ya hay una captura en proceso." });
          return;
        }
        captureInProgress = true;
        const startedAt = new Date().toISOString();
        const result = await publishAfterRefresh(await runPriceRefresh());
        lastCapture = { ...result, trigger: "manual-price-refresh", startedAt, finishedAt: new Date().toISOString() };
        captureInProgress = false;
        sendJson(response, result.ok ? 200 : 500, lastCapture);
      });

      server.middlewares.use("/api/local/update-all", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { ok: false, error: "Metodo no permitido." });
          return;
        }
        if (captureInProgress) {
          sendJson(response, 409, { ok: false, busy: true, error: "Ya hay una captura en proceso." });
          return;
        }
        captureInProgress = true;
        const startedAt = new Date().toISOString();
        const result = await publishAfterRefresh(await runFullRefresh());
        lastCapture = { ...result, trigger: "manual-full-refresh", startedAt, finishedAt: new Date().toISOString() };
        captureInProgress = false;
        sendJson(response, result.ok ? 200 : 500, lastCapture);
      });

      server.middlewares.use("/api/local/yahoo-supplemental", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { ok: false, error: "Metodo no permitido." });
          return;
        }
        if (captureInProgress) {
          sendJson(response, 409, { ok: false, busy: true, error: "Ya hay una captura en proceso." });
          return;
        }
        captureInProgress = true;
        const startedAt = new Date().toISOString();
        const result = await publishAfterRefresh(await runYahooSupplemental());
        lastCapture = { ...result, trigger: "manual-yahoo-supplemental", startedAt, finishedAt: new Date().toISOString() };
        captureInProgress = false;
        sendJson(response, result.ok ? 200 : 500, lastCapture);
      });

      server.middlewares.use("/api/local/add-company", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { ok: false, error: "Metodo no permitido." });
          return;
        }
        let body = "";
        request.on("data", (chunk) => {
          body += chunk.toString();
        });
        request.on("end", () => {
          try {
            const payload = JSON.parse(body || "{}");
            const ticker = String(payload.ticker || "").trim().toUpperCase();
            if (!ticker) throw new Error("Falta ticker.");
            const result = addCompany({
              ticker,
              yahooSymbol: String(payload.yahooSymbol || ticker).trim(),
              companyName: payload.companyName || ticker,
              market: payload.market || "US",
              quoteType: payload.quoteType || "EQUITY",
              source: "dashboard-local",
              tags: ["manual-add", "pending-analysis"],
              notes: "Agregada desde dashboard local; pendiente de procesar fundamentales.",
            });
            sendJson(response, 200, { ok: true, company: result.company, publicCount: result.publicCount });
          } catch (error) {
            sendJson(response, 400, { ok: false, error: error.message });
          }
        });
      });

      server.middlewares.use("/api/local/moat-manual", async (request, response) => {
        if (request.method === "GET") {
          try {
            const query = new URL(request.url || "http://localhost/api/local/moat-manual", "http://localhost");
            const ticker = String(query.searchParams.get("ticker") || "").trim().toUpperCase();
            const records = readLocalMoatManual();
            if (ticker) {
              sendJson(response, 200, { ok: true, record: normalizeMoatManualRecord(records[ticker] || { ticker }) });
              return;
            }
            sendJson(response, 200, { ok: true, records: Object.values(records) });
          } catch (error) {
            sendJson(response, 500, { ok: false, error: error.message });
          }
          return;
        }

        if (request.method !== "POST") {
          sendJson(response, 405, { ok: false, error: "Metodo no permitido." });
          return;
        }

        let body = "";
        request.on("data", (chunk) => {
          body += chunk.toString();
        });
        request.on("end", () => {
          try {
            const payload = JSON.parse(body || "{}");
            const result = upsertLocalMoatManual(payload.record || payload);
            sendJson(response, 200, { ok: true, record: result.record, filePath: result.filePath });
          } catch (error) {
            sendJson(response, 400, { ok: false, error: error.message });
          }
        });
      });

      server.middlewares.use("/api/local/export-moat-manual", (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { ok: false, error: "Metodo no permitido." });
          return;
        }
        try {
          const result = exportLocalMoatManualToPublic();
          sendJson(response, 200, { ok: true, ...result });
        } catch (error) {
          sendJson(response, 500, { ok: false, error: error.message });
        }
      });
    },
  };
}

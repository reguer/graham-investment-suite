import { useEffect, useMemo, useState } from "react";
import Dot from "../../components/ui/Dot.jsx";
import MetricCard from "../../components/ui/MetricCard.jsx";
import { AC, SURFACE } from "../../lib/colors.js";
import { fmt, pct } from "../../lib/formatters.js";
import { buildDataIssueRows } from "./dataQuality.js";
import { DEFAULT_POSITIONS } from "./defaultPositions.js";
import { normalizeFavorites, sortFavoritesFirst, toggleFavorite, WATCHLIST_FAVORITES_KEY } from "./favorites.js";
import { businessNoteFor } from "./notes.js";
import { DEFAULT_USD_MXN, POSITIONS_STORAGE_KEY, evaluatePositions, mergePositions, normalizePositions, parseMoney } from "./positions.js";
import { screenWatchlist, summarizeScreen } from "./screen.js";
import { listSystemStatuses } from "./statusMapper.js";
import { WATCHLIST_TABLE_COLUMNS, getTableCell } from "./tableColumns.js";
import { buildWatchlist, buildWatchlistMeta, collectSectors, collectTags, fetchPublicCompanies, normalizeTags } from "./watchlist.js";

function colorFor(level) {
  if (level === "approved") return AC.green;
  if (level === "near") return AC.yellow;
  if (level === "reference") return AC.blue;
  if (level === "pending") return AC.blue;
  return AC.gray;
}

const PROCESS_NOTE_PREFIXES = ["snapshot", "sec ", "analisis", "análisis", "pendiente", "datos incompletos", "yahoo", "fundamentales"];

function normalizeReasonPrefix(reason) {
  return String(reason || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function shouldShowWatchReason(reason) {
  const text = String(reason || "").trim();
  if (text.length <= 40) return false;
  const normalized = normalizeReasonPrefix(text);
  return !PROCESS_NOTE_PREFIXES.some((prefix) => normalized.startsWith(prefix.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
}

function getVisibleWatchReason(result) {
  const reason = businessNoteFor(result);
  return shouldShowWatchReason(reason) ? reason : "";
}

export default function Watchlist({ onManualCapture }) {
  const [view, setView] = useState("opportunities");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [captureStatus, setCaptureStatus] = useState({ localApi: false, captureInProgress: false });
  const [captureMessage, setCaptureMessage] = useState("");
  const [newTicker, setNewTicker] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [publicCompanies, setPublicCompanies] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedSignal, setSelectedSignal] = useState("");
  const [sortKey, setSortKey] = useState("system");
  const [positions, setPositions] = useState([]);
  const [positionDraft, setPositionDraft] = useState({ ticker: "", shares: "", entryPriceMxn: "", notes: "" });
  const [usdMxn, setUsdMxn] = useState(String(DEFAULT_USD_MXN));
  const [selectedCompany, setSelectedCompany] = useState(null);
  const watchlist = useMemo(() => buildWatchlist(publicCompanies), [publicCompanies]);
  const watchlistMeta = useMemo(() => buildWatchlistMeta(watchlist, publicCompanies), [publicCompanies, watchlist]);
  const results = useMemo(() => screenWatchlist(watchlist), [watchlist]);
  const summary = useMemo(() => summarizeScreen(results), [results]);
  const allTags = useMemo(() => collectTags(results), [results]);
  const allSectors = useMemo(() => collectSectors(results), [results]);
  const dataIssues = useMemo(() => buildDataIssueRows(watchlist), [watchlist]);
  const activeCount = summary.approved.length + summary.near.length;
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const evaluatedPositions = useMemo(() => evaluatePositions(positions, results, { usdMxn: parseMoney(usdMxn) || DEFAULT_USD_MXN }), [positions, results, usdMxn]);
  const positionSet = useMemo(() => new Set(positions.map((item) => item.ticker)), [positions]);

  function formatMxn(value) {
    return Number.isFinite(Number(value)) ? Number(value).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }) : "N/D";
  }

  function formatQuote(value, currency) {
    return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)} ${currency || ""}`.trim() : "N/D";
  }

  function formatUpdatedAt(value) {
    if (!value) return "";
    const text = String(value);
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return value;
    const options = text.includes("T") ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" };
    return date.toLocaleString("es-MX", options);
  }

  async function loadPublicCompanies() {
    return fetchPublicCompanies(fetch, import.meta.env.BASE_URL);
  }

  async function reloadPublicCompanies() {
    const companies = await fetchPublicCompanies(fetch, import.meta.env.BASE_URL);
    setPublicCompanies(companies);
    return companies;
  }

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(WATCHLIST_FAVORITES_KEY);
      setFavorites(normalizeFavorites(JSON.parse(stored || "[]")));
      const mergedPositions = mergePositions(DEFAULT_POSITIONS, JSON.parse(window.localStorage.getItem(POSITIONS_STORAGE_KEY) || "[]"));
      setPositions(mergedPositions);
      window.localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(mergedPositions));
      setUsdMxn(window.localStorage.getItem("graham-watchlist:usd-mxn") || String(DEFAULT_USD_MXN));
    } catch {
      setFavorites([]);
      setPositions(normalizePositions(DEFAULT_POSITIONS));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPublicCompanies().then((companies) => {
      if (cancelled) return;
      setPublicCompanies(companies);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/local/capture-status")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled && payload?.localApi) setCaptureStatus(payload);
      })
      .catch(() => {
        if (!cancelled) setCaptureStatus({ localApi: false, captureInProgress: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleToggleFavorite(ticker) {
    setFavorites((current) => {
      const next = toggleFavorite(current, ticker);
      try {
        window.localStorage.setItem(WATCHLIST_FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // Favoritos siguen funcionando en memoria si localStorage falla.
      }
      return next;
    });
  }

  function savePositions(next) {
    const normalized = normalizePositions(next);
    setPositions(normalized);
    try {
      window.localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // La cartera queda en memoria si localStorage falla.
    }
  }

  function handleUsdMxnChange(value) {
    setUsdMxn(value);
    try {
      window.localStorage.setItem("graham-watchlist:usd-mxn", value);
    } catch {
      // El tipo de cambio se puede volver a capturar si el navegador bloquea localStorage.
    }
  }

  function handleAddPosition() {
    const ticker = positionDraft.ticker.trim().toUpperCase();
    const entryPriceMxn = parseMoney(positionDraft.entryPriceMxn);
    if (!ticker || entryPriceMxn === null) {
      setCaptureMessage("Para guardar posicion necesitas ticker y precio de entrada en MXN.");
      return;
    }
    const now = new Date().toISOString();
    savePositions([
      {
        ticker,
        shares: parseMoney(positionDraft.shares) ?? 0,
        entryPriceMxn,
        notes: positionDraft.notes,
        snapshotPriceMxn: null,
        createdAt: now,
        updatedAt: now,
      },
      ...positions.filter((item) => item.ticker !== ticker),
    ]);
    setPositionDraft({ ticker: "", shares: "", entryPriceMxn: "", notes: "" });
    setView("positions");
    setCaptureMessage(`${ticker} guardada en Mis posiciones.`);
  }

  function handleRemovePosition(ticker) {
    savePositions(positions.filter((item) => item.ticker !== ticker));
  }

  async function runLocalAction(endpoint, pendingText, doneText) {
    setCaptureMessage(pendingText);
    setCaptureStatus((current) => ({ ...current, captureInProgress: true }));
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "No se pudo completar la accion.");
      const companies = await reloadPublicCompanies();
      setCaptureStatus((current) => ({ ...current, captureInProgress: false, lastCapture: payload }));
      const yahooText = Number.isFinite(payload.partial) && payload.partial > 0 ? ` Parciales Yahoo: ${payload.partial}.` : "";
      setCaptureMessage(`${doneText}. Registros recargados: ${companies.length}. Analizadas: ${payload.analyzed || 0}. No soportadas/fallidas: ${payload.unsupported || 0}.${yahooText} Reporte: ${payload.reportPath || "generado"}`);
    } catch (error) {
      setCaptureStatus((current) => ({ ...current, captureInProgress: false }));
      setCaptureMessage(error.message);
    }
  }

  async function handleAddCompany() {
    const ticker = newTicker.trim().toUpperCase();
    if (!ticker) {
      setCaptureMessage("Escribe un ticker para importar.");
      return;
    }
    try {
      const response = await fetch("/api/local/add-company", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticker, yahooSymbol: ticker, companyName: newCompanyName.trim() || ticker, market: "US" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "No se pudo importar el ticker.");
      setNewTicker("");
      setNewCompanyName("");
      setCaptureMessage(`${ticker} importada. Usa "Procesar fundamentales" para intentar analizarla.`);
    } catch (error) {
      setCaptureMessage(error.message);
    }
  }

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = results.filter((result) => {
      const matchesView =
        view === "all" ||
        (view === "opportunities" && ["approved", "near"].includes(result.alertLevel)) ||
        (view === "favorites" && favoriteSet.has(result.ticker.toUpperCase())) ||
        (view === "positions" && positions.some((position) => position.ticker === result.ticker.toUpperCase())) ||
        (view === "analyzed" && result.analysisStatus === "analyzed") ||
        (view === "reference" && result.alertLevel === "reference") ||
        (view === "statuses" && result.systemStatus) ||
        (view === "discarded" && result.alertLevel === "watch") ||
        (view === "requested" && result.priority === "requested") ||
        (view === "pending" && result.alertLevel === "pending") ||
        (view === "bmv" && result.market === "BMV SIC");
      const matchesQuery =
        !normalizedQuery ||
        [result.ticker, result.yahooSymbol, result.companyName, result.sector, result.market, businessNoteFor(result), getVisibleWatchReason(result)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      const matchesTag = !selectedTag || normalizeTags(result.tags).includes(selectedTag);
      const matchesStatus = !selectedStatus || result.systemStatus?.id === selectedStatus;
      const matchesSector = !selectedSector || result.sector === selectedSector;
      const matchesSignal = !selectedSignal || result.alertLevel === selectedSignal;
      return matchesView && matchesQuery && matchesTag && matchesStatus && matchesSector && matchesSignal;
    });
    const sorted = sortFavoritesFirst(matches, favorites).sort((a, b) => {
      const positionDelta = Number(positionSet.has(b.ticker.toUpperCase())) - Number(positionSet.has(a.ticker.toUpperCase()));
      return positionDelta || 0;
    });
    const column = WATCHLIST_TABLE_COLUMNS.find((item) => item.id === sortKey);
    if (!column) return sorted;
    return [...sorted].sort((a, b) => {
      if (sortKey !== "score") {
        const positionDelta = Number(positionSet.has(b.ticker.toUpperCase())) - Number(positionSet.has(a.ticker.toUpperCase()));
        if (positionDelta) return positionDelta;
        const favoriteDelta = Number(favoriteSet.has(b.ticker.toUpperCase())) - Number(favoriteSet.has(a.ticker.toUpperCase()));
        if (favoriteDelta) return favoriteDelta;
      }
      if (sortKey === "system") return (a.systemStatus?.rank ?? 99) - (b.systemStatus?.rank ?? 99);
      if (sortKey === "score") return (b.score?.total ?? -1) - (a.score?.total ?? -1) || (a.systemStatus?.rank ?? 99) - (b.systemStatus?.rank ?? 99);
      const av = getTableCell(a, column);
      const bv = getTableCell(b, column);
      return String(av).localeCompare(String(bv), "es", { numeric: true });
    });
  }, [favoriteSet, favorites, positionSet, positions, query, results, selectedSector, selectedSignal, selectedStatus, selectedTag, sortKey, view]);

  const selectedBusinessNote = selectedCompany ? getVisibleWatchReason(selectedCompany) : "";

  return (
    <section>
      <style>{`
        .watchlist-table-shell { display: block; overflow-x: auto; border: 1px solid ${SURFACE.border}; border-radius: 8px; background: SURFACE.panel; margin-bottom: 12px; }
        .watchlist-card-list { display: none; }
        .positions-form { display: grid; grid-template-columns: minmax(90px, 120px) minmax(90px, 120px) minmax(150px, 180px) minmax(160px, 1fr) auto; gap: 8px; align-items: end; margin-bottom: 12px; }
        @media (max-width: 999px) {
          .watchlist-table-shell { display: none; }
          .watchlist-card-list { display: grid; gap: 10px; }
          .positions-form { grid-template-columns: 1fr; }
        }
      `}</style>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0 }}>Watchlist Semanal</h1>
        <p style={{ margin: "5px 0 0", color: SURFACE.muted }}>
          Radar Graham con {activeCount} oportunidades activas, {watchlistMeta.analyzedCount} analizadas, {watchlistMeta.referenceCount || 0} referencias y {watchlistMeta.publicExportCount} registros persistidos en export publico.
          {watchlistMeta.dataUpdatedAt ? (
            <> · Datos actualizados: <strong style={{ color: SURFACE.text }}>{formatUpdatedAt(watchlistMeta.dataUpdatedAt)}</strong></>
          ) : null}
        </p>
      </div>

      <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: SURFACE.panelDark, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start", marginBottom: 12 }}>
          <div>
            <strong>Mis posiciones</strong>
            <div style={{ color: SURFACE.muted, fontSize: 12, marginTop: 4 }}>
              Guarda tu entrada en MXN; cuando corra la actualizacion semanal, el precio vivo recalcula rendimiento y senal.
            </div>
          </div>
          <label style={{ display: "grid", gap: 4, color: SURFACE.muted, fontSize: 12 }}>
            USD/MXN
            <input
              value={usdMxn}
              onChange={(event) => handleUsdMxnChange(event.target.value)}
              style={{ width: 110, border: `1px solid ${SURFACE.border}`, background: SURFACE.page, color: SURFACE.text, borderRadius: 6, padding: "7px 9px" }}
            />
          </label>
        </div>
        <div className="positions-form">
          <input value={positionDraft.ticker} onChange={(event) => setPositionDraft((current) => ({ ...current, ticker: event.target.value.toUpperCase() }))} placeholder="Ticker" style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.page, color: SURFACE.text, borderRadius: 6, padding: "8px 10px" }} />
          <input value={positionDraft.shares} onChange={(event) => setPositionDraft((current) => ({ ...current, shares: event.target.value }))} placeholder="Titulos" style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.page, color: SURFACE.text, borderRadius: 6, padding: "8px 10px" }} />
          <input value={positionDraft.entryPriceMxn} onChange={(event) => setPositionDraft((current) => ({ ...current, entryPriceMxn: event.target.value }))} placeholder="Entrada MXN" style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.page, color: SURFACE.text, borderRadius: 6, padding: "8px 10px" }} />
          <input value={positionDraft.notes} onChange={(event) => setPositionDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Nota opcional" style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.page, color: SURFACE.text, borderRadius: 6, padding: "8px 10px" }} />
          <button type="button" onClick={handleAddPosition} style={{ border: `1px solid ${AC.green}`, background: SURFACE.activeGreen, color: SURFACE.text, borderRadius: 6, padding: "8px 10px", cursor: "pointer" }}>
            Guardar posicion
          </button>
        </div>
        {evaluatedPositions.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ color: SURFACE.muted, textAlign: "left" }}>
                  {["Ticker", "Empresa", "Entrada MXN", "Entrada convertida", "Precio actual MXN", "P/L", "Valor", "Senal", ""].map((label) => (
                    <th key={label} style={{ padding: "8px", borderBottom: `1px solid ${SURFACE.border}`, whiteSpace: "nowrap" }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evaluatedPositions.map((position) => {
                  const toneColor = position.recommendation.tone === "buy" ? AC.green : position.recommendation.tone === "sell" ? AC.red : position.recommendation.tone === "hold" ? AC.yellow : SURFACE.muted;
                  return (
                    <tr key={position.ticker} style={{ borderTop: `1px solid ${SURFACE.border}` }}>
                      <td style={{ padding: "8px", color: SURFACE.text, fontWeight: 700 }}>{position.ticker}</td>
                      <td style={{ padding: "8px", color: SURFACE.muted }}>{position.company?.companyName || "No encontrada en catalogo"}</td>
                      <td style={{ padding: "8px", color: SURFACE.text }}>{formatMxn(position.entryPriceMxn)}</td>
                      <td style={{ padding: "8px", color: SURFACE.muted }}>{formatQuote(position.entryPriceQuote, position.currency)}</td>
                      <td style={{ padding: "8px", color: SURFACE.text }}>{formatMxn(position.currentPriceMxn)}</td>
                      <td style={{ padding: "8px", color: position.gainPct >= 0 ? AC.greenText : AC.redText }}>{pct(position.gainPct)}</td>
                      <td style={{ padding: "8px", color: SURFACE.text }}>{formatMxn(position.marketValueMxn)}</td>
                      <td style={{ padding: "8px", color: toneColor }}>
                        <strong>{position.recommendation.action}</strong>
                        <div style={{ color: SURFACE.muted, marginTop: 3 }}>{position.recommendation.reason}</div>
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        <button type="button" onClick={() => handleRemovePosition(position.ticker)} style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.navInactive, color: SURFACE.muted, borderRadius: 6, padding: "6px 8px", cursor: "pointer" }}>
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: SURFACE.muted, fontSize: 12 }}>Aun no hay posiciones guardadas.</div>
        )}
      </div>

      <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: SURFACE.panel, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <strong>Operaciones locales</strong>
            <div style={{ color: SURFACE.muted, fontSize: 12, marginTop: 4 }}>
              {captureStatus.localApi
                ? `Automatica ${captureStatus.dailyCaptureEnabled ? "activa" : "apagada"} a las ${captureStatus.captureTime || "18:00"}.`
                : "Disponible en dashboard local."}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {captureStatus.localApi ? (
              [
                ["/api/local/update-all", "Actualizando analisis, Yahoo complementario, precios y reporte...", "Actualizacion completa", "Actualizar todo", "primary"],
                ["/api/local/update-prices", "Actualizando precios y reporte...", "Precios/reporte actualizados", "Solo precios", "secondary"],
              ].map(([endpoint, pendingText, doneText, label, kind]) => (
                <button
                  key={endpoint}
                  type="button"
                  onClick={() => runLocalAction(endpoint, pendingText, doneText)}
                  disabled={captureStatus.captureInProgress}
                  style={{
                    border: `1px solid ${kind === "primary" ? AC.green : AC.blue}`,
                    background: kind === "primary" ? SURFACE.activeGreen : SURFACE.activeBlue,
                    color: SURFACE.text,
                    borderRadius: 6,
                    padding: "9px 12px",
                    cursor: !captureStatus.captureInProgress ? "pointer" : "not-allowed",
                  }}
                >
                  {captureStatus.captureInProgress ? "Trabajando..." : label}
                </button>
              ))
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: SURFACE.muted, border: `1px solid ${SURFACE.border}`, background: SURFACE.navInactive, borderRadius: 6, padding: "9px 12px", fontSize: 13 }}>
                <span aria-hidden="true" style={{ color: AC.blue }}>ⓘ</span>
                Solo disponible en dashboard local
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 180px) minmax(180px, 1fr) auto", gap: 8, marginTop: 12 }}>
          <input value={newTicker} onChange={(event) => setNewTicker(event.target.value)} placeholder="Ticker Yahoo base" style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.page, color: SURFACE.text, borderRadius: 6, padding: "8px 10px" }} />
          <input value={newCompanyName} onChange={(event) => setNewCompanyName(event.target.value)} placeholder="Nombre opcional" style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.page, color: SURFACE.text, borderRadius: 6, padding: "8px 10px" }} />
          {captureStatus.localApi ? (
            <button type="button" onClick={handleAddCompany} style={{ border: `1px solid ${AC.green}`, background: SURFACE.activeGreen, color: SURFACE.text, borderRadius: 6, padding: "8px 10px" }}>
              Importar ticker
            </button>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, border: `1px solid ${SURFACE.border}`, background: SURFACE.navInactive, color: SURFACE.muted, borderRadius: 6, padding: "8px 10px", fontSize: 12 }}>
              <span aria-hidden="true" style={{ color: AC.blue }}>ⓘ</span>
              Solo disponible en dashboard local
            </span>
          )}
        </div>
        {captureMessage ? <div style={{ color: SURFACE.muted, fontSize: 12, marginTop: 10 }}>{captureMessage}</div> : null}
        {captureStatus.lastCapture?.finishedAt ? (
          <div style={{ color: SURFACE.muted, fontSize: 12, marginTop: 6 }}>
            Ultima captura: {captureStatus.lastCapture.finishedAt}
          </div>
        ) : null}
      </div>

      <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: SURFACE.panelDark, padding: 14, marginBottom: 16 }}>
        <strong>Estado de datos</strong>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 10, color: SURFACE.muted, fontSize: 13 }}>
          <span>Export publico: {watchlistMeta.publicExportCount} empresas</span>
          <span>Analizadas completas: {watchlistMeta.analyzedCount}</span>
          <span>Pendientes/no soportadas: {summary.pending.length}</span>
          <span>Referencias mercado: {summary.reference.length}</span>
          <span>BD local: {captureStatus.hasDatabaseUrl ? "configurada" : "no detectada"}</span>
          <span>Proxima captura local: {captureStatus.nextScheduledCapture || "sin programar"}</span>
          <span>Telegram: {captureStatus.telegramEnabled ? "habilitado" : "apagado"}</span>
        </div>
      </div>

      {dataIssues.length ? (
        <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: SURFACE.panel, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
            <strong>Fuentes pendientes</strong>
            <span style={{ color: SURFACE.muted, fontSize: 12 }}>{dataIssues.length} tickers requieren fuente o captura</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ color: SURFACE.muted, textAlign: "left" }}>
                  {["Ticker", "Yahoo", "Estado", "Fuente sugerida", "Accion", "Nota"].map((label) => (
                    <th key={label} style={{ padding: "8px", borderBottom: `1px solid ${SURFACE.border}`, whiteSpace: "nowrap" }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataIssues.slice(0, 12).map((issue) => (
                  <tr key={issue.ticker} style={{ borderTop: `1px solid ${SURFACE.border}` }}>
                    <td style={{ padding: "8px", color: issue.severity === "high" ? AC.red : AC.yellow, fontWeight: 700 }}>{issue.ticker}</td>
                    <td style={{ padding: "8px", color: SURFACE.text }}>{issue.yahooSymbol}</td>
                    <td style={{ padding: "8px", color: SURFACE.text }}>{issue.status}</td>
                    <td style={{ padding: "8px", color: SURFACE.muted }}>{issue.source}</td>
                    <td style={{ padding: "8px", color: SURFACE.text, maxWidth: 320 }}>{issue.action}</td>
                    <td style={{ padding: "8px", color: SURFACE.muted, maxWidth: 360 }}>{issue.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}



      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Aprobadas", value: summary.approved.length, color: AC.green, targetView: "opportunities" },
          { label: "Cerca", value: summary.near.length, color: AC.yellow, targetView: "opportunities" },
          { label: "Observacion", value: summary.watch.length, color: AC.gray, targetView: "discarded" },
          { label: "Referencias", value: summary.reference.length, color: AC.blue, targetView: "reference" },
          { label: "Pendientes", value: summary.pending.length, color: AC.blue, targetView: "pending" },
          { label: "Favoritos", value: favorites.length, color: AC.yellow, targetView: "favorites" },
          { label: "Posiciones", value: evaluatedPositions.length, color: AC.green, targetView: "positions" },
          { label: "Universo activo", value: activeCount, color: AC.green, targetView: "all" },
        ].map(({ label, value, color, targetView }) => (
          <button
            key={label}
            type="button"
            onClick={() => setView(targetView)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", borderRadius: 8 }}
          >
            <MetricCard label={label} value={String(value)} color={color} style={{ outline: view === targetView ? `2px solid ${color}` : undefined }} />
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          ["opportunities", "Oportunidades"],
          ["all", "Todo auditado"],
          ["favorites", "Favoritos"],
          ["positions", "Mis posiciones"],
          ["analyzed", "Analizadas"],
          ["discarded", `En observacion (${summary.watch.length})`],
          ["statuses", "Estados"],
          ["reference", "Referencias"],
          ["requested", "Lote solicitado"],
          ["pending", "Pendientes"],
          ["bmv", "BMV/SIC"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            style={{
              border: `1px solid ${view === id ? AC.blue : SURFACE.border}`,
              background: view === id ? SURFACE.activeBlue : SURFACE.navInactive,
              color: SURFACE.text,
              borderRadius: 6,
              padding: "8px 10px",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar ticker, empresa, sector"
          style={{
            minWidth: 240,
            flex: "1 1 240px",
            border: `1px solid ${SURFACE.border}`,
            background: SURFACE.panel,
            color: SURFACE.text,
            borderRadius: 6,
            padding: "8px 10px",
          }}
        />
        <select
          value={selectedSignal}
          onChange={(event) => setSelectedSignal(event.target.value)}
          style={{
            minWidth: 170,
            border: `1px solid ${SURFACE.border}`,
            background: SURFACE.panel,
            color: SURFACE.text,
            borderRadius: 6,
            padding: "8px 10px",
          }}
        >
          <option value="">Todas las senales</option>
          <option value="approved">Aprobadas</option>
          <option value="near">Cerca</option>
          <option value="watch">Observacion</option>
          <option value="pending">Pendientes</option>
          <option value="reference">Referencias</option>
        </select>
        <select
          value={selectedSector}
          onChange={(event) => setSelectedSector(event.target.value)}
          style={{
            minWidth: 220,
            border: `1px solid ${SURFACE.border}`,
            background: SURFACE.panel,
            color: SURFACE.text,
            borderRadius: 6,
            padding: "8px 10px",
          }}
        >
          <option value="">Todos los sectores</option>
          {allSectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
        </select>
        <select
          value={selectedTag}
          onChange={(event) => setSelectedTag(event.target.value)}
          style={{
            minWidth: 190,
            border: `1px solid ${SURFACE.border}`,
            background: SURFACE.panel,
            color: SURFACE.text,
            borderRadius: 6,
            padding: "8px 10px",
          }}
        >
          <option value="">Todas las etiquetas</option>
          {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
        </select>
        <select
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          style={{
            minWidth: 210,
            border: `1px solid ${SURFACE.border}`,
            background: SURFACE.panel,
            color: SURFACE.text,
            borderRadius: 6,
            padding: "8px 10px",
          }}
        >
          <option value="">Todos los estados</option>
          {listSystemStatuses().map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
        </select>
        <select
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value)}
          style={{
            minWidth: 190,
            border: `1px solid ${SURFACE.border}`,
            background: SURFACE.panel,
            color: SURFACE.text,
            borderRadius: 6,
            padding: "8px 10px",
          }}
        >
          <option value="system">Orden por estado</option>
          <option value="score">Orden por score</option>
          <option value="ticker">Orden por ticker</option>
          <option value="pePb">Orden por P/E x P/B</option>
          <option value="mos">Orden por MoS</option>
          <option value="updated">Orden por fecha</option>
        </select>
        <button
          type="button"
          onClick={() => setSortKey("score")}
          style={{
            border: `1px solid ${sortKey === "score" ? AC.green : SURFACE.border}`,
            background: sortKey === "score" ? SURFACE.activeGreen : SURFACE.navInactive,
            color: SURFACE.text,
            borderRadius: 6,
            padding: "8px 10px",
            cursor: "pointer",
          }}
        >
          Mejor score
        </button>
      </div>

      <div className="watchlist-table-shell">
        <table style={{ width: "100%", minWidth: 2600, borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ color: SURFACE.muted, textAlign: "left" }}>
              {WATCHLIST_TABLE_COLUMNS.map((column) => (
                <th key={column.id} style={{ padding: "9px 8px", borderBottom: `1px solid ${SURFACE.border}`, whiteSpace: "nowrap", position: "sticky", top: 0, background: SURFACE.panel }}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result) => (
              <tr
                key={result.ticker}
                onClick={() => setSelectedCompany(result)}
                style={{ borderTop: `1px solid ${SURFACE.border}`, cursor: "pointer" }}
              >
                {WATCHLIST_TABLE_COLUMNS.map((column) => (
                  <td key={column.id} style={{ padding: "8px", verticalAlign: "top", maxWidth: column.id === "reason" ? 420 : 180, whiteSpace: column.id === "reason" ? "normal" : "nowrap", color: ["reason", "tags", "validation"].includes(column.id) ? SURFACE.muted : SURFACE.text }}>
                    {column.id === "ticker" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        <Dot color={colorFor(result.alertLevel)} />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleFavorite(result.ticker);
                          }}
                          title={favoriteSet.has(result.ticker.toUpperCase()) ? "Quitar de favoritos" : "Marcar como favorito"}
                          style={{ border: 0, background: "transparent", color: favoriteSet.has(result.ticker.toUpperCase()) ? AC.yellow : SURFACE.muted, cursor: "pointer", padding: 0 }}
                        >
                          {favoriteSet.has(result.ticker.toUpperCase()) ? "★" : "☆"}
                        </button>
                        <strong>{result.ticker}</strong>
                      </span>
                    ) : column.id === "reason" ? getVisibleWatchReason(result) : getTableCell(result, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="watchlist-card-list">
        {filteredResults.map((result) => (
          <article key={result.ticker} onClick={() => setSelectedCompany(result)} style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: SURFACE.panel, padding: 14, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleFavorite(result.ticker);
                    }}
                    title={favoriteSet.has(result.ticker.toUpperCase()) ? "Quitar de favoritos" : "Marcar como favorito"}
                    aria-label={favoriteSet.has(result.ticker.toUpperCase()) ? `Quitar ${result.ticker} de favoritos` : `Marcar ${result.ticker} como favorito`}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      border: `1px solid ${favoriteSet.has(result.ticker.toUpperCase()) ? AC.yellow : SURFACE.border}`,
                      background: favoriteSet.has(result.ticker.toUpperCase()) ? SURFACE.activeFavorite : SURFACE.navInactive,
                      color: favoriteSet.has(result.ticker.toUpperCase()) ? AC.yellow : SURFACE.muted,
                      cursor: "pointer",
                      fontSize: 17,
                      lineHeight: "26px",
                    }}
                  >
                    {favoriteSet.has(result.ticker.toUpperCase()) ? "★" : "☆"}
                  </button>
                  <Dot color={colorFor(result.alertLevel)} />
                  <strong style={{ fontSize: 18 }}>{result.ticker}</strong>
                  <span style={{ color: SURFACE.muted }}>{result.companyName}</span>
                </div>
                <div style={{ marginTop: 5, color: SURFACE.muted, fontSize: 12 }}>
                  {result.yahooSymbol || result.ticker} · {result.market || "Mercado no definido"} · {result.sector} · {result.alertLabel}
                </div>
              </div>
              <div style={{ textAlign: "right", fontFamily: "IBM Plex Mono, monospace" }}>
                <div>{fmt(result.livePrice)}</div>
                <div style={{ color: SURFACE.muted, fontSize: 12 }}>
                  {result.ratios ? `Max defensivo ${fmt(result.ratios.maxDefensivePrice)}` : "Sin fundamentales"}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 12 }}>
              <small>P/E <strong>{fmt(result.ratios?.pe)}</strong></small>
              <small>P/B <strong>{fmt(result.ratios?.pb)}</strong></small>
              <small>P/E x P/B <strong>{fmt(result.ratios?.pePb)}</strong></small>
              <small>Debt <strong>{fmt(result.ratios?.debtRatio)}</strong></small>
              <small>Current <strong>{fmt(result.ratios?.currentRatio)}</strong></small>
              <small>MoS <strong>{pct(result.ratios?.marginOfSafety)}</strong></small>
            </div>

            {getVisibleWatchReason(result) ? (
              <p style={{ color: SURFACE.text, margin: "12px 0 0", lineHeight: 1.5 }}>{getVisibleWatchReason(result)}</p>
            ) : null}
            {normalizeTags(result.tags).length ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {normalizeTags(result.tags).slice(0, 8).map((tag) => (
                  <span key={tag} style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 999, color: SURFACE.muted, fontSize: 11, padding: "3px 7px", background: SURFACE.page }}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
              <div style={{ color: SURFACE.muted, fontSize: 12 }}>
                Estado: {result.systemStatus?.label || result.analysisStatus || "pendiente"} · Validacion: {result.validationStatus || "sin validar"} · Fuente: {result.source || "sin fuente"}
              </div>
              {result.alertLevel === "pending" || (result.analysisStatus !== "analyzed" && result.alertLevel !== "reference") ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onManualCapture?.(result);
                  }}
                  style={{
                    border: `1px solid ${AC.yellow}`,
                    background: SURFACE.activeFavorite,
                    color: AC.yellow,
                    borderRadius: 6,
                    padding: "8px 10px",
                    cursor: "pointer",
                  }}
                >
                  Captura manual
                </button>
              ) : null}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedCompany(result);
                }}
                style={{ border: `1px solid ${AC.blue}`, background: SURFACE.activeBlue, color: SURFACE.text, borderRadius: 6, padding: "8px 10px", cursor: "pointer" }}
              >
                Ver detalle
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedCompany ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de ${selectedCompany.ticker}`}
          onClick={() => setSelectedCompany(null)}
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "flex-end" }}
        >
          <aside
            onClick={(event) => event.stopPropagation()}
            style={{ width: "min(620px, 100%)", height: "100%", overflowY: "auto", background: SURFACE.page, borderLeft: `4px solid ${SURFACE.border}`, boxShadow: "-8px 0 0 #000", padding: 22 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", marginBottom: 18 }}>
              <div>
                <div style={{ color: SURFACE.muted, fontSize: 12 }}>{selectedCompany.yahooSymbol || selectedCompany.ticker} · {selectedCompany.market || "Mercado no definido"}</div>
                <h2 style={{ margin: "4px 0 0", fontSize: 26, letterSpacing: 0 }}>{selectedCompany.ticker}</h2>
                <div style={{ color: SURFACE.text, fontWeight: 700 }}>{selectedCompany.companyName}</div>
              </div>
              <button type="button" onClick={() => setSelectedCompany(null)} style={{ border: `2px solid ${SURFACE.border}`, background: SURFACE.navInactive, color: SURFACE.text, borderRadius: 6, padding: "8px 10px", cursor: "pointer" }}>
                Cerrar
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 18 }}>
              {[
                ["Precio", fmt(selectedCompany.livePrice ?? selectedCompany.lastPrice ?? selectedCompany.price)],
                ["Score", selectedCompany.score ? `${selectedCompany.score.total} · ${selectedCompany.score.label}` : "N/D"],
                ["Max defensivo", fmt(selectedCompany.ratios?.maxDefensivePrice)],
                ["MoS", pct(selectedCompany.ratios?.marginOfSafety)],
                ["P/E", fmt(selectedCompany.ratios?.pe)],
                ["P/B", fmt(selectedCompany.ratios?.pb)],
                ["P/E x P/B", fmt(selectedCompany.ratios?.pePb)],
                ["Deuda", fmt(selectedCompany.ratios?.debtRatio)],
                ["Corriente", fmt(selectedCompany.ratios?.currentRatio)],
              ].map(([label, value]) => (
                <div key={label} style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.panel, borderRadius: 6, padding: 10 }}>
                  <div style={{ color: SURFACE.muted, fontSize: 11 }}>{label}</div>
                  <strong style={{ color: SURFACE.text, fontFamily: "IBM Plex Mono, monospace" }}>{value}</strong>
                </div>
              ))}
            </div>

            <div style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.panelDark, borderRadius: 8, padding: 14, marginBottom: 12 }}>
              <strong>Composicion del score</strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginTop: 10, color: SURFACE.muted, fontSize: 12 }}>
                <span>Valuacion: {selectedCompany.score?.valuation ?? 0}</span>
                <span>Resiliencia: {selectedCompany.score?.resilience ?? 0}</span>
                <span>Calidad: {selectedCompany.score?.quality ?? 0}</span>
                <span>Estado: {selectedCompany.score?.status ?? 0}</span>
                <span>Datos: {selectedCompany.score?.data ?? 0}</span>
                <span>EPS sin retroceso: {selectedCompany.score?.epsNeverDeclined === true ? "Si" : selectedCompany.score?.epsNeverDeclined === false ? "No" : "N/D"}</span>
              </div>
            </div>

            <div style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.panelDark, borderRadius: 8, padding: 14, marginBottom: 12 }}>
              <strong>Nota de empresa</strong>
              <p style={{ color: selectedBusinessNote ? SURFACE.text : SURFACE.muted, lineHeight: 1.55, margin: "8px 0 0" }}>
                {selectedBusinessNote || "Sin nota de negocio visible. La informacion tecnica de extraccion queda fuera de esta seccion."}
              </p>
            </div>

            <div style={{ border: `1px solid ${SURFACE.border}`, background: SURFACE.panel, borderRadius: 8, padding: 14 }}>
              <strong>Estado</strong>
              <div style={{ color: SURFACE.muted, lineHeight: 1.7, marginTop: 8 }}>
                Senal: {selectedCompany.alertLabel || selectedCompany.alertLevel || "N/D"}<br />
                Estado del sistema: {selectedCompany.systemStatus?.label || selectedCompany.analysisStatus || "N/D"}<br />
                Sector: {selectedCompany.sector || "N/D"} · Industria: {selectedCompany.industry || "N/D"}<br />
                Fuente: {selectedCompany.source || "N/D"} · Actualizado: {formatUpdatedAt(selectedCompany.updatedAt || selectedCompany.sourceDate || selectedCompany.date)}
              </div>
              {normalizeTags(selectedCompany.tags).length ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                  {normalizeTags(selectedCompany.tags).map((tag) => (
                    <span key={tag} style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 999, color: SURFACE.muted, fontSize: 11, padding: "3px 7px", background: SURFACE.page }}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

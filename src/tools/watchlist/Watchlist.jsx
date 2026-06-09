import { useEffect, useMemo, useState } from "react";
import Dot from "../../components/ui/Dot.jsx";
import MetricCard from "../../components/ui/MetricCard.jsx";
import { AC, SURFACE } from "../../lib/colors.js";
import { fmt, pct } from "../../lib/formatters.js";
import { buildDataIssueRows } from "./dataQuality.js";
import { normalizeFavorites, sortFavoritesFirst, toggleFavorite, WATCHLIST_FAVORITES_KEY } from "./favorites.js";
import { screenWatchlist, summarizeScreen } from "./screen.js";
import { listSystemStatuses } from "./statusMapper.js";
import { WATCHLIST_TABLE_COLUMNS, getTableCell } from "./tableColumns.js";
import { buildWatchlist, buildWatchlistMeta, collectTags, fetchPublicCompanies, normalizeTags } from "./watchlist.js";

function colorFor(level) {
  if (level === "approved") return AC.green;
  if (level === "near") return AC.yellow;
  if (level === "reference") return AC.blue;
  if (level === "pending") return AC.blue;
  return AC.gray;
}

const PROCESS_NOTE_PREFIXES = ["snapshot", "sec", "analisis", "análisis", "pendiente", "datos incompletos"];

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
  const reason = result.watchReason || result.notes || "";
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
  const [sortKey, setSortKey] = useState("system");
  const watchlist = useMemo(() => buildWatchlist(publicCompanies), [publicCompanies]);
  const watchlistMeta = useMemo(() => buildWatchlistMeta(watchlist, publicCompanies), [publicCompanies, watchlist]);
  const results = useMemo(() => screenWatchlist(watchlist), [watchlist]);
  const summary = useMemo(() => summarizeScreen(results), [results]);
  const allTags = useMemo(() => collectTags(results), [results]);
  const dataIssues = useMemo(() => buildDataIssueRows(watchlist), [watchlist]);
  const statusCounts = useMemo(() => results.reduce((counts, result) => {
    const id = result.systemStatus?.id || "watch_observation";
    counts[id] = (counts[id] || 0) + 1;
    return counts;
  }, {}), [results]);
  const activeCount = summary.approved.length + summary.near.length;
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(WATCHLIST_FAVORITES_KEY);
      setFavorites(normalizeFavorites(JSON.parse(stored || "[]")));
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPublicCompanies(fetch, import.meta.env.BASE_URL).then((companies) => {
      if (!cancelled) setPublicCompanies(companies);
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

  async function runLocalAction(endpoint, pendingText, doneText) {
    setCaptureMessage(pendingText);
    setCaptureStatus((current) => ({ ...current, captureInProgress: true }));
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "No se pudo completar la accion.");
      setCaptureStatus((current) => ({ ...current, captureInProgress: false, lastCapture: payload }));
      const yahooText = Number.isFinite(payload.partial) && payload.partial > 0 ? ` Parciales Yahoo: ${payload.partial}.` : "";
      setCaptureMessage(`${doneText}. Analizadas: ${payload.analyzed || 0}. No soportadas/fallidas: ${payload.unsupported || 0}.${yahooText} Reporte: ${payload.reportPath || "generado"}`);
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
        (view === "analyzed" && result.analysisStatus === "analyzed") ||
        (view === "reference" && result.alertLevel === "reference") ||
        (view === "statuses" && result.systemStatus) ||
        (view === "discarded" && ["watch", "pending"].includes(result.alertLevel)) ||
        (view === "requested" && result.priority === "requested") ||
        (view === "pending" && result.alertLevel === "pending") ||
        (view === "bmv" && result.market === "BMV SIC");
      const matchesQuery =
        !normalizedQuery ||
        [result.ticker, result.yahooSymbol, result.companyName, result.sector, result.market]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      const matchesTag = !selectedTag || normalizeTags(result.tags).includes(selectedTag);
      const matchesStatus = !selectedStatus || result.systemStatus?.id === selectedStatus;
      return matchesView && matchesQuery && matchesTag && matchesStatus;
    });
    const sorted = sortFavoritesFirst(matches, favorites);
    const column = WATCHLIST_TABLE_COLUMNS.find((item) => item.id === sortKey);
    if (!column) return sorted;
    return [...sorted].sort((a, b) => {
      const favoriteDelta = Number(favoriteSet.has(b.ticker.toUpperCase())) - Number(favoriteSet.has(a.ticker.toUpperCase()));
      if (favoriteDelta) return favoriteDelta;
      if (sortKey === "system") return (a.systemStatus?.rank ?? 99) - (b.systemStatus?.rank ?? 99);
      const av = getTableCell(a, column);
      const bv = getTableCell(b, column);
      return String(av).localeCompare(String(bv), "es", { numeric: true });
    });
  }, [favoriteSet, favorites, query, results, selectedStatus, selectedTag, sortKey, view]);

  return (
    <section>
      <style>{`
        .watchlist-table-shell { display: block; overflow-x: auto; border: 1px solid ${SURFACE.border}; border-radius: 8px; background: #0b1020; margin-bottom: 12px; }
        .watchlist-card-list { display: none; }
        @media (max-width: 999px) {
          .watchlist-table-shell { display: none; }
          .watchlist-card-list { display: grid; gap: 10px; }
        }
      `}</style>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0 }}>Watchlist Semanal</h1>
        <p style={{ margin: "5px 0 0", color: SURFACE.muted }}>
          Radar Graham con {activeCount} en universo activo, {watchlistMeta.analyzedCount} analizadas, {watchlistMeta.referenceCount || 0} referencias y {watchlistMeta.publicExportCount} registros persistidos en export publico.
        </p>
      </div>

      <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "#0b1020", padding: 14, marginBottom: 16 }}>
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
                ["/api/local/update-prices", "Actualizando precios y reporte...", "Precios/reporte actualizados", "Actualizar precios"],
                ["/api/local/process-companies", "Procesando fundamentales existentes...", "Procesamiento completo", "Procesar fundamentales"],
                ["/api/local/yahoo-supplemental", "Intentando Yahoo complementario para no soportadas...", "Yahoo complementario completo", "Rescatar con Yahoo"],
              ].map(([endpoint, pendingText, doneText, label]) => (
                <button
                  key={endpoint}
                  type="button"
                  onClick={() => runLocalAction(endpoint, pendingText, doneText)}
                  disabled={captureStatus.captureInProgress}
                  style={{
                    border: `1px solid ${AC.blue}`,
                    background: "#16345f",
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
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: SURFACE.muted, border: `1px solid ${SURFACE.border}`, background: "#111827", borderRadius: 6, padding: "9px 12px", fontSize: 13 }}>
                <span aria-hidden="true" style={{ color: AC.blue }}>ⓘ</span>
                Solo disponible en dashboard local
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 180px) minmax(180px, 1fr) auto", gap: 8, marginTop: 12 }}>
          <input value={newTicker} onChange={(event) => setNewTicker(event.target.value)} placeholder="Ticker Yahoo base" style={{ border: `1px solid ${SURFACE.border}`, background: "#060911", color: SURFACE.text, borderRadius: 6, padding: "8px 10px" }} />
          <input value={newCompanyName} onChange={(event) => setNewCompanyName(event.target.value)} placeholder="Nombre opcional" style={{ border: `1px solid ${SURFACE.border}`, background: "#060911", color: SURFACE.text, borderRadius: 6, padding: "8px 10px" }} />
          {captureStatus.localApi ? (
            <button type="button" onClick={handleAddCompany} style={{ border: `1px solid ${AC.green}`, background: "#12351f", color: SURFACE.text, borderRadius: 6, padding: "8px 10px" }}>
              Importar ticker
            </button>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, border: `1px solid ${SURFACE.border}`, background: "#111827", color: SURFACE.muted, borderRadius: 6, padding: "8px 10px", fontSize: 12 }}>
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

      <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "#08111f", padding: 14, marginBottom: 16 }}>
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
        <div style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "#0b1020", padding: 14, marginBottom: 16 }}>
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
        <MetricCard label="Aprobadas" value={String(summary.approved.length)} color={AC.green} />
        <MetricCard label="Cerca" value={String(summary.near.length)} color={AC.yellow} />
        <MetricCard label="Observacion" value={String(summary.watch.length)} color={AC.gray} />
        <MetricCard label="Referencias" value={String(summary.reference.length)} color={AC.blue} />
        <MetricCard label="Pendientes" value={String(summary.pending.length)} color={AC.blue} />
        <MetricCard label="Favoritos" value={String(favorites.length)} color={AC.yellow} />
        <MetricCard label="Universo activo" value={String(activeCount)} color={AC.green} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 16 }}>
        {listSystemStatuses().map((status) => (
          <div key={status.id} style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 6, background: "#08111f", padding: "8px 10px", color: SURFACE.muted, fontSize: 12 }}>
            <span style={{ color: status.color }}>●</span> {status.label}: <strong style={{ color: SURFACE.text }}>{statusCounts[status.id] || 0}</strong>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          ["opportunities", "Oportunidades"],
          ["all", "Todo auditado"],
          ["favorites", "Favoritos"],
          ["analyzed", "Analizadas"],
          ["discarded", "Descartadas"],
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
              background: view === id ? "#16345f" : "#111827",
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
            background: "#0b1020",
            color: SURFACE.text,
            borderRadius: 6,
            padding: "8px 10px",
          }}
        />
        <select
          value={selectedTag}
          onChange={(event) => setSelectedTag(event.target.value)}
          style={{
            minWidth: 190,
            border: `1px solid ${SURFACE.border}`,
            background: "#0b1020",
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
            background: "#0b1020",
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
            background: "#0b1020",
            color: SURFACE.text,
            borderRadius: 6,
            padding: "8px 10px",
          }}
        >
          <option value="system">Orden por estado</option>
          <option value="ticker">Orden por ticker</option>
          <option value="pePb">Orden por P/E x P/B</option>
          <option value="mos">Orden por MoS</option>
          <option value="updated">Orden por fecha</option>
        </select>
      </div>

      <div className="watchlist-table-shell">
        <table style={{ width: "100%", minWidth: 2600, borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ color: SURFACE.muted, textAlign: "left" }}>
              {WATCHLIST_TABLE_COLUMNS.map((column) => (
                <th key={column.id} style={{ padding: "9px 8px", borderBottom: `1px solid ${SURFACE.border}`, whiteSpace: "nowrap", position: "sticky", top: 0, background: "#0b1020" }}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result) => (
              <tr key={result.ticker} style={{ borderTop: `1px solid ${SURFACE.border}` }}>
                {WATCHLIST_TABLE_COLUMNS.map((column) => (
                  <td key={column.id} style={{ padding: "8px", verticalAlign: "top", maxWidth: column.id === "reason" ? 420 : 180, whiteSpace: column.id === "reason" ? "normal" : "nowrap", color: ["reason", "tags", "validation"].includes(column.id) ? SURFACE.muted : SURFACE.text }}>
                    {column.id === "ticker" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        <Dot color={colorFor(result.alertLevel)} />
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(result.ticker)}
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
          <article key={result.ticker} style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 8, background: "#0b1020", padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(result.ticker)}
                    title={favoriteSet.has(result.ticker.toUpperCase()) ? "Quitar de favoritos" : "Marcar como favorito"}
                    aria-label={favoriteSet.has(result.ticker.toUpperCase()) ? `Quitar ${result.ticker} de favoritos` : `Marcar ${result.ticker} como favorito`}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      border: `1px solid ${favoriteSet.has(result.ticker.toUpperCase()) ? AC.yellow : SURFACE.border}`,
                      background: favoriteSet.has(result.ticker.toUpperCase()) ? "#3f3412" : "#111827",
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
                  <span key={tag} style={{ border: `1px solid ${SURFACE.border}`, borderRadius: 999, color: SURFACE.muted, fontSize: 11, padding: "3px 7px", background: "#060911" }}>
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
                  onClick={() => onManualCapture?.(result)}
                  style={{
                    border: `1px solid ${AC.yellow}`,
                    background: "#3f3412",
                    color: AC.yellow,
                    borderRadius: 6,
                    padding: "8px 10px",
                    cursor: "pointer",
                  }}
                >
                  Captura manual
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

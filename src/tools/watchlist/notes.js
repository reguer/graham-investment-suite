const TECHNICAL_NOTE_PATTERNS = [
  /SEC no devolvio/i,
  /Yahoo .*no devolvio/i,
  /Yahoo .*sin datos/i,
  /No se encontro CIK/i,
  /No se obtuvo precio/i,
  /Fallo analisis/i,
  /quoteType=/i,
  /fundamentalsTimeSeries/i,
  /PostgreSQL/i,
  /DATABASE_URL/i,
  /Snapshot Yahoo/i,
  /datos\/moneda/i,
  /moneda/i,
  /alias Yahoo/i,
  /captura manual/i,
  /fuente/i,
  /extracci/i,
];

export function isTechnicalNote(value) {
  const text = String(value || "").trim();
  return TECHNICAL_NOTE_PATTERNS.some((pattern) => pattern.test(text));
}

export function businessNoteFor(item) {
  const candidates = [item.watchReason, item.notes, item.note, item.classification?.reason]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value) => !isTechnicalNote(value));
  if (candidates.length) return candidates[0];

  if (item.alertLevel === "approved" || item.classificationId === "graham_approved") {
    return "Cumple el rango defensivo Graham; revisar liquidez, deuda y precio antes de operar.";
  }
  if (item.alertLevel === "near") {
    return "Esta cerca del rango defensivo; conviene vigilar precio, margen de seguridad y balance.";
  }
  if (item.analysisStatus !== "analyzed") {
    return "Revision pendiente: no hay base financiera suficiente para emitir una tesis de empresa.";
  }
  return "No cumple por ahora el perfil defensivo Graham; revisar valuacion, balance y consistencia de utilidades.";
}

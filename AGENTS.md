# AGENTS

- Fuente principal: `HANDOFF_GRAHAM_ECOSYSTEM.md`.
- No tocar `.env`, tokens, llaves API ni credenciales.
- No cambiar formulas Graham sin actualizar tests y documentacion.
- Correr `npm test`, `npm run build` y `npm run build:artifact` antes de cerrar cambios.
- Mantener `artifacts/graham_analyzer.jsx` como standalone con `export default`.
- No usar `git push --force`.
- UI en espanol; codigo, funciones y variables en ingles.
- FCF es `operatingCF + investingCF`.
- ADR multiplica EPS, BVPS, TBVPS y NCAV por `adrRatio`.
- P/E es `null` si EPS ajustado es menor o igual a cero.

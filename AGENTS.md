# AGENTS

- Fuente principal: `HANDOFF_GRAHAM_ECOSYSTEM.md`.
- No tocar `.env`, tokens, llaves API ni credenciales.
- No cambiar formulas Graham sin actualizar tests y documentacion.
- Correr `npm test`, `npm run build` y `npm run build:artifact` antes de cerrar cambios.
- Mantener `artifacts/graham_analyzer.jsx` como standalone con `export default`.
- No usar `git push --force`.
- Si el usuario pide publicar el dashboard, hacer `git push` normal a `main` y luego `npm run deploy:pages`; mantener `main` y `gh-pages` sincronizados desde este repo local.
- En Windows, el dashboard local debe poder arrancar y seguir vivo sin una ventana visible de PowerShell; `npm run dev:stop` debe matar el arbol completo del dashboard de este repo.
- UI en espanol; codigo, funciones y variables en ingles.
- FCF es `operatingCF + investingCF`.
- ADR multiplica EPS, BVPS, TBVPS y NCAV por `adrRatio`.
- P/E es `null` si EPS ajustado es menor o igual a cero.
- No llamar "Buffett" a la capa de calidad actual como si fuera valuacion Buffett formal; para roadmap futuro usar `docs/13_ROADMAP_NOTION_READY.md` secciones `E25` y `E26` (owner earnings + DCF + evidencia).

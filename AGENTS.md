# AGENTS

- Fuente principal: `HANDOFF_GRAHAM_ECOSYSTEM.md`.
- No tocar `.env`, tokens, llaves API ni credenciales.
- No cambiar formulas Graham sin actualizar tests y documentacion.
- Correr `npm test`, `npm run build` y `npm run build:artifact` antes de cerrar cambios.
- Mantener `artifacts/graham_analyzer.jsx` como standalone con `export default`.
- No usar `git push --force`.
- El dashboard local publica solo a GitHub Pages: los botones "Actualizar todo" y "Solo precios" corren `scripts/publish-pages.js` despues de refrescar datos (commit + push a `main` + build + `npm run deploy:pages`). Si el usuario pide publicar manualmente, sigue disponible `node scripts/publish-pages.js` o el flujo `git push origin main && npm run deploy:pages`; mantener `main` y `gh-pages` sincronizados desde este repo local.
- En Windows, el dashboard local debe poder arrancar y seguir vivo sin una ventana visible de PowerShell; `npm run dev:stop` debe matar el arbol completo del dashboard de este repo.
- UI en espanol; codigo, funciones y variables en ingles.
- FCF es `operatingCF + investingCF`.
- ADR multiplica EPS, BVPS, TBVPS y NCAV por `adrRatio`.
- P/E es `null` si EPS ajustado es menor o igual a cero.
- No llamar "Buffett" a la capa de calidad actual como si fuera valuacion Buffett formal; para roadmap futuro usar `docs/13_ROADMAP_NOTION_READY.md` secciones `E25` y `E26` (owner earnings + DCF + evidencia).

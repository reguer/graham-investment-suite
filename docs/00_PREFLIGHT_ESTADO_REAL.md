# 00 — Preflight: Estado Real del Repositorio

> Auditoría de solo lectura generada el 2026-06-03.
> Todos los datos verificados directamente contra el repositorio y el sistema de archivos.
> Lo que no pudo verificarse se marca como **NO VERIFICADO**.

---

## 1. Rama actual

```
main
```

## 2. Estado de Git al inicio de la auditoría

```
Clean — sin cambios pendientes, sin staged, sin untracked relevantes.
```

## 3. Commits recientes

```
49d44a1  docs: add public app url
05674f4  feat: create Graham Investment Suite
```

El proyecto fue creado como un único commit inicial que incluye toda la aplicación ya funcional.

## 4. Remotos configurados

```
origin → https://github.com/reguer/graham-investment-suite.git
```

Solo existe el remoto `origin`. No hay forks ni secundarios configurados.

## 5. GitHub Pages

- **URL pública**: `https://reguer.github.io/graham-investment-suite/`
- **Mecanismo de deploy**: **NO VERIFICADO**
  - No existe rama `gh-pages` detectada en el repositorio local
  - `.github/workflows/` existe pero está **vacío** — ningún workflow activo
  - `vite.config.js` detecta `process.env.GITHUB_ACTIONS` para ajustar la base URL, lo que sugiere que en algún momento existió o se planea un workflow de CI/CD
  - La URL pública existe y responde, por lo que el deploy ocurrió de alguna manera (posiblemente manual o desde otra máquina)
- **Riesgo**: Si se crea un workflow en `.github/workflows/` sin cuidado, podría exponer secretos o ejecutar procesos que no deben correr en CI

## 6. Sistema operativo detectado

```
Windows 11 Pro — Build 10.0.26200
```

- Shell principal: PowerShell 7+
- Bash también disponible vía herramientas Git/WSL

## 7. Gestor de paquetes

```
npm  (gestor principal)
```

- También existe soporte para yarn y módulos locales custom vía `scripts/run-local-bin.js`
- El script `run-local-bin.js` busca binarios en:
  1. `node_modules/`
  2. `.yarn_node_modules/`
  3. `.local_node_modules/`
  - Fallback especial para `esbuild` en Windows: `C:\npm-cache\graham-tools\esbuild-0.21.5.exe`
- Existe `yarn.lock` en el repositorio

## 8. Stack real

| Capa | Tecnología | Versión |
|------|-----------|---------|
| UI Framework | React | 18.3.0 |
| Bundler | Vite | 5.4.0 |
| Testing | Vitest | 2.0.0 |
| React plugin | @vitejs/plugin-react | 4.3.0 |
| Runtime | Node.js | (no fijado en .nvmrc) |
| Lenguaje | JavaScript (ES Modules) | — |
| Estilos | Inline styles (sin Tailwind, sin CSS-in-JS externo) | — |
| AI | Anthropic Claude Sonnet API | claude-sonnet-4-20250514 |
| Precios spot | Stooq CSV API | — |

**Sin**: Python, bases de datos, backend, Docker, TypeScript, tests E2E.

## 9. Scripts disponibles (verificados en package.json)

```json
"dev":            "node scripts/run-local-bin.js vite"
"build":          "node scripts/run-local-bin.js vite build"
"test":           "node scripts/run-local-bin.js vitest run"
"test:watch":     "node scripts/run-local-bin.js vitest"
"build:artifact": "node scripts/bundle-artifact.js"
"weekly:screen":  "node scripts/weekly-screen.js"
"weekly:report":  "node scripts/weekly-screen.js"
```

**No existen**: `lint`, `typecheck`, `test:integration`, `deploy`, `preview`, `start`.

## 10. Puertos usados por configuración del proyecto

| Proceso | Puerto | Configuración |
|---------|--------|--------------|
| Vite dev server | **5173** (default) | No explicitado en `vite.config.js` — usa el default de Vite |
| Vite preview | 4173 (default Vite) | No usado actualmente |

`vite.config.js` no especifica `server.port` ni `server.host`. El puerto 5173 puede estar ocupado por otro proyecto.

## 11. Procesos locales activos relacionados con este repo

**NO VERIFICADO** — No se intentó identificar procesos activos para evitar colisiones.
Para verificar si Vite está corriendo: `netstat -ano | findstr :5173`

## 12. Archivos `.env*` existentes

```
Ninguno encontrado.
```

- `.gitignore` excluye correctamente `.env` y `.env.*`
- La única variable de entorno requerida es `VITE_ANTHROPIC_API_KEY` (leída en `src/lib/anthropic.js`)
- Sin `.env`, la función `generateAnalysis()` intenta `window.claude.complete()` como primer intento (Claude.ai artifact mode) y falla silenciosamente si no está disponible
- La app funciona sin `VITE_ANTHROPIC_API_KEY` — solo el análisis IA no estará disponible

## 13. Bases de datos locales existentes

```
Ninguna.
```

La persistencia actual es:
1. `window.storage` (API de Claude.ai cuando se usa como artifact)
2. `localStorage` del navegador como fallback
3. Clave: `graham-analyzer:companies`, máximo 50 análisis guardados

No existe SQLite, PostgreSQL, MongoDB ni ningún archivo `.db` o `.sqlite`.

## 14. Carpetas de outputs

| Carpeta | Propósito | En .gitignore |
|---------|-----------|--------------|
| `dist/` | Build Vite para producción | Sí |
| `dist-temp/` | Build temporal | Sí |
| `reports/weekly/` | Reportes markdown semanales | **No** — se versiona |
| `artifacts/` | Standalone JSX para Claude.ai | **No** — se versiona |

Reporte más reciente: `reports/weekly/2026-06-03.md` — 10 empresas aprobadas Graham.

## 15. Carpetas de logs

| Archivo | Propósito | En .gitignore |
|---------|-----------|--------------|
| `dev-server.log` | Logs del servidor Vite dev | Sí |
| `dev-server.err.log` | Errores del servidor Vite dev | Sí |

Actualmente `dev-server.err.log` está vacío. `dev-server.log` contiene líneas de HMR de una sesión anterior.

No existe carpeta `logs/` dedicada.

## 16. Carpetas de documentación

| Carpeta/Archivo | Tipo |
|----------------|------|
| `docs/` | Carpeta con docs técnicos (4 archivos pre-auditoría) |
| `README.md` | Documento público principal |
| `CLAUDE.md` | Reglas para Claude Code |
| `AGENTS.md` | Reglas para agentes IA |
| `HANDOFF_GRAHAM_ECOSYSTEM.md` | Fuente de verdad técnica (v1.3) |
| `HANDOFF_GRAHAM_ECOSYSTEM (1).md` | **Duplicado** del anterior |
| `PROMPT_CODEX (1).md` | Documento de handoff MVP para modularización |

Documentos en `docs/` (pre-auditoría):
- `docs/classification-logic.md`
- `docs/formulas.md`
- `docs/data-sources.md`
- `docs/weekly-alerts.md`

## 17. Tests disponibles

```
tests/
├── calcRatios.test.js       — 8 tests (fixture TSM con ADR ratio 5)
├── classify.test.js          — tests de clasificación 4 categorías
├── formatters.test.js        — tests de parsing y formateo numérico
└── watchlist-screen.test.js  — tests del motor de screening
└── fixtures/
    └── tsm.json              — fixture crítico TSM (Taiwan Semi, precio $371, ADR 5)
```

**Fixture crítico**: TSM con `adrRatio=5` debe producir `P/E ≈7.03`, `P/B ≈11.20`, `P/E×P/B ≈78.77`, `NCAV ≈7.86`.

## 18. Build disponible

- `npm run build` → genera `dist/` (excluido de git)
- `npm run build:artifact` → valida y genera `artifacts/graham_analyzer.jsx` y `artifacts/macro_radar.jsx`
- No existe script `preview` en package.json, pero puede correrse con `npx vite preview`

## 19. Dashboard local existente

```
npm run dev
```

Inicia el servidor Vite en `http://localhost:5173` (puerto default).

La app es una SPA React con 3 herramientas accesibles por tabs:
1. **Graham Analyzer** — herramienta principal
2. **Watchlist** — screening semanal de 10 candidatos
3. **Macro Radar** — indicadores macroeconómicos (en desarrollo)

No existe dashboard HTML estático separado.

## 20. GitHub Pages existente

- **URL**: `https://reguer.github.io/graham-investment-suite/`
- **Estado**: Activa (responde públicamente)
- **Mecanismo de deploy**: **NO VERIFICADO**
  - No hay workflow en `.github/workflows/`
  - No hay rama `gh-pages` detectada localmente
  - Posible deploy manual previo desde otra máquina o método no documentado

---

## Resumen ejecutivo de riesgos detectados en preflight

| # | Riesgo | Severidad | Acción recomendada |
|---|--------|-----------|-------------------|
| 1 | Mecanismo de deploy a GitHub Pages no documentado | Media | Verificar con `git branch -a` en la máquina original o en GitHub web |
| 2 | Puerto 5173 sin configuración explícita — puede colisionar | Baja | Documentar en `.local_runtime/` al iniciar |
| 3 | Sin BD local — datos hardcodeados en candidates.js | Alta | Diseñar migración a SQLite (ver `docs/05_BASE_LOCAL_EMPRESAS_INDICES.md`) |
| 4 | Sin `VITE_ANTHROPIC_API_KEY` — análisis IA no disponible | Baja | Crear `.env.local` con la clave |
| 5 | Duplicados en raíz: `HANDOFF_GRAHAM_ECOSYSTEM (1).md` | Baja | Mover a `_archive/` previo acuerdo |
| 6 | `PROMPT_CODEX (1).md` sin referencias en código | Baja | Mover a `_archive/` previo acuerdo |
| 7 | Sin scheduler local configurado para cierre diario 18:00 CDMX | Alta | Configurar Windows Task Scheduler (ver `docs/09_MODO_LOCAL_TIEMPO_REAL.md`) |
| 8 | Sin identificación de ordenador en señales y reportes | Media | Implementar device_id (ver `docs/10_INSTALACION_MULTIORDENADOR.md`) |

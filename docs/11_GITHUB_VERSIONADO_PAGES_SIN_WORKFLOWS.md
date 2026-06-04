# 11 — GitHub: Versionado, GitHub Pages y Sin Workflows Remotos

> Este documento describe qué se versiona en GitHub, cómo está configurado GitHub Pages, y las reglas para nunca ejecutar operaciones críticas en workflows remotos.

---

## 1. Auditoría de la configuración actual de GitHub

| Aspecto | Estado verificado |
|---------|------------------|
| Repositorio | `github.com/reguer/graham-investment-suite` |
| Rama principal | `main` |
| `.github/workflows/` | Directorio existe, **completamente vacío** |
| Rama `gh-pages` | **Verificada en remoto** |
| GitHub Pages URL | `https://reguer.github.io/graham-investment-suite/` — activa |
| Mecanismo de deploy | **Verificado: rama `gh-pages`, carpeta `/`** |

### Mecanismo real verificado

Verificado con:

```powershell
gh api repos/reguer/graham-investment-suite/pages
```

Resultado operativo:

```text
branch: gh-pages
path: /
status: built
html_url: https://reguer.github.io/graham-investment-suite/
```

La publicacion actual se hace con build local, copia de `dist/` a un worktree temporal de `gh-pages`, commit y push a `origin gh-pages`.

### Base path de Vite

```javascript
base: command === "build" ? "/graham-investment-suite/" : "/",
```

El build debe usar `/graham-investment-suite/` porque GitHub Pages sirve este repo en una subruta. Si el build queda con `/assets/...`, el dashboard carga HTML pero queda en blanco porque el JavaScript apunta a `https://reguer.github.io/assets/...`.

---

## 2. Qué SÍ debe versionarse en GitHub

| Archivo/Carpeta | Motivo |
|----------------|--------|
| `src/` | Código fuente principal |
| `tests/` | Tests unitarios (críticos) |
| `scripts/` | Scripts de automatización local |
| `artifacts/` | Componentes standalone para Claude.ai |
| `docs/` | Documentación técnica |
| `reports/weekly/` | Reportes de screening (histórico público) |
| `README.md` | Documentación pública |
| `CLAUDE.md` | Reglas para agentes IA |
| `AGENTS.md` | Reglas para agentes IA |
| `HANDOFF_GRAHAM_ECOSYSTEM.md` | Fuente de verdad técnica |
| `CHANGELOG.md` | Historial de cambios |
| `package.json` | Definición del proyecto |
| `package-lock.json` / `yarn.lock` | Lockfile de dependencias |
| `vite.config.js` | Configuración del bundler |
| `vitest.config.js` | Configuración de tests |
| `index.html` | HTML de entrada |
| `.gitignore` | Reglas de exclusión |

---

## 3. Qué NO debe versionarse en GitHub

| Archivo/Carpeta | Motivo | Estado en .gitignore |
|----------------|--------|---------------------|
| `node_modules/` | Dependencias instalables | ✅ Ya excluido |
| `dist/` | Build output | ✅ Ya excluido |
| `dist-temp/` | Build temporal | ✅ Ya excluido |
| `.env` | Secretos y claves | ✅ Ya excluido |
| `.env.*` | Todos los .env | ✅ Ya excluido |
| `.env.local` | Config local por equipo | ✅ Ya excluido por `.env.*` |
| `dev-server.log` | Log temporal | ✅ Ya excluido |
| `dev-server.err.log` | Log de errores temporal | ✅ Ya excluido |
| `.local_runtime/` | Runtime local (PIDs, locks, logs) | ✅ Ya excluido |
| `data/*.db` | Base de datos local | ✅ Ya excluido |
| `data/cache/` | Caché de datos | ✅ Ya excluido |
| `data/export/` | Exportaciones | ✅ Ya excluido |
| `*.pid` | PIDs de procesos | ✅ Ya excluido |
| `*.lock` | Lockfiles de procesos | ✅ Ya excluido con excepciones para lockfiles de paquetes |

### `.gitignore` actualizado

Añadir a las líneas existentes:

```gitignore
# Runtime local (por equipo — nunca versionar)
.local_runtime/
.env.local

# Procesos
*.pid
*.lock
!yarn.lock
!package-lock.json
!pnpm-lock.yaml

# Base de datos local
data/*.db
data/*.db-shm
data/*.db-wal
data/cache/
data/export/
```

---

## 4. Regla cardinal: Los workflows NO deben ejecutar operaciones críticas

### Qué NUNCA debe hacer un workflow de GitHub Actions

```
❌ Ejecutar screening o análisis de mercado
❌ Actualizar datos de Yahoo Finance o Stooq
❌ Enviar alertas por Telegram o email
❌ Escribir en la base de datos local
❌ Generar reportes con datos sensibles
❌ Leer o usar VITE_ANTHROPIC_API_KEY en el build (solo para cliente)
❌ Acceder a datos de cartera o posiciones
❌ Exponer .env.local en el entorno de CI
```

### Qué SÍ podría hacer un workflow (si se decide crear uno)

```
✅ Ejecutar npm test en cada PR (validación)
✅ Ejecutar npm run build para verificar que el build no rompe
✅ Generar el build estático de la UI (sin datos sensibles)
✅ Desplegar el build estático a GitHub Pages (solo UI, sin datos)
✅ Ejecutar npm run build:artifact para validar los artifacts
```

### Ejemplo de workflow PERMITIDO (si se crea)

```yaml
# .github/workflows/deploy-pages.yml (PROPUESTO — no crear sin revisión)
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      
      # SOLO tests y build — sin datos de mercado, sin API keys de análisis
      - run: npm test
      
      - run: npm run build
        env:
          GITHUB_ACTIONS: true
          # NO incluir VITE_ANTHROPIC_API_KEY en producción
      
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 5. Tres opciones para deploy a GitHub Pages sin workflow activo

### Opción 1 (Recomendada): Script local de deploy

Propuesta de script `scripts/deploy-pages.js` que:
1. Verifica que el equipo tiene `device_role = 'principal'`
2. Verifica que el repo está limpio
3. Ejecuta `npm run build`
4. Valida que `dist/` no contiene secretos
5. Copia `dist/` a un worktree temporal de `gh-pages`
6. Hace commit y push normal a `gh-pages` sin force push

```powershell
# Validar sin publicar
node scripts/deploy-pages.js --dry-run

# Publicar
npm run deploy:pages
```

### Opción 2: GitHub Pages desde rama main/docs

1. Configurar en GitHub.com → Settings → Pages → Branch: main → Folder: /docs
2. El build estático se genera localmente y se copia a `docs/`
3. Se hace commit y push de `docs/` a main

```powershell
npm run build
Copy-Item -Path "dist/*" -Destination "docs/" -Recurse -Force
git add docs/
git commit -m "build: actualizar GitHub Pages"
git push origin main
```

> Riesgo: La carpeta `docs/` contiene el build — puede ser grande. Agregar `docs/*.js`, `docs/*.css` al `.gitignore` de rama main, o usar el `.nojekyll` trick.

### Opción 3: Deploy manual con gh-pages package

```powershell
# Instalar si no existe
npm install --save-dev gh-pages

# Build y deploy
npm run build
npx gh-pages -d dist --message "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
```

---

## 6. Commits recomendados para este proyecto

### Estructura de commits

```
tipo: descripción corta

Tipos aceptados:
  feat:     Nueva funcionalidad
  fix:      Corrección de bug
  docs:     Documentación
  test:     Tests
  refactor: Refactorización sin cambio de comportamiento
  build:    Cambios de build o dependencias
  chore:    Tareas de mantenimiento
```

### Ejemplos

```powershell
git commit -m "docs: auditoría técnica completa del repositorio"
git commit -m "feat: agregar script de ingesta de empresas"
git commit -m "fix: corregir ADR ratio en calcRatios para tickers sin adrRatio definido"
git commit -m "build: actualizar GitHub Pages con build 2026-06-03"
```

---

## 7. Reglas de branching para este proyecto

| Rama | Uso |
|------|-----|
| `main` | Código en producción — solo merges revisados |
| `gh-pages` | Build estático para GitHub Pages (si se usa este método) |
| `feature/*` | Nuevas funcionalidades (propuesto) |
| `fix/*` | Correcciones (propuesto) |

**Nunca hacer force push a `main`.**

---

## 8. Riesgo de crear workflows accidentales

Si alguien crea un archivo en `.github/workflows/`, GitHub Actions empezará a ejecutarse automáticamente en los eventos configurados.

**Riesgos potenciales**:
- Un workflow mal configurado podría exponer `VITE_ANTHROPIC_API_KEY` si está en los Secrets del repo y se usa en el build
- Un workflow de deploy podría subir datos de cartera si se incluye en el build
- Un workflow de screening ejecutaría llamadas a Stooq o Yahoo Finance desde servidores de GitHub

**Protección recomendada**: Documentar en `AGENTS.md` y `CLAUDE.md` que no deben crearse workflows sin revisión explícita del dueño del repositorio.

# Graham Investment Suite

Suite React/Vite para analisis financiero defensivo basado en Benjamin Graham. La herramienta principal es Graham Analyzer: captura manual de datos desde Yahoo Finance, calculo de ratios, semaforos, clasificacion, interpretacion por reglas e IA opcional.

No es asesoria financiera. Es una herramienta de analisis; verifica datos, moneda, magnitudes y ADR ratio antes de decidir.

## App publica

https://reguer.github.io/graham-investment-suite/

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Pruebas y build

```bash
npm test
npm run build
npm run build:artifact
npm run weekly:screen
```

## Datos

Los datos se capturan manualmente desde Yahoo Finance: Balance Sheet, Income Statement, Cash Flow, EPS TTM, Shares Outstanding, Net Tangible Assets o Goodwill + Intangibles y ADR ratio cuando aplique.

## Decision ADR / TSM

La regla final documentada y probada es: si `isADR = true`, `epsAdj`, `bvps`, `tangibleBvps` y `ncav` se multiplican por `adrRatio`. Con el fixture TSM y `adrRatio = 5`, el resultado esperado es `P/E ~7.03`, `P/B ~11.20`, `P/E x P/B ~78.77` y `NCAV positivo ~7.86`. Se descartan expectativas previas incompatibles como `P/E ~31.92` o NCAV negativo para esos mismos datos.

## Artifact standalone

`npm run build:artifact` valida que existan `artifacts/graham_analyzer.jsx` y `artifacts/macro_radar.jsx` con `export default`. En esta fase el artifact se mantiene como copia monolitica funcional; no depende de imports internos del repo.

## Alertas semanales

`npm run weekly:screen` actualiza precios desde Stooq cuando esta disponible, recalcula la watchlist y genera `reports/weekly/YYYY-MM-DD.md`.

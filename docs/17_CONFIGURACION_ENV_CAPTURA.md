# 17 - Configuracion .env.local y Captura desde Dashboard

## Objetivo

Habilitar la captura de empresas desde el dashboard local sin usar terminal para la operacion diaria.

## Archivos creados

- `.env.example`: plantilla versionada, sin secretos.
- `.env.local`: archivo privado de este ordenador, ignorado por Git.

## Pasos exactos para llenar `.env.local`

1. Abre el archivo `.env.local` en el editor.

2. Busca esta linea:

```bash
DATABASE_URL=
```

3. Reemplazala con una URL real de PostgreSQL usando este formato exacto:

```bash
DATABASE_URL=postgresql://USUARIO:PASSWORD@127.0.0.1:5432/graham_suite
```

4. Sustituye solo estas partes:

- `USUARIO`: el usuario de PostgreSQL. Usualmente puede ser `postgres`.
- `PASSWORD`: la contrasena que pusiste al instalar PostgreSQL.

5. Ejemplo de forma, con valores ficticios:

```bash
DATABASE_URL=postgresql://postgres:mi_password_local@127.0.0.1:5432/graham_suite
```

6. No agregues espacios antes ni despues del signo `=`.

7. Guarda el archivo.

## Campos de captura diaria

Estos campos ya quedan listos:

```bash
ENABLE_DAILY_CAPTURE=true
CAPTURE_LOCAL_TIME=18:00
```

Significado:

- `ENABLE_DAILY_CAPTURE=true`: el dashboard local programa una captura automatica.
- `CAPTURE_LOCAL_TIME=18:00`: la captura se dispara a las 18:00 hora local mientras `npm run dev:safe` este abierto.

Si el dashboard local esta cerrado a las 18:00, no hay proceso vivo que pueda ejecutar la captura.

## Telegram

Dejalo asi por ahora:

```bash
ENABLE_TELEGRAM_ALERTS=false
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_ALERT_MIN_SEVERITY=medium
```

No hace falta llenar Telegram para capturar empresas ni generar reportes.

## Uso desde el dashboard

1. Abre el dashboard local.
2. Entra a la pestana `Watchlist`.
3. Usa el boton `Capturar ahora`.
4. La plataforma genera:

```text
reports/weekly/YYYY-MM-DD.md
data/cache/company-capture-YYYY-MM-DD.json
```

Antes de generar el reporte, el boton intenta analizar todas las empresas no analizadas:

- Empresas USA con CIK en SEC: usa SEC EDGAR `companyfacts` + precio Yahoo Chart del ticker base en USD.
- Empresas no soportadas por SEC: `npm run fundamentals:ingest -- --all-unsupported` intenta snapshot Yahoo completo con `fundamentalsTimeSeries`, valida/convierten monedas con FX Yahoo y marca rechazos por modelo cuando Graham no aplica.
- Indices, futuros y empresas sin CIK SEC: quedan marcados como `analysis_unsupported` con razon explicita.
- PostgreSQL: guarda empresas en `companies` y snapshots en `financial_snapshots`.
- GitHub Pages: lee `public/data/companies.json`; los scripts sincronizan ese archivo desde `data/public/companies.json`.

## Scheduler lunes/viernes

Para crear la tarea local de Windows sin sobrescribir una existente:

```bash
npm run scheduler:install
```

La tarea corre `npm run weekly:screen` lunes y viernes a las 18:00 desde esta carpeta. Las credenciales de Telegram se leen solo desde `.env.local`; este script no las imprime ni las modifica.
- Export publico: actualiza `data/public/companies.json` para GitHub Pages.

El archivo Markdown es el reporte humano.
El JSON es la captura estructurada para validacion.

## Que queda bloqueado si `DATABASE_URL` esta vacio

La captura desde dashboard funciona usando archivos locales/export publico.

PostgreSQL queda bloqueado hasta que `DATABASE_URL` tenga usuario y password reales. Cuando exista, se puede correr la preparacion de base con:

```bash
npm run db:setup
```

Ese comando no debe ejecutarse antes de llenar `DATABASE_URL`.

# 16 - Datos Locales, PostgreSQL y GitHub

## Decision

El ordenador tiene PostgreSQL 17 activo en `localhost:5432`, pero requiere password. Por eso el proyecto no crea una base nueva ni intenta credenciales.

La estrategia queda dividida:

- PostgreSQL local: datos operativos, historiales, snapshots y futuros analisis privados.
- GitHub: catalogo publico no sensible en `data/public/companies.json`, reportes Markdown y codigo.

## Por que no todo se guarda en GitHub

GitHub es publico para este proyecto. No debe almacenar:

- `.env.local`
- credenciales
- caches de Yahoo/Stooq
- PIDs o runtime local
- bases PostgreSQL/SQLite
- datos privados de cartera o decisiones personales

Lo que si puede guardarse:

- universo de tickers
- empresas analizadas no sensibles
- reportes semanales publicos
- documentacion
- scripts y tests

## PostgreSQL

Verificado:

```text
Servicio: postgresql-x64-17
Puerto: 5432
psql: C:\Program Files\PostgreSQL\17\bin\psql.exe
```

Conexion sin password falla, lo cual es correcto:

```text
fe_sendauth: no password supplied
```

Para habilitar escritura local, crear `.env.local`:

```bash
DATABASE_URL=postgresql://usuario:password@127.0.0.1:5432/graham_suite
```

No se versiona.

## Comandos

```bash
npm run db:setup
npm run db:add-company -- --ticker MSFT --name "Microsoft Corporation" --currency USD --market US
npm run db:import -- --file data/import/companies.json
npm run db:migrate-candidates
npm run fundamentals:update -- --ticker AAPL --expected-currency USD
```

Si `DATABASE_URL` no existe, los scripts actualizan `data/public/companies.json` cuando aplica y reportan que PostgreSQL fue omitido.

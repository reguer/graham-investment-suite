# Data Sources

Los datos se capturan manualmente desde Yahoo Finance. No se inventan datos ni rutas exactas no confirmadas; valida siempre moneda, escala y periodo.

## Balance Sheet

Capturar:

- Total Assets
- Current Assets
- Inventory
- Total Liabilities
- Current Liabilities
- Stockholders' Equity / Equity
- Shares Outstanding cuando este disponible como dato consistente del reporte o perfil financiero

## Intangibles y tangible equity

Si Yahoo muestra `Net Tangible Assets`, capturalo en el campo override. Si no, captura `Goodwill And Other Intangible Assets` o el total combinado disponible en `Goodwill + Intangibles`.

## Income Statement

Capturar:

- Revenue
- Gross Profit
- Operating Income
- EBIT
- Interest Expense
- Net Income
- EPS TTM o Diluted EPS trailing twelve months

## Cash Flow

Capturar:

- Operating Cash Flow
- Investing Cash Flow
- Financing Cash Flow

`investingCF` normalmente ya viene negativo; el FCF se calcula como `operatingCF + investingCF`.

## ADR ratio

Para ADR/ADS, captura cuantas acciones locales representa cada ADR. Ejemplo: si un ADR representa 5 acciones locales, `adrRatio = 5`.

## EPS historico

Captura los anos del mas reciente al mas antiguo. La logica de crecimiento compara cada ano reciente contra el siguiente mas antiguo.

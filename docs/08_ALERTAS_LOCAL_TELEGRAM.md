# 08 — Sistema de Alertas: Local y Telegram

> Diseño del sistema de alertas para notificar cambios de estado, precios objetivo y errores de sistema.
> El sistema actual NO tiene alertas automáticas más allá del reporte semanal en Markdown. Todo lo documentado es una propuesta.

---

## 1. Estado actual de alertas

| Aspecto | Estado |
|---------|--------|
| Alertas automáticas | No existen |
| Reporte semanal | Sí — `reports/weekly/YYYY-MM-DD.md` vía `npm run weekly:screen` |
| Alertas en dashboard | Solo visual (colores semáforo) |
| Telegram | No implementado |
| Email | No implementado |
| Notificaciones del sistema (Windows) | No implementado |
| Historial de alertas | No existe |

---

## 2. Tipos de alertas propuestas (14)

### Alertas de empresas (7)

| # | Tipo | Condición | Severidad |
|---|------|-----------|-----------|
| 1 | **Precio objetivo alcanzado** | Precio ≤ pricePE15 o pricePB15 o grahamFormula | Alta |
| 2 | **Estado cambia a READY_TO_BUY** | Todos los criterios Graham se cumplen | Alta |
| 3 | **Empresa entra a watchlist** | Nueva empresa agregada con estado watchlist | Media |
| 4 | **Tendencia fuerte detectada** | Score tendencia > umbral (criterio técnico) | Media |
| 5 | **Alerta de precio deteriorado** | Precio subió significativamente, MoS disminuyó | Media |
| 6 | **EPS cayó en último reporte** | EPS actual < EPS anterior | Media |
| 7 | **Empresa deja de cumplir Graham** | Antes era READY_TO_BUY, ahora no | Alta |

### Alertas de sistema (7)

| # | Tipo | Condición | Severidad |
|---|------|-----------|-----------|
| 8 | **Datos obsoletos críticos** | Datos de empresa sin actualizar > 30 días | Media |
| 9 | **Error de fuente de datos** | Stooq o Yahoo Finance no responden | Alta |
| 10 | **Fallo del dashboard** | El proceso Vite no responde en localhost | Media |
| 11 | **Fallo de auto-push** | Push a GitHub Pages falló | Media |
| 12 | **Diferencia datos Yahoo vs Stooq** | Discrepancia > 5% en precio | Media |
| 13 | **Ejecución desde equipo no registrado** | device_id no reconocido | Alta |
| 14 | **Error de cálculo** | calcRatios() lanzó excepción | Alta |

---

## 3. Schema completo de alerta

```typescript
interface Alert {
  // Identificación
  id: string                    // UUID único
  alert_type: string            // precio_objetivo, ready_to_buy, etc.
  
  // Empresa (si aplica)
  ticker?: string               // KBH
  company_name?: string         // KB Home
  
  // Estado
  previous_status?: string      // WATCHLIST
  new_status?: string           // READY_TO_BUY
  condition_triggered: string   // "pePb=8.3 ≤ 22.5, debtRatio=0.71 < 1..."
  
  // Datos financieros
  price?: number                // $51.45
  currency: string              // USD
  source: string                // stooq, yahoo, manual
  
  // Temporal
  datetime_cdmx: string         // ISO 8601 en zona America/Mexico_City
  market_close_date: string     // Fecha de la vela que activó la alerta
  
  // Origen del equipo
  device_id: string             // uuid del ordenador
  device_name: string           // "Laptop Eduardo"
  device_role: string           // principal, secundario
  
  // Clasificación
  severity: 'high' | 'medium' | 'low'
  
  // Canales
  channels_attempted: string[]  // ['dashboard', 'telegram', 'markdown']
  channels_succeeded: string[]  // ['dashboard', 'markdown']
  send_errors: Record<string, string>  // { telegram: "Error: 401 Unauthorized" }
  
  // Estado de la alerta
  is_new: boolean               // Aún no vista en el dashboard
  is_repeated: boolean          // Ya se emitió la misma alerta antes
  is_dismissed: boolean         // El usuario la descartó
  suppressed_until?: string     // Suprimida hasta esta fecha/hora
  repeat_count: number          // Cuántas veces se ha repetido
}
```

---

## 4. Días y horarios de alertas formales

### Horario operativo

| Día | Tipo | Hora (CDMX) | Descripción |
|----|------|------------|-------------|
| Lunes | Alerta formal | 18:00 | Cierre de primera vela semanal |
| Martes–Jueves | Alerta ligera | 18:00 | Solo si hay cambios críticos |
| Viernes | Alerta formal | 18:00 | Cierre de semana |
| Cualquier día | Tiempo real | Al detectar | Cambios de estado, errores |

### Nota sobre 18:00 CDMX

El mercado de USA cierra a las 16:00 ET (Eastern Time).
- Cuando USA está en EDT (verano): 16:00 ET = 15:00 CDMX (CDMX está 1 hora detrás)
- Cuando USA está en EST (invierno): 16:00 ET = 14:00 CDMX (CDMX está 2 horas detrás)

**Las 18:00 CDMX son siempre DESPUÉS del cierre del mercado**, por lo que son el horario correcto para ejecutar el screening post-cierre y emitir alertas.

---

## 5. Configuración de Telegram

### Variables de entorno requeridas

En `.env.local` (NO versionar):

```bash
# Telegram
ENABLE_TELEGRAM_ALERTS=false        # Cambiar a true cuando se configure
TELEGRAM_BOT_TOKEN=                 # Token del bot (sin revelar)
TELEGRAM_CHAT_ID=                   # ID del chat donde enviar las alertas
TELEGRAM_ALERT_MIN_SEVERITY=medium  # Mínima severidad para enviar: low/medium/high
```

### Cómo obtener las credenciales de Telegram

1. Crear bot en Telegram con `@BotFather` → `/newbot`
2. Guardar el token en `TELEGRAM_BOT_TOKEN`
3. Enviar un mensaje al bot
4. Obtener `chat_id` con: `https://api.telegram.org/bot{TOKEN}/getUpdates`
5. Guardar en `TELEGRAM_CHAT_ID`

### Formato del mensaje Telegram

```
🟢 ALERTA GRAHAM — KBH (KB Home)
Estado: WATCHLIST → READY_TO_BUY
Precio: $51.45 USD (Stooq)
P/E×P/B: 8.3 ≤ 22.5 ✓
Deuda: 0.71 < 1 ✓
Current Ratio: 8.70 ≥ 2 ✓
Margen de Seguridad: 64.2%
─────────────────────────
📅 2026-06-03 18:02 CDMX
💻 Laptop Eduardo (principal)
```

### Módulo propuesto: `src/lib/telegram.js`

```javascript
// src/lib/telegram.js — PROPUESTO (no existe)
export async function sendTelegramAlert(alert) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!process.env.ENABLE_TELEGRAM_ALERTS || !token || !chatId) return
  
  const text = formatAlertMessage(alert)
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  })
}
```

---

## 6. Canales de alerta y prioridad

```
SIEMPRE: Dashboard local (visual, en la UI)
SIEMPRE: Reporte Markdown en reports/weekly/

SI PUBLIC_DASHBOARD_MODE=true:
  → Actualización en GitHub Pages (solo datos permitidos)

SI ENABLE_TELEGRAM_ALERTS=true:
  → Mensaje en Telegram Bot

SI ENABLE_EMAIL_ALERTS=true (propuesto, no existe):
  → Email al usuario

FUTURO (no implementar aún):
  → Discord
  → Slack
  → Notificaciones del sistema Windows
```

---

## 7. Gestión del ciclo de vida de alertas

### Estados de una alerta

```
nueva → vista → descartada
     → suprimida (hasta fecha X)
     → repetida (si condición persiste)
```

### Reglas de duplicación

```
Si alert_type + ticker + new_status ya existe con is_new=true
→ NO crear nueva alerta, incrementar repeat_count

Si el estado volvió al anterior y regresó a new_status
→ SÍ crear nueva alerta (es un cambio real)

Si alerta fue suprimida hasta fecha X
→ NO enviar Telegram/email hasta esa fecha, pero sí guardar en BD
```

### Reglas de supresión manual

El usuario puede suprimir una alerta desde el dashboard:
- "Suprimir por hoy" → suppressed_until = fin del día
- "Suprimir esta semana" → suppressed_until = viernes 18:00 CDMX
- "Descartar" → is_dismissed = true, no se vuelve a mostrar salvo reset

---

## 8. Historial y persistencia de alertas

Todas las alertas se guardan en la tabla `alerts_emitted` de la BD SQLite.

**Retención propuesta**: Mantener todas las alertas sin límite de tiempo (son livianas en espacio).

**Vista de historial propuesta** en el dashboard:
- Filtrar por ticker
- Filtrar por tipo de alerta
- Filtrar por severidad
- Filtrar por rango de fechas
- Ver razón de activación
- Ver desde qué equipo se generó

---

## 9. Script de alertas propuesto

```javascript
// scripts/alert-dispatcher.js — PROPUESTO (no existe)
// Se ejecuta después de data-ingestion.js

// Lee empresas cuyo estado cambió
// Evalúa reglas de alert_rules
// Genera objetos Alert
// Guarda en alerts_emitted
// Despacha a canales configurados

// Uso:
// node scripts/alert-dispatcher.js --mode all
// node scripts/alert-dispatcher.js --ticker KBH
// node scripts/alert-dispatcher.js --test  (simula alertas sin enviar)
```

---

## 10. Integración con el screening actual

El script `scripts/weekly-screen.js` ya genera reportes Markdown. Para integrarlo con el sistema de alertas:

```
Flujo propuesto:
weekly-screen.js (existente)
    ↓ genera resultados
alert-dispatcher.js (propuesto)
    ↓ evalúa cambios vs estado anterior
    ↓ despacha alertas nuevas
    ↓ actualiza BD
    ↓ envía Telegram si configurado
```

La integración debe ser retrocompatible: `weekly-screen.js` debe seguir funcionando sin alertas si `alert-dispatcher.js` no existe.

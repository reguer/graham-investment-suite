# CLAUDE

Fuente de verdad: `HANDOFF_GRAHAM_ECOSYSTEM.md`.

Prioridad actual: Graham Analyzer. Macro Radar queda preparado como companion hasta migrar el artifact original.

Reglas criticas:

- No tocar `.env` ni secretos.
- No hardcodear API keys.
- No cambiar formulas sin tests y docs.
- Cuidar la contradiccion ADR/TSM: la decision final es ajustar EPS, BVPS, TBVPS y NCAV por `adrRatio`.
- TSM con ADR ratio 5 debe dar `P/E ~7.03`, `P/B ~11.20`, `P/E x P/B ~78.77` y NCAV positivo.
- Mantener artifact standalone funcional con `export default`.

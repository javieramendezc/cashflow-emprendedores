# Flujo Claro

Aplicación web estática para gestionar flujo de caja de emprendedores.

## Incluye

- Registro de ingresos y egresos
- Filtro por mes
- Categorías y método de pago
- Detección de movimientos recurrentes
- Resumen de caja y recomendaciones
- Proyección simple de las próximas 8 semanas
- Persistencia local con `localStorage`

## Cómo abrirla

Abre `/Users/javimc/Documents/Playground/cashflow-emprendedores/index.html` en tu navegador.

Si prefieres servirla localmente:

```bash
cd /Users/javimc/Documents/Playground/cashflow-emprendedores
python3 -m http.server 8080
```

Luego visita `http://localhost:8080`.

## Login real con Supabase

Antes de usar la app con usuarios, ejecuta el SQL de
`/Users/javimc/Documents/Playground/cashflow-emprendedores/supabase-schema.sql`
en **Supabase → SQL Editor**.

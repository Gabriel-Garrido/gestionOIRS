# Guía rápida para agentes de IA

## Stack y comandos
- React 19 + Vite + TypeScript; Tailwind utilitario definido en `src/index.css` (tokens en `docs/design-system.md`).
- Firebase: inicialización en `src/lib/firebase.ts`, reglas en `firestore.rules`/`storage.rules`; credenciales `VITE_*`.
- Dependencias base: `firebase`, `react-hook-form`, `zod`, **`recharts`** (gráficos) y **`xlsx`** (exportar Excel).
- Scripts: `npm run dev`, `npm run build` (`tsc -b` + Vite), `npm run preview`, `fb:*` para CLI Firebase.

## Dominio y servicios
- Tipos/enum oficiales en `src/types/oirs.ts`; sincroniza nuevos campos con los esquemas Zod.
- Operaciones sobre casos, catálogos y eventos en `src/services/oirsRepo.ts`; reutiliza helpers antes de crear nuevas queries y aprovecha `listAllCases` / `listCasesByAllegedStaffAll` para obtener listados completos en exportaciones.
- Métricas calculadas en `src/services/metrics.ts`: convierte rangos `YYYY-MM-DD` a ISO (`startOfDayIso` / `endOfDayIso`), arma agregados (totales, distribuciones, respuesta) y regresa datos listos para la vista.
- Storage: `src/components/FileUpload/` sube a `oirs/cases/{caseId}` cumpliendo las reglas actuales.
- Exportaciones Excel centralizadas en `src/utils/exportExcel.ts`; recibe `OirsCase[]` y contextos opcionales (nombres de sector, columnas estáticas).

## Rutas y navegación
- En `src/App.tsx` todas las vistas protegidas anidan en `MainLayout` dentro de `ProtectedRoute`.
- Items de navbar/móvil se definen en `src/layouts/MainLayout.tsx`; añade aquí cualquier ruta nueva para escritorio y mobile.
- La sección **Métricas** vive en `src/routes/metrics/Metrics.tsx` y enlaza vía `Icon name="chart"`.

## UI y estado compartido
- Biblioteca de UI en `src/components/ui/` (Button, Card, TableContainer, Toast, etc.); respeta estilos existentes usando `cn.ts`.
- Formularios siguen `react-hook-form` + resolvers Zod (ver `CaseForm`).
- Filtros con query-string usan `useQueryParamsFilters`; filtros locales (métricas) se modelan en `src/components/Filters/MetricsFilters.tsx`.

## Métricas y visualizaciones
- `MetricsFilters.tsx` ofrece presets (30/90/180 días/12 meses) y checkboxes por sector/tipo/estado/SLA/canal; extiende `MetricsFilterValue` y `fetchMetrics` juntos para nuevos filtros.
- Gráficos `LineChart`, `BarChart`, `PieChart` dentro de `ChartCard`; actualiza `CHART_LABELS`, `defaultEnabledCharts` y `CHART_COLORS` al añadir paneles.
- KPIs resumidos con `KpiCard` (totales, responded/open, promedio/mediana). Calcula nuevas métricas en el servicio, no en la vista.

## Descarga a Excel
- Botón en `CasesList` (toolbar) exporta los casos filtrados usando `listAllCases`.
- `SectorDetail` y `StaffDetail` añaden botón junto a los filtros de fecha; aprovechan los helpers mencionados y agregan metadatos en `staticColumns`.
- `Metrics` exporta los casos crudos usados en la vista (`metrics.rows`) con nombres de sectores vía `sectorLabelById`.

## Buenas prácticas locales
- Firestore sólo ordena correctamente strings ISO; usa los helpers de fecha existentes.
- Limita `where('in', …)` a ≤10 elementos; valida en UI antes de construir filtros.
- Revisa `firebase.storage.secure.json` antes de cerrar permisos en producción.
- Ejecuta `npm run build` tras cambios en tipos o servicios para captar errores de compilación.

Recuerda documentar aquí nuevos flujos (rutas, servicios, comandos) en cuanto se agreguen.

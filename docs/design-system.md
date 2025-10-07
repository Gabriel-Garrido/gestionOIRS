# Design System 2025 — gestionOIRS

Guía prescriptiva para una UI moderna, accesible (AA) y 100% responsiva (mobile-first) con Tailwind v4, tokens CSS y componentes reutilizables. Todas las pantallas deben optimizarse primero para pantallas pequeñas (<640px) y luego escalar progresivamente.

## 1) Tokens (tema claro)

Tokens declarados en `:root` (ver `src/index.css`). Se exponen en Tailwind vía `theme.extend` usando `var(--token)` (ver `tailwind.config.js`). No se utiliza modo oscuro para priorizar consistencia visual y rendimiento; toda la UI usa una paleta clara con alto contraste.

- Colores base
  - `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-surface-3`
  - `--color-border`, `--color-ring`
  - Contenido: `--content-strong`, `--content-weak`, `--content-muted`
  - Marca/semánticos: `--brand`, `--brand-600`, `--brand-700`, `--success`, `--warning`, `--danger`, `--info`
- Radios: `--radius-sm`, `--radius-md`, `--radius-lg`
- Ritmo: `--gap`, `--spacing-x`, `--spacing-y`
- Sombras: `--shadow-1/2/3`

Sin dark mode: evitar referencias a `.dark`, `dark:` o toggles de tema en la base de código.

Safe areas (iOS notch): aplicar padding dinámico en contenedores pegados a viewport cuando corresponda:

- Header/Footer: `pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]` y `pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]` cuando el contenedor sea fixed.
- Modales full viewport ya consideran 100dvh; el contenido interno usa scroll propio.

## 2) Tipografía y ritmo visual

- Base: Inter/Sans del sistema, escalas utilitarias en `index.css` (`.text-display`, `.text-h1..h4`, `.text-small`).
- Ritmo vertical consistente: `gap`/`space` con pasos 4/8/12/16px; utilidades `.page-container`, `.section-body`, `.form-grid`.
- Densidades: compact (listados/tablas), default (formularios y detalle), comfortable (lectura extensa). Mantener tamaños de toque ≥ 40–44px.

Escala recomendada de fuentes (mobile → desktop):

- Body: 14px → 16px.
- Subtítulos/labels: 12–13px → 14px.
- Títulos de sección: 16–18px → 18–20px.
- Título de página: 18–20px → 22–24px.

## 2.1) Mobile-first y breakpoints

- Mobile-first por defecto; aplicar prefijos `sm: md: lg:` progresivamente.
- Breakpoints sugeridos: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`.
- Contenedores:
  - En móvil: padding `p-4` en `.page-container`.
  - En desktop: ampliar a `px-6`/`px-8` según página.
  - En headers fijos: respetar safe areas (ver arriba) y usar `backdrop-blur` + fondo semitransparente.
- Tamaños de toque mínimos: 40–44px de alto/área, separación de 8–12px entre controles.
- Texto: 14–16px en móvil; 14–18px en desktop. Mantener 1.4–1.6 de line-height.

### 2.3) Navbar moderno

- Header sticky con `backdrop-blur` y fondo semitransparente, respetando safe areas.
- Marca a la izquierda; en móvil, botón de "Menú" con IconButton (tamaño 40–44px) que abre un panel colapsable.
- Navegación desktop visible en línea (links con iconos sutiles y padding táctil).
- Navegación móvil dentro de un panel con transición de altura (`max-height`) y `overflow-hidden` para animación simple y performante.
- Accesibilidad: `aria-expanded` y `aria-controls` en el botón; el panel es un `<nav>` con `aria-label` y cierra con Escape, clic fuera y al navegar.
- Acciones (p. ej. usuario/salir) como iconos a la derecha; evitar controles redundantes (no usar toggles de tema).

## 2.2) Grid responsivo (patrones)

- Formularios: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` con `gap-3/4`.
- Secciones de detalle: apilar en 1 columna en móvil; columnas adicionales en `sm:`/`lg:`.
- Toolbars/filtros: usar `flex-wrap` y `gap-2`; en móvil, filas apiladas. Proveer variante colapsable “Mostrar filtros” cuando superen 2–3 controles.
- Listas en tarjetas (cards) en móvil: `grid grid-cols-1 gap-3` o `flex flex-col gap-3` con tarjetas clicables y botones de acción visibles.

## 3) Capas y elevación

- Superficies: `.elevation-{0..3}` y `.section/.card` combinan fondo + borde + sombra suave.
- Focus ring accesible: `:focus-visible` usa `--color-ring` con `outline-offset: 2px`.

## 4) Patrones de contenedor

- PageContainer/PageHeader (`components/ui/PageHeader.tsx`)
  - Máximo ancho fluido, breadcrumbs + título + acciones.
- Section (`components/ui/Section.tsx`)
  - Header con título/descr/acciones, body con `gap` estándar.
- Card
  - Utiliza clase `.card` base; variantes futuras: neutral/emphasis, densidad compact/comfortable.
- SidePanel (`components/ui/SidePanel.tsx`)
  - Panel lateral derecho, ancho sm/md/lg, scroll independiente.
- Toolbar (`components/ui/Toolbar.tsx`)
  - Fila de acciones/filtros, compactable.
- TableContainer (`components/ui/TableContainer.tsx`)
  - Header sticky y zebra rows.
- FormSection (`components/ui/FormSection.tsx`)
  - Grilla responsiva 1–2–3 cols; errores/ayudas inline.
- Modal/Dialog (`components/ui/Modal.tsx`)
  - Cabecera, cuerpo y footer; usar `role="dialog"` y focus visible.
  - Full viewport mobile (100dvh x 100vw); header/footer sticky; scroll solo en el cuerpo.
  - En desktop, margen horizontal sutil y esquinas redondeadas; `backdrop="blur"` recomendado.
  - Reducir overlays/closes accidentales en flujos críticos: `closeOnOverlayClick={false}`.
  - Respetar `prefers-reduced-motion` (ya implementado con utilidades Tailwind).
- EmptyState (`components/ui/EmptyState.tsx`) y Skeleton (`components/ui/Skeleton.tsx`)
  - Mensajería vacía y placeholders de carga.

## 5) Micro-interacciones

- Transiciones cortas (150–200ms) ya en `.btn` y superficies; hover/active sutiles, focus siempre visible.
- Iconografía: `components/ui/Icon.tsx` (base). Se puede integrar `@heroicons/react` si se desea.
- Estados de interacción táctil: en mobile usar `active:` con feedback visual claro (ligero énfasis de fondo/borde).

## 6) Accesibilidad

- Contraste AA: fondos/contornos y texto con tokens.
- Navegación por teclado: skip link en `MainLayout`, focus visible.
- Modales con encabezado visible, `aria-label`/`title` y cierre por teclado.
  - Trap de foco, `Escape` para cerrar, y `aria-describedby` en el cuerpo.
- Navegación responsive: en mobile, el menú principal debe ser alcanzable con un botón “Menú” (`aria-expanded`, `aria-controls`) y opciones a tamaño táctil.
- Tablas en mobile: si se mantienen, ofrecer scroll horizontal con `overflow-x-auto` y cabecera sticky. Alternativa preferida: tarjetas.

## 7) Ejemplos

Page Header con acción:

```tsx
<PageHeader title="Casos OIRS" actions={<Button>Nuevo caso</Button>} />
```

Section con filtros y tabla:

```tsx
<Section title="Listado" description="Casos filtrables y paginados">
  <Toolbar leading={<CasesFilters ... />} />
  {/* Mobile: tarjetas */}
  <div className="sm:hidden">
    <ul className="flex flex-col gap-3">
      {/* ...CaseCard items... */}
    </ul>
  </div>
  {/* Desktop: tabla */}
  <div className="hidden sm:block">
    <Table ... />
  </div>
```

FormSection 2 columnas:

```tsx
<FormSection title="Datos" columns={2}>
  {/* campos */}
  ...
</FormSection>
```

EmptyState y Skeleton:

```tsx
{
  loading ? <Skeleton className="h-8 w-full" /> : <EmptyState title="Sin resultados" />
}
```

## 8) Estados/SLA

SLA mapeado con `SlaChip`: Dentro/Fuera/Pendiente dentro/Pendiente fuera de plazo con colores semánticos.

## 9) Buenas prácticas

- No bloquear llamadas externas (ej. feriados) — usar fallback local.
- Tipos estrictos con TS y Zod.
- No commitear `.env`; ver README para configuración.

## 10) Tablas y listas responsivas

- En móvil, preferir tarjetas (cards) con los campos clave; ocultar tabla y mostrar lista.
- Si se usa tabla en móvil, habilitar `overflow-x-auto`, columnas esenciales y encabezado sticky.
- Acciones por fila: agrupar en una barra inferior o en botones compactos.
- Paginación en mobile: priorizar botón “Cargar más” o carga incremental por `IntersectionObserver`.

## 11) Formularios mobile-first

- 1 columna por defecto; agrupar en secciones con `FormSection` y títulos claros.
- Inputs accesibles: tamaño mínimo 40px de alto, labels visibles, helper/error text debajo.
- Selects/multiselect: ocupar ancho completo; en móvil usar listas apiladas.
- Botoneras: fijar acciones primarias visibles sin scroll excesivo, usar sticky footer en modal.

## 12) Toolbars y filtros

- `flex-wrap` y `gap-2`; elementos largos deben ser de ancho completo en móvil.
- Botón “Limpiar” y “Aplicar” visibles sin scroll.
- Variante colapsable: en mobile, agrupar filtros dentro de un disclosure “Mostrar filtros”.

## 13) Medios (imágenes, PDF, archivos)

- Previsualización en modal full-viewport con controles sticky, zoom centrado en cursor, pinch-to-zoom y pan con inercia.
- Límite de tamaño, renombrado predecible y feedback de progreso.
- Evitar drag nativo de imágenes; bloquear pan cuando zoom ≤ 100%; doble clic para reset.

## 14) Rendimiento y scroll

- Evitar scroll chaining con `overscroll-contain` en contenedores modales/laterales.
- Usar `content-visibility: auto` en bloques pesados fuera de viewport cuando aplique.
- Respetar `prefers-reduced-motion` en transiciones.
- Evitar layout shifts: reservar alturas mínimas para listas/skeletons.
- Criterio de carga de imágenes/PDFs diferida (`loading="lazy"`) cuando corresponda.

## 15) Consistencia visual

- Tokens de color/espaciado/radio en todos los componentes.
- Botoneras: variantes `primary`, `outline`, `ghost`; mantener densidades coherentes.

## 16) Checklist de verificación responsive (por pantalla)

Aplicar esta lista antes de dar por “Done” una pantalla/componente:

- Se ve y funciona perfecto en 360×740, 390×844, 414×896, 768×1024, ≥1024px.
- No hay desbordes horizontales en mobile (sin `overflow-x` accidental).
- Tap targets ≥ 40px; espaciados coherentes; tipografías legibles.
- Filtros/acciones accesibles: en mobile se ven o están colapsados con un botón.
- Tablas reemplazadas por cards en mobile o con scroll horizontal y header sticky.
- Modales: full viewport en mobile, header/footer sticky, sin scroll chaining.
- Rendimiento: sin jank al hacer scroll; skeletons mientras carga; imágenes lazy cuando aplica.
- A11y: navegación por teclado, focus visible, aria en modales y menús.

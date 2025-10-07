# gestionOIRS — MVP Gestión OIRS (React + Vite + Firebase)

Aplicación MVP para gestionar casos OIRS usando Firebase (Auth, Firestore, Storage), React Router, TypeScript y TailwindCSS.

## Requisitos

- Node.js 18+
- npm 9+

## Configuración inicial

1. Instalar dependencias

```powershell
npm install
```

2. Variables de entorno

Copia `.env.example` a `.env` y completa con las claves de tu proyecto Firebase (todas deben comenzar con `VITE_`).

3. Ejecutar en desarrollo

```powershell
npm run dev
```

Abre la URL mostrada (p. ej. http://localhost:5173). Si el puerto está ocupado, Vite elegirá otro.

4. Build de producción y preview

```powershell
npm run build
npm run preview
```

## Funcionalidades clave

- Autenticación con Firebase (Email/Password y Google opcional).
- Rutas protegidas con redirect a `/login` si no hay sesión.
- CRUD de Casos OIRS en Firestore (`oirs_cases`).
- Adjuntos por caso en Storage `oirs/cases/{id}`.
- Listado con filtros y paginación; chip de SLA.
- Catálogos: Sectores y Funcionarios.
- Auditoría mínima por caso (subcolección `events`).
  - Estados vigentes: en revisión, enviado a funcionario, descargos recibidos, enviado a Dirección, respuesta de Dirección recibida, respuesta enviada, archivado (persistido como `archivado`).
  - Ver también `docs/status-model.md`.

## Datos de demostración (Seeds)

- Existe una página de utilidad en desarrollo en `/dev/seed` que crea:
  - 3 Sectores (San Borja, Parque Forestal, Dávila Larraín)
  - 3 Funcionarios asociados
  - 5 Casos de ejemplo con fechas y SLA calculados
- Requisitos:
  - Debes estar autenticado y en modo desarrollo (Vite `npm run dev`).
  - El enlace aparece en el menú como “Seeds” solo en entorno DEV; también puedes navegar manualmente a `/dev/seed` tras iniciar sesión.
  - La operación no es idempotente; si ejecutas varias veces, creará nuevos documentos.
  - No se crean adjuntos en esta versión.

## Estructura relevante

- `src/lib/firebase.ts`: inicialización Firebase desde variables `VITE_`.
- `src/types/oirs.ts`: Tipos y esquemas Zod del modelo OIRS.
- `src/services/oirsRepo.ts`: Acceso a Firestore (casos, catálogos, eventos).
- `src/routes/`: Casos (lista, formulario, detalle) y catálogos.
- `src/contexts/AuthContext.tsx`: Contexto de autenticación.
- `src/hooks/`: `useSla`, `useQueryParamsFilters`.
- `src/components/`: SlaChip, Table, FileUpload, filtros.
- `firestore.rules` / `storage.rules`: Reglas mínimas (solo auth).

## TailwindCSS

Tailwind v4 configurado vía PostCSS plugin. Las utilidades están disponibles en `src/index.css` mediante `@tailwind base; @tailwind components; @tailwind utilities;`.

## Notas de seguridad

- No se comitea ningún `.env`; usa `.env.example` como referencia.
- Las reglas son mínimas para el MVP; deben endurecerse para roles/ámbitos reales.

## Firebase (scripts útiles)

- Iniciar sesión CLI: `npm run fb:login`
- Emuladores (local): `npm run fb:emulators`
- Deploy de reglas Firestore+Storage (por defecto usa `storage.rules`): `npm run fb:deploy:rules`
- Deploy SOLO Storage DEV (archivo `storage.rules`): `npm run fb:deploy:storage:dev`
- Deploy SOLO Storage SEGURO (deny-all, archivo `storage.rules.secure`): `npm run fb:deploy:storage:secure`

Notas:

- El archivo `firebase.json` referencia `storage.rules` por defecto (útil para desarrollo). Para un despliegue de entorno seguro (deny-all) usa el archivo alternativo `firebase.storage.secure.json` que apunta a `storage.rules.secure`.
- No se exponen claves; todo el manejo se hace vía archivos de reglas y comandos de la CLI de Firebase.

## Política de Firebase Storage

- Desarrollo (`storage.rules`):
  - Lectura: solo usuarios autenticados.
  - Escritura: restringida a la ruta `oirs/cases/{caseId}/**` para usuarios autenticados.
  - El código sube adjuntos con `uploadFile("oirs/cases/{id}", file)` para cumplir estas reglas.
- Producción segura (`storage.rules.secure`):
  - Denegar todo (read/write) por defecto. Usa el script `npm run fb:deploy:storage:secure` si deseas cerrar el acceso completamente y abrirlo más adelante con reglas más finas.

## Design System

Consulta `docs/design-system.md` para paleta, componentes y líneas base de UI.

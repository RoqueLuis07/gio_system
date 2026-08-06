# GM Ventas Pro — CRM & Suite de Ventas

Sistema de gestión de ventas, CRM y mensajería para la venta de diplomados, separado en dos capas independientes:

```
gio_system/
├── backend/     API REST y lógica de negocio (Node.js + Express)
└── frontend/    Interfaz de usuario (HTML, CSS y JavaScript modular)
```

## Backend (`/backend`)

Contiene toda la lógica de negocio, validaciones y persistencia de datos:

- `server.js` — punto de entrada, levanta el servidor Express.
- `src/app.js` — configuración de la app (middlewares, rutas, servido estático del frontend).
- `src/routes/` — definición de endpoints REST.
- `src/controllers/` — lógica de cada recurso (validaciones, cálculos de comisión, carga masiva CSV).
- `src/services/storage.service.js` — persistencia en **Supabase (Postgres)** vía `@supabase/supabase-js`, mapeando entre los nombres camelCase que usa la app y las columnas snake_case de las tablas.
- `src/services/bootstrap.service.js` — crea/actualiza el usuario **superadmin** a partir de variables de entorno cada vez que arranca el servidor.

### Endpoints principales

| Recurso | Endpoints |
|---|---|
| Estado agregado | `GET /api/state` |
| Autenticación | `POST /api/auth/login`, `PUT /api/auth/profile` |
| Usuarios (roles/categorías) | `GET/POST /api/usuarios`, `PUT/DELETE /api/usuarios/:id` |
| Diplomados | `GET/POST /api/productos`, `PUT/DELETE /api/productos/:id` |
| Ventas | `GET/POST /api/ventas`, `PUT/DELETE /api/ventas/:id`, `POST /api/ventas/bulk` (carga masiva) |
| Prospectos (CRM) | `GET/POST /api/prospectos`, `DELETE /api/prospectos/:id` |
| Recordatorios | `GET/POST /api/recordatorios`, `PUT/DELETE /api/recordatorios/:id` |
| Plantillas WhatsApp | `GET/POST /api/plantillas`, `PUT/DELETE /api/plantillas/:id` |
| Parámetros | `GET/PUT /api/parametros` |

### Usuarios y roles

El backend soporta múltiples usuarios con una **categoría (rol)**: `vendedor` o `superadmin`, vía `/api/usuarios` (CRUD completo, con protección para no quedar nunca sin superadmin).

- Al arrancar, el backend crea (o actualiza) automáticamente un usuario **superadmin** a partir de las variables de entorno `ADMIN_USER` / `ADMIN_PASS`.
- Por ahora **no hay una vista en el frontend** para gestionar usuarios (se retiró del menú a pedido); queda como base de API lista para conectar una UI de administración en una próxima iteración.
- Se conserva el usuario demo original (`GM Ventas` / `1908GM`, rol `vendedor`) para no romper el acceso existente.

### Base de datos (Supabase)

Todos los datos (usuarios, diplomados, ventas, prospectos, recordatorios, plantillas, parámetros) viven en tablas Postgres de un proyecto Supabase — ya no hay ningún archivo JSON local. El backend se conecta con la **service_role key** (nunca la `anon`/`public`), que tiene permiso para saltar Row Level Security. Las tablas esperadas: `usuarios`, `productos`, `ventas`, `prospectos`, `recordatorios`, `plantillas`, `parametros` (una sola fila, `id = 1`).

### Cómo ejecutarlo

```bash
cd backend
npm install
cp .env.example .env   # completar SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_USER, ADMIN_PASS
npm start              # http://localhost:4000
```

El backend también sirve los archivos estáticos de `frontend/`, por lo que al iniciarlo la aplicación completa queda disponible en `http://localhost:4000`.

### Variables de entorno

Ver `backend/.env.example`. Resumen:

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | No | Puerto del servidor. Railway la inyecta automáticamente. Por defecto `4000`. |
| `SUPABASE_URL` | **Sí** | URL del proyecto Supabase (Project Settings → API → Project URL). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sí** | Clave secreta `service_role` (Project Settings → API). Nunca exponerla al frontend/navegador. |
| `ADMIN_USER` | Recomendada | Nombre de usuario del superadmin. Por defecto `superadmin`. |
| `ADMIN_PASS` | Recomendada | Contraseña del superadmin. Si no se define, se usa una contraseña por defecto insegura y el servidor lo advierte por consola — **definirla siempre en producción**. |

## Frontend (`/frontend`)

Contiene únicamente la interfaz (UI/UX): maquetación, estilos y la lógica de presentación que consume la API del backend.

```
frontend/
├── index.html          estructura de la aplicación (login, sidebar, vistas)
├── css/styles.css       estilos (tema oscuro, tipografías, componentes)
└── js/
    ├── api.js           cliente HTTP hacia el backend (fetch)
    ├── state.js          estado en memoria de la UI
    ├── format.js         helpers de formato de moneda/inputs
    ├── nav.js             navegación entre vistas
    ├── render.js          orquestador de renderizado (refresca toda la UI tras cada cambio)
    ├── toast.js            notificaciones
    ├── main.js             punto de entrada: inicializa módulos y carga el estado inicial
    └── ui/                 un módulo por vista (auth, productos, ventas, crm, wa-modulo,
                             exportar, recordatorios, calculadora, parametros, clock)
```

Ningún módulo del frontend contiene reglas de negocio (cálculo de comisiones, validaciones de datos, generación de IDs, parseo de CSV): todo eso vive en el backend. El frontend solo se encarga de capturar la interacción del usuario, llamar a la API y pintar el resultado.

### Cómo ejecutarlo

El frontend es estático y no requiere build. La forma más simple es levantar el backend (ver arriba), que ya lo sirve en `http://localhost:4000`.

Si se prefiere servirlo por separado (por ejemplo con `npx serve frontend`), las llamadas a `/api/...` deberán apuntar al backend correspondiente (ajustar `API_BASE` en `frontend/js/api.js` o configurar un proxy).

## Despliegue en Railway

El repositorio incluye `package.json` y `railway.json` en la **raíz** para que Railway pueda construir y arrancar el proyecto automáticamente sin configuración manual de "Root Directory" (Railpack detecta Node a partir del `package.json` raíz, instala las dependencias de `backend/` vía `buildCommand` y arranca con `npm start`, que delega en `backend/server.js`).

1. Crear un nuevo servicio en Railway apuntando a este repositorio, rama `main` (Root Directory = raíz del repo, sin cambios).
2. Configurar las variables de entorno del servicio: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USER`, `ADMIN_PASS`. `PORT` la define Railway automáticamente, no hace falta configurarla.
3. Desplegar. El backend sirve también el frontend, por lo que la URL pública de Railway ya expone la aplicación completa. Como los datos viven en Supabase (no en el disco del contenedor), sobreviven a redeploys y reinicios sin necesidad de un Volume.

## Funcionalidades

- Dashboard con métricas de ventas, comisiones y recordatorios pendientes.
- Gestión de diplomados (crear, editar, eliminar) y carga masiva de alumnos vía texto/CSV.
- Registro y edición de ventas con cálculo automático de comisión.
- CRM de prospectos con estados (nuevo, negociación, ganado, perdido).
- Mensajería vía WhatsApp ("WhatsApp Envíos"): editor de plantillas con modo nuevo/editar inline, adjunto de archivos (copia automática al portapapeles para imágenes) y envío directo con variables {nombre}/{diplomado}.
- Exportación de alumnos a CSV filtrando por diplomado.
- Recordatorios con comentarios e imagen adjunta.
- Calculadora de cuotas y comisiones en tiempo real.
- Parámetros del sistema (métodos de pago, cargos) configurables.

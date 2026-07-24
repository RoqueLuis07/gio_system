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
- `src/services/storage.service.js` — persistencia en un archivo JSON (base de datos basada en archivo).
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

El sistema soporta múltiples usuarios con una **categoría (rol)**: `vendedor` o `superadmin`.

- Al arrancar, el backend crea (o actualiza) automáticamente un usuario **superadmin** a partir de las variables de entorno `ADMIN_USER` / `ADMIN_PASS`.
- El superadmin ve una sección adicional **"Usuarios (Superadmin)"** en el menú, donde puede crear, editar (nombre, contraseña, rol) y eliminar usuarios. No se permite eliminar/degradar al último superadmin del sistema.
- Queda como base para futuras iteraciones: permisos más granulares por categoría (por ejemplo, restringir vistas o acciones específicas según el rol del vendedor).
- Se conserva el usuario demo original (`GM Ventas` / `1908GM`, rol `vendedor`) para no romper el acceso existente.

### Cómo ejecutarlo

```bash
cd backend
npm install
cp .env.example .env   # y completar ADMIN_USER / ADMIN_PASS
npm start              # http://localhost:4000
```

El backend también sirve los archivos estáticos de `frontend/`, por lo que al iniciarlo la aplicación completa queda disponible en `http://localhost:4000`.

### Variables de entorno

Ver `backend/.env.example`. Resumen:

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | No | Puerto del servidor. Railway la inyecta automáticamente. Por defecto `4000`. |
| `DATA_PATH` | No (sí recomendada en Railway) | Ruta absoluta al archivo de datos persistente (ej. `/data/db.json` dentro de un Volume). Si se omite, se usa `backend/.data/db.json`, que **no persiste** entre despliegues en la mayoría de plataformas PaaS. |
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
    └── ui/                 un módulo por vista (auth, productos, ventas, crm, whatsapp,
                             exportar, recordatorios, calculadora, parametros, clock)
```

Ningún módulo del frontend contiene reglas de negocio (cálculo de comisiones, validaciones de datos, generación de IDs, parseo de CSV): todo eso vive en el backend. El frontend solo se encarga de capturar la interacción del usuario, llamar a la API y pintar el resultado.

### Cómo ejecutarlo

El frontend es estático y no requiere build. La forma más simple es levantar el backend (ver arriba), que ya lo sirve en `http://localhost:4000`.

Si se prefiere servirlo por separado (por ejemplo con `npx serve frontend`), las llamadas a `/api/...` deberán apuntar al backend correspondiente (ajustar `API_BASE` en `frontend/js/api.js` o configurar un proxy).

## Despliegue en Railway

1. Crear un nuevo servicio en Railway apuntando a este repositorio, rama `main`.
2. **Root Directory**: `backend` (Railway detecta `package.json` y usa `npm start` como comando de arranque; `npm install` corre automáticamente).
3. Configurar las variables de entorno del servicio: `ADMIN_USER`, `ADMIN_PASS` y, si se agrega un Volume, `DATA_PATH` apuntando a un archivo dentro de ese Volume (ej. `/data/db.json`). `PORT` la define Railway automáticamente, no hace falta configurarla.
4. (Recomendado) Agregar un **Volume** montado en `/data` para que los diplomados, ventas, usuarios, etc. sobrevivan a los redeploys — sin volumen, el almacenamiento por defecto (`backend/.data/db.json`) se reinicia con el seed original en cada despliegue.
5. Desplegar. El backend sirve también el frontend, por lo que la URL pública de Railway ya expone la aplicación completa.

## Funcionalidades

- Dashboard con métricas de ventas, comisiones y recordatorios pendientes.
- Gestión de diplomados (crear, editar, eliminar) y carga masiva de alumnos vía texto/CSV.
- Registro y edición de ventas con cálculo automático de comisión.
- CRM de prospectos con estados (nuevo, negociación, ganado, perdido).
- Mensajería vía WhatsApp con plantillas personalizables ({nombre}, {diplomado}).
- Exportación de alumnos a CSV filtrando por diplomado.
- Recordatorios con comentarios e imagen adjunta.
- Calculadora de cuotas y comisiones en tiempo real.
- Parámetros del sistema (métodos de pago, cargos) configurables.

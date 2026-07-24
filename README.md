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
- `src/services/storage.service.js` — persistencia en `src/data/db.json` (base de datos basada en archivo JSON).

### Endpoints principales

| Recurso | Endpoints |
|---|---|
| Estado agregado | `GET /api/state` |
| Autenticación | `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile` |
| Diplomados | `GET/POST /api/productos`, `PUT/DELETE /api/productos/:id` |
| Ventas | `GET/POST /api/ventas`, `PUT/DELETE /api/ventas/:id`, `POST /api/ventas/bulk` (carga masiva) |
| Prospectos (CRM) | `GET/POST /api/prospectos`, `DELETE /api/prospectos/:id` |
| Recordatorios | `GET/POST /api/recordatorios`, `PUT/DELETE /api/recordatorios/:id` |
| Plantillas WhatsApp | `GET/POST /api/plantillas`, `PUT/DELETE /api/plantillas/:id` |
| Parámetros | `GET/PUT /api/parametros` |

### Cómo ejecutarlo

```bash
cd backend
npm install
npm start          # http://localhost:4000
```

El backend también sirve los archivos estáticos de `frontend/`, por lo que al iniciarlo la aplicación completa queda disponible en `http://localhost:4000`.

Variables de entorno (ver `.env.example`): `PORT` (por defecto `4000`).

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

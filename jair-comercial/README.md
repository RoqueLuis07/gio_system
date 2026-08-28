# Jair Comercial

Catálogo público + panel de administración para Jair Comercial (electrodomésticos, vehículos a batería, juguetes y de todo un poco). Es un proyecto **totalmente independiente** del resto del repositorio (no comparte código, datos ni base con el sistema de diplomados).

```
jair-comercial/
├── server.js          punto de entrada
├── src/                backend (Express)
│   ├── app.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/     auth (sesión) + permisos por sección
│   └── services/       storage (Postgres o JSON local), sesiones, bootstrap
└── public/              frontend estático (sin build)
    ├── index.html        sitio público (catálogo)
    ├── css/site.css
    ├── js/site.js
    └── admin/             panel de administración
        ├── index.html
        ├── css/admin.css
        └── js/            api, editor de texto enriquecido, vistas por sección
```

## Cómo ejecutarlo

```bash
cd jair-comercial
npm install
cp .env.example .env     # ajustar ADMIN_USER / ADMIN_PASS
npm start                # http://localhost:4100
```

- Sitio público: `http://localhost:4100/`
- Panel de administración: `http://localhost:4100/admin/`

Al arrancar por primera vez se crea el usuario administrador (desde `ADMIN_USER`/`ADMIN_PASS`) y se cargan categorías y productos de **demostración** (para que el catálogo no se vea vacío). Podés editarlos o eliminarlos desde el panel sin problema.

## Base de datos

Por defecto, si no hay `DATABASE_URL` configurada, los datos se guardan en un archivo local (`data/db.json`) — ideal para probar sin configurar nada.

En producción (Railway) conviene usar Postgres para que los datos **no se pierdan en cada redeploy**:

1. En el proyecto de Railway, agregar un plugin de **Postgres**.
2. Railway inyecta automáticamente la variable `DATABASE_URL` al servicio (si están en el mismo proyecto, se puede referenciar con `${{Postgres.DATABASE_URL}}`).
3. Al arrancar, el backend crea sola la tabla que necesita (`jair_collections`) — no hace falta ninguna migración manual.

No hace falta tocar código para cambiar de un backend a otro: la sola presencia de `DATABASE_URL` activa Postgres.

## Usuarios y permisos

El panel soporta múltiples usuarios con **permisos personalizados por sección**, gestionables desde *Usuarios* (solo visible para quien tenga ese permiso):

- **Administrador**: acceso total, incluida la gestión de usuarios.
- **Funcionario**: se le asignan permisos específicos por casilla — `productos`, `categorias`, `parametros`, `usuarios`. Un funcionario sin el permiso `productos`, por ejemplo, ni siquiera ve esa sección en el menú, y la API rechaza esas rutas con 403 aunque intente llamarlas directamente.

El sistema siempre exige que quede al menos un administrador activo (no se puede eliminar ni degradar al último).

## WhatsApp y datos de la empresa (todo ajustable desde el panel)

Desde **Ajustes** se configura, sin tocar código:

- Número de WhatsApp (el botón "Abrir chat" del sitio público y el botón de cada producto usan este número).
- Mensaje automático al escribir (con `{producto}` como variable).
- Nombre, eslogan, descripción y logo de la empresa.
- Título/subtítulo del banner principal.
- Colores del sitio.
- Redes sociales (Facebook, Instagram, TikTok).

## Productos (estilo WordPress)

Desde **Productos → Nueva publicación**: nombre, precio y precio de oferta, categoría, galería de imágenes (subida directa), descripción con editor de texto enriquecido (negrita, listas, links), y estado borrador/publicado — igual que un editor de entradas. **Ofertas** es la misma lista filtrada a productos con precio de oferta activo.

## Despliegue en Railway

Este directorio tiene su propio `railway.json`. Para desplegarlo como servicio separado:

1. Crear un servicio en Railway apuntando a este repositorio, con **Root Directory = `jair-comercial`**.
2. Agregar un plugin de Postgres al proyecto (ver sección de base de datos arriba).
3. Configurar variables de entorno del servicio: `ADMIN_USER`, `ADMIN_PASS`, `DATABASE_URL` (o la referencia al plugin de Postgres).
4. Desplegar. Railway define `PORT` automáticamente.

Cuando definan un dominio propio, apunta simplemente a este servicio — no requiere ningún cambio de código.

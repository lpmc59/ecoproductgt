# EcoProduct

Sitio web institucional de **EcoProduct** (soluciones biotecnológicas para el tratamiento de agua).
Producción: <https://ecoproductgt.com>.

## Stack

- **Backend / render**: Node.js + Express 4
- **Vistas**: EJS (SSR, sin build step)
- **Persistencia**: `data/db.json` (JSON plano, se autogenera al primer arranque)
- **Estilos**: CSS puro (sin bundler)
- **Autenticación**: `express-session` + `bcryptjs`
- **Uploads**: `multer`

No hay base de datos externa, no hay build step, no hay dependencias nativas.
Para correrlo en local alcanza con `npm install` + `node server.js`.

## Puesta en marcha

Requisitos: Node ≥ 18 recomendado.

```bash
git clone git@github.com:lpmc59/ecoproductgt.git
cd ecoproductgt

# (Opcional pero recomendado) configurar variables de entorno
cp .env.example .env
# Editar .env — como mínimo poner un SESSION_SECRET aleatorio

npm install
node server.js
```

- Sitio público: <http://localhost:6001>
- Landing BacVita: <http://localhost:6001/bacvita>
- Panel admin: <http://localhost:6001/admin>

Credenciales iniciales (solo la primera vez, cuando aún no existe `data/db.json`):
`admin / admin123`. **Cambiarlas inmediatamente desde `/admin/users`.** Si configurás
`ADMIN_INITIAL_PASSWORD` en el `.env` antes del primer arranque, ese valor se usa en vez
del default.

## Variables de entorno

Ver `.env.example`. Resumen:

| Variable                   | Default        | Notas                                                    |
|----------------------------|----------------|----------------------------------------------------------|
| `PORT`                     | `6001`         | Puerto HTTP.                                             |
| `SESSION_SECRET`           | *(dev-only)*   | **Obligatorio en producción.** Genera uno aleatorio.     |
| `ADMIN_INITIAL_USER`       | `admin`        | Solo primer arranque.                                    |
| `ADMIN_INITIAL_PASSWORD`   | `admin123`     | Solo primer arranque; cambiar desde `/admin/users` luego.|

Para generar un `SESSION_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

## Estructura

```
server.js                     # Entry point Express — rutas públicas y /admin
views/
  index.ejs                   # Home (Fase I + Fase II + Concepto de Negocio)
  category.ejs                # /categoria/:id
  product.ejs                 # /producto/:id (con bloques Fase II opcionales)
  bacvita.ejs                 # /bacvita (landing dedicada, replica de la referencia Canva)
  admin/                      # Panel: login, dashboard, content, products, categories, users
  partials/
    header.ejs, footer.ejs, admin-layout.ejs
    bacvita/                  # Partials de la landing BacVita (header, hero, problems,
                              # solution, process, results, sectors, contact, footer)
public/
  css/bacvita.css             # Estilos BacVita (prefijo .bv-, aislados)
  assets/bacvita/             # Imágenes de la landing BacVita
  images/                     # Imágenes de los productos Fase I
  uploads/                    # Imágenes subidas desde el admin (NO en git)
data/
  db.json                     # Contenido vivo (siteContent, productos, categorías, usuarios).
                              # NO está en git — se autogenera con defaults en el primer arranque.
scripts/
  migrate-v2.js               # Migración idempotente para incorporar Fase II a un db.json previo.
```

## Rutas principales

Públicas:
- `GET /` — home.
- `GET /bacvita` — landing BacVita.
- `GET /categoria/:id` — listado de productos de una categoría.
- `GET /producto/:id` — ficha de producto.

Admin (requieren sesión):
- `GET /admin/login`, `POST /admin/login`, `GET /admin/logout`
- `GET /admin` — dashboard
- `GET|POST /admin/content` — editar textos del sitio y conceptos de negocio
- `GET /admin/products`, `GET|POST /admin/products/edit/:id`, `GET|POST /admin/products/new`
- `POST /admin/products/delete/:id`
- `GET /admin/categories`, `POST /admin/categories/edit/:id`,
  `POST /admin/categories/new`, `POST /admin/categories/delete/:id`
- `GET /admin/users`, `POST /admin/users/new`, `POST /admin/users/delete/:id`,
  `POST /admin/users/change-password/:id`
- `POST /admin/hero-image` — subir imagen de portada

## Flujo de trabajo

```bash
# Antes de empezar
git pull origin main

# Cambios chicos — commit directo a main
git add <archivos>
git commit -m "fix: breve descripción"
git push origin main

# Cambios grandes — rama de feature + PR
git switch -c feature/nombre
# ...trabajar...
git push origin feature/nombre
# Después abrir Pull Request desde GitHub
```

Convención de mensajes: `feat:` / `fix:` / `chore:` / `docs:` / `refactor:`
seguido de una línea corta descriptiva del *por qué*.

## Datos y archivos que NO van al repo

- `node_modules/` — se reinstala con `npm install`.
- `data/db.json` — contenido vivo, distinto en cada entorno.
- `public/uploads/` — imágenes subidas desde el admin, propias de cada entorno.
- `.env`, `.DS_Store`.

Si borrás `data/db.json`, se vuelve a generar con los defaults de `server.js`
en el próximo arranque (**perdés todo lo editado desde el admin**).

## Deploy a producción

La producción se sirve desde `ssh talinda:/home/admin/projects/EcoProduct` con
`pm2` (proceso `ecoproductgt`, puerto 6001) detrás de un `nginx` que termina
TLS en `ecoproductgt.com`. El flujo es `git pull` + restart:

```bash
git push origin main
ssh talinda 'cd /home/admin/projects/EcoProduct && git pull origin main && pm2 restart ecoproductgt'
```

Solo quien tenga la deploy key del servidor y acceso SSH a `talinda` puede desplegar.
`data/db.json` y `public/uploads/` del servidor **no** se tocan en el pull (están
excluidos del repo).

Rollback rápido a la versión anterior:

```bash
ssh talinda 'cd /home/admin/projects/EcoProduct && git fetch --tags \
  && git switch --detach pre-bacvita-production-2026-08-13 \
  && pm2 restart ecoproductgt'
```

## Licencia

Código privado de EcoProduct. Repo público solo para colaboración controlada.

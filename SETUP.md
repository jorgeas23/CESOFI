# Puesta en marcha de CESOFI en otra computadora

Guía para clonar el proyecto desde GitHub y dejarlo corriendo en local.

El repo tiene **todo el código**, pero **a propósito no incluye**: `node_modules/`,
los archivos `.env` (secretos) ni el cliente de Prisma generado. Esta guía cubre
cómo recrear esas piezas.

---

## 1. Requisitos previos

| Herramienta | Versión | Nota |
|---|---|---|
| [Node.js](https://nodejs.org) | 20 o superior (probado en 22) | Incluye `npm` y `npx` |
| [Git](https://git-scm.com) | cualquiera reciente | |
| Cuenta de Supabase | — | La base de datos PostgreSQL + el Storage de evidencias viven ahí |

Para probar la app en el celular: la app de **Expo Go** (Android / iOS).
Para probarla en el navegador no hace falta nada extra.

---

## 2. Estructura del proyecto (monorepo)

```
CESOFI-nuevo/
├── backend/      → API REST (Node + Express + Prisma). Se despliega en Render.
└── app-cesofi/   → App móvil y web (Expo / React Native). Se despliega en Vercel.
```

Cada carpeta tiene su propio `package.json` y se instala por separado.

---

## 3. Clonar el repo

```bash
git clone https://github.com/jorgeas23/CESOFI.git
cd CESOFI
```

---

## 4. Backend (`backend/`)

```bash
cd backend
npm install
```

### 4.1. Variables de entorno

Crea el archivo `backend/.env` (usa `backend/.env.example` como plantilla):

```env
# Base de datos: usar SIEMPRE el "session pooler" de Supabase (IPv4), puerto 5432.
# NO usar el host directo db.<ref>.supabase.co (es solo IPv6 y falla en muchas redes)
# NI el pooler de transacciones (puerto 6543, rompe los prepared statements de Prisma).
# En Supabase: Project Settings → Database → Connection string → "Session pooler".
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"

JWT_SECRET="una-cadena-larga-y-aleatoria"

# Supabase: Project Settings → API
SUPABASE_URL="https://<ref>.supabase.co"
SUPABASE_SECRET_KEY="<service_role key de Supabase>"
SUPABASE_EVIDENCE_BUCKET="evidencias"

PORT=4000

# Orígenes permitidos por CORS, separados por coma. En local se puede dejar en *
CORS_ORIGIN=*

# API externa de SIDEC (sistema de diagnóstico del otro equipo).
# Se pueden dejar vacías: /api/ruta responde "no configurado" sin tumbar el server.
DIAGNOSTICO_API_URL=""
DIAGNOSTICO_API_KEY=""

# Llave que SIDEC manda como X-API-Key al empujarnos un caso (POST /api/externo/casos).
# La generamos nosotros y se la pasamos a ellos. Debe coincidir con la de producción.
RECEPTOR_API_KEY="una-llave-larga-y-aleatoria"
```

> **De dónde sacar cada valor si ya existe en producción:**
> `DATABASE_URL`, `SUPABASE_*` → panel de Supabase.
> `JWT_SECRET`, `RECEPTOR_API_KEY`, `DIAGNOSTICO_*` → panel de Render
> (Environment) del servicio del backend. **Deben ser los mismos que producción**
> para que el backend local hable con la misma base y acepte los mismos tokens.

### 4.2. Cliente de Prisma

```bash
npx prisma generate
```

El esquema (`backend/prisma/schema.prisma`) ya está versionado. Si necesitas
sincronizar la base con el esquema:

```bash
npx prisma db push        # aplica el esquema a la base
npx prisma studio         # explorador visual de la base (opcional)
```

> ⚠️ En Windows, si `prisma generate` / `db push` falla con "archivo en uso",
> detén primero el `npm run dev` (tsx watch bloquea el DLL del cliente de Prisma).

### 4.3. Correr el backend

```bash
npm run dev     # desarrollo, con recarga automática → http://localhost:4000
```

Otros scripts: `npm run build` (compila a `dist/`) y `npm start` (corre lo compilado).

---

## 5. App (`app-cesofi/`)

```bash
cd ../app-cesofi
npm install
```

### 5.1. Variables de entorno

Crea `app-cesofi/.env.local`:

```env
# A dónde apunta la app para llamar al backend.
# Local: http://localhost:4000   ·   Producción: https://cesofi.onrender.com
EXPO_PUBLIC_API_URL=http://localhost:4000
```

> Las variables que empiezan con `EXPO_PUBLIC_` se incrustan en el bundle en
> tiempo de build. Si la cambias, hay que reiniciar `expo start`.

### 5.2. Correr la app

```bash
npx expo start          # abre el panel de Expo
# luego:
#   w  → abrir en el navegador
#   a  → abrir en Android (emulador o Expo Go)
#   i  → abrir en iOS
```

Para web directo: `npm run web`.

---

## 6. Puesta en marcha rápida (resumen)

```bash
git clone https://github.com/jorgeas23/CESOFI.git && cd CESOFI

# Backend
cd backend
npm install
#  → crear backend/.env (ver sección 4.1)
npx prisma generate
npm run dev            # deja esta terminal corriendo

# App (en otra terminal)
cd ../app-cesofi
npm install
#  → crear app-cesofi/.env.local con EXPO_PUBLIC_API_URL=http://localhost:4000
npx expo start
```

---

## 7. Despliegue (referencia)

| Pieza | Servicio | Se actualiza |
|---|---|---|
| `app-cesofi/` | Vercel (`cesofi.vercel.app`) | Solo con push a `main` |
| `backend/` | Render (`cesofi.onrender.com`) | Solo con push a `main` |
| Base de datos + Storage | Supabase | Compartida entre local y producción |

- Las variables de entorno de producción se configuran en los paneles de
  Vercel y Render, **no** en archivos `.env` (esos son solo para local).
- Render en plan gratuito "duerme" el backend tras inactividad: la primera
  petición después de un rato tarda ~50 s en responder.
- SIDEC todavía no tiene URL pública: la integración por "pull" solo funciona
  si el backend y SIDEC están en la misma red; la recepción por "push"
  (`POST /api/externo/casos`) funciona desde cualquier lado.

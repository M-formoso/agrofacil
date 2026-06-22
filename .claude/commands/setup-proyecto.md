# Setup Inicial del Proyecto AgroFácil

Configura la estructura base del proyecto desde cero: monorepo con `backend/` (NestJS + Prisma) y `frontend/` (React + Vite + TS), Docker Compose para desarrollo local y archivos de configuración de Railway.

## Estructura a Crear

```
AgroFacil/
├── frontend/                    # React + Vite + TypeScript + Tailwind + shadcn
├── backend/                     # NestJS + Prisma + Postgres
├── docs/                        # Documentación funcional (incluye AgroFacil_MVP_Especificacion.docx)
├── imagenes/                    # Capturas y mockups
├── docker-compose.yml           # Postgres + backend + frontend (dev local)
├── railway.toml                 # Config Railway monorepo
├── .env.example                 # Variables de entorno (sin valores)
├── .gitignore
├── README.md
└── CLAUDE.md                    # Instrucciones del agente (este archivo)
```

---

## Paso 1: Backend (NestJS)

### 1.1 Crear proyecto
```bash
npx @nestjs/cli new backend --package-manager npm --strict
cd backend
```

Borrar los archivos demo (`app.controller.spec.ts`, etc.) y dejar solo `main.ts`, `app.module.ts`.

### 1.2 Dependencias
```bash
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt \
  @nestjs/throttler @prisma/client zod nestjs-zod bcrypt \
  @anthropic-ai/sdk pino nestjs-pino

npm install -D prisma @types/bcrypt @types/passport-jwt
```

### 1.3 Inicializar Prisma
```bash
npx prisma init --datasource-provider postgresql
```

Editar `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Modelo base — agregar entidades del MVP acá
model Cuenta {
  id         String   @id @default(uuid())
  nombre     String
  activo     Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  usuarios         Usuario[]
  establecimientos Establecimiento[]

  @@map("cuentas")
}

model Usuario {
  id            String   @id @default(uuid())
  cuentaId      String   @map("cuenta_id")
  email         String   @unique
  passwordHash  String   @map("password_hash")
  nombre        String
  activo        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  cuenta        Cuenta   @relation(fields: [cuentaId], references: [id])

  @@map("usuarios")
}

// ... resto de entidades del MVP (ver AgroFacil_MVP_Especificacion.docx sección 3)
```

### 1.4 Estructura de carpetas del backend
```bash
mkdir -p src/{config,common/{decorators,guards,filters,pipes,middleware},modules/{auth,usuarios,cuentas,establecimientos,lotes,campanias,cultivos,lotes-campania,labores,insumos,calculos,ia-carga},prisma}
```

### 1.5 `src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### 1.6 `src/prisma/prisma.service.ts` (con tenant middleware)
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly cls: ClsService) {
    super();
  }

  async onModuleInit() {
    // Middleware que filtra por cuenta_id en todas las queries
    this.$use(async (params, next) => {
      const cuentaId = this.cls.get<string>('cuentaId');
      if (cuentaId && params.args && tenantModels.includes(params.model ?? '')) {
        if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'count') {
          params.args.where = { ...params.args.where, cuentaId };
        }
        if (params.action === 'create' || params.action === 'createMany') {
          params.args.data = { ...params.args.data, cuentaId };
        }
      }
      return next(params);
    });
    await this.$connect();
  }
}

const tenantModels = [
  'Establecimiento', 'Lote', 'Campania', 'LoteCampania',
  'Labor', 'InsumoAplicado', 'Usuario',
];
```

---

## Paso 2: Frontend (React + Vite)

### 2.1 Crear proyecto
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

### 2.2 Dependencias
```bash
npm install @tanstack/react-query @tanstack/react-table zustand axios
npm install react-router-dom react-hook-form @hookform/resolvers zod
npm install recharts lucide-react date-fns clsx tailwind-merge class-variance-authority
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate
npm install -D vite-plugin-pwa workbox-window
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react

npx tailwindcss init -p
```

### 2.3 shadcn/ui
```bash
npx shadcn@latest init
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
```

### 2.4 `tailwind.config.js` (paleta AgroFácil — John Deere Green)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#047C00',   // verde campo (John Deere)
          hover: '#036000',
          light: '#06820B',
        },
        accent: {
          DEFAULT: '#0F7702',   // light olive green
          hover: '#0B5C02',
        },
        sidebar: '#047C00',     // verde principal en sidebar
        'sidebar-foreground': '#FFFFFF',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        border: '#E2E8F0',
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### 2.5 Estructura
```bash
mkdir -p src/{components/{ui,layout,shared},pages,services,stores,hooks,types,utils,constants,lib,test}
```

---

## Paso 3: Docker Compose (dev local)

### `docker-compose.yml`
```yaml
services:
  db:
    image: postgres:15
    container_name: agrofacil_db
    environment:
      POSTGRES_USER: agrofacil
      POSTGRES_PASSWORD: agrofacil_dev
      POSTGRES_DB: agrofacil
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    container_name: agrofacil_backend
    command: npm run start:dev
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://agrofacil:agrofacil_dev@db:5432/agrofacil
      JWT_SECRET: dev-secret-change-me
    depends_on:
      - db

  frontend:
    build: ./frontend
    container_name: agrofacil_frontend
    command: npm run dev -- --host
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000/api/v1

volumes:
  postgres_data:
```

---

## Paso 4: `.env.example`

```bash
# Backend
DATABASE_URL=postgresql://agrofacil:agrofacil_dev@localhost:5432/agrofacil
JWT_SECRET=tu-clave-secreta-cambiar-en-produccion-min-32-chars
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000

# CORS
CORS_ORIGIN=http://localhost:5173

# Anthropic (carga por voz/foto)
ANTHROPIC_API_KEY=

# Frontend (en frontend/.env)
VITE_API_URL=http://localhost:3000/api/v1
```

---

## Paso 5: `railway.toml`

```toml
# Railway monorepo — backend, frontend y Postgres como servicios separados
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/api/v1/health"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

El frontend y backend tienen su propio `railway.toml` adentro de cada carpeta. Railway detecta el monorepo automáticamente.

---

## Paso 6: Primer arranque

```bash
# 1. Copiar variables
cp .env.example .env
# Editar .env con valores reales

# 2. Con Docker (recomendado)
docker compose up -d
docker compose exec backend npx prisma migrate dev --name init

# 3. Sin Docker
cd backend && npm install && npx prisma migrate dev --name init && npm run start:dev
# en otra terminal:
cd frontend && npm install && npm run dev
```

---

## Checklist de verificación

- [ ] `backend/` con NestJS + Prisma + Postgres conectado
- [ ] `frontend/` con Vite + React + Tailwind + shadcn
- [ ] Docker Compose levanta los 3 servicios
- [ ] Endpoint `/api/v1/health` responde 200
- [ ] Frontend carga en `localhost:5173` y se conecta al backend
- [ ] Migración Prisma inicial aplicada con tabla `cuentas` y `usuarios`
- [ ] `.env` configurado, `.env.example` commiteado (sin secrets)
- [ ] `railway.toml` listo para deploy
- [ ] Tests básicos pasan (`npm run test` en backend y frontend)

## Ejemplo de uso
```
/setup-proyecto
```

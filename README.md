# AgroFácil

Plataforma SaaS de gestión para productores agropecuarios argentinos. MVP: costo, margen y punto de equilibrio por lote/cultivo/campaña, en USD y qq/ha. Carga asistida por voz/foto con IA.

> **Documentos fuente**
> - `AgroFacil_v1.0.docx` — pitch del proyecto
> - `AgroFacil_MVP_Especificacion.docx` — especificación técnica del MVP (fórmulas, modelo de datos, pantallas)
> - `CLAUDE.md` — manual del agente que asiste el desarrollo

---

## Stack

- **Backend**: Node 20 + TypeScript + NestJS + Prisma + PostgreSQL + Zod + JWT
- **Frontend**: React 18 + Vite + TypeScript + Tailwind + shadcn/ui + TanStack Query + PWA
- **IA**: Anthropic API (Claude) para parseo de voz/foto
- **Deploy**: Railway (backend + Postgres + frontend)
- **Dev local**: Docker Compose

## Estructura

```
AgroFacil/
├── backend/              # NestJS + Prisma (a crear)
├── frontend/             # React + Vite (a crear)
├── docs/                 # Docs funcionales y técnicas
├── imagenes/             # Capturas y mockups
├── .claude/              # Config del agente
│   ├── settings.json     # Stack y convenciones
│   └── commands/         # Slash commands (skills)
├── docker-compose.yml    # (a crear)
├── railway.toml          # (a crear)
└── CLAUDE.md             # Manual del agente
```

## Cómo empezar (TODO — todavía no scaffoldeado)

```bash
# 1. Setup inicial
cp .env.example .env

# 2. Con Docker
docker compose up -d
docker compose exec backend npx prisma migrate dev --name init

# 3. Sin Docker
cd backend && npm install && npx prisma migrate dev && npm run start:dev
cd frontend && npm install && npm run dev
```

Backend: http://localhost:3000/api/v1 — Frontend: http://localhost:5173

## Comandos del agente disponibles

| Comando | Para qué |
|---|---|
| `/setup-proyecto` | Scaffold inicial del monorepo |
| `/crear-modulo-backend <nombre>` | Crear módulo NestJS (model + service + controller + DTO + tests) |
| `/crear-modulo-frontend <nombre>` | Crear módulo React (tipos + service + hook + componentes + páginas) |
| `/crear-crud-completo <nombre>` | Backend + frontend de una entidad de punta a punta |
| `/crear-endpoint <desc>` | Endpoint NestJS individual |
| `/crear-migracion <desc>` | Migración Prisma |
| `/crear-componente-react <tipo> <Nombre>` | Componente React (tabla/form/card) |
| `/crear-test <modulo>` | Tests Jest (backend) o Vitest (frontend) |
| `/revisar-codigo <ruta>` | Code review contra los estándares del proyecto |
| `/carga-por-voz` | Implementar el feature diferencial (voz/foto → IA → registro) |
| `/calculos-margen` | Implementar el módulo de cálculos (costos, márgenes, punto de equilibrio) |

## Decisiones pendientes (D1–D5)

Antes de la primera migración Prisma definitiva, confirmar con el fundador las 5 decisiones de la sección 9 del docx de especificación (arrendamiento, precio bruto/neto, labores propias, canje, moneda). Ver `CLAUDE.md`.

## Roadmap (90 días)

| Semanas | Foco |
|---|---|
| 1–2 | Setup + Auth + multi-tenant |
| 3–4 | Campos y lotes + Campaña |
| 5–6 | Carga manual |
| 7–8 | Resultado + Resumen (cálculos) |
| 9–10 | Voz/foto + IA |
| 11–12 | Offline + PWA |
| 13 | Dogfood + deploy + primeros usuarios |

---

## Licencia

Privado. Documento confidencial.

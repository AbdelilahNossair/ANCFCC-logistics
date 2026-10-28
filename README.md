# ANCFCC Warehouse and Logistics Management

A full-stack warehouse-management prototype with a React/TypeScript interface and an Express API. It organizes assets, warehouses, recipients, stock movements, deliveries, reports, and archived inventory.

## Implemented areas

- Overview with inventory and movement statistics.
- Asset search, filters, pagination, creation, editing, and detail views.
- Recipient and warehouse management.
- Stock-movement and delivery workflows.
- Report generation endpoints and report history views.
- Archived-asset browsing, restoration UI, and permanent-delete actions.

Some overview visuals use illustrative values or formulas: recent transactions include static entries, trend curves derive variations from aggregate values, and warehouse capacity is estimated. Do not interpret every dashboard chart as measured historical data.

## Architecture and stack

```text
frontend/  React 18 + Vite + TypeScript + Tailwind + lucide-react
     |
     | HTTP JSON at localhost:3001/api
     v
backend/   Express + TypeScript + better-sqlite3
     |
     v
backend/data/ancfcc_warehouse.db
```

The active database adapter is **SQLite**, despite MySQL packages and DB_HOST/DB_USER variables remaining in the manifest/example environment file. The adapter translates some SQL conventions and exposes an asynchronous pool-like interface.

## Local setup

Use Git, Node.js and npm. The native SQLite dependency requires a compatible Node version and may need compiler tools if a prebuilt binary is unavailable.

```bash
git clone https://github.com/AbdelilahNossair/ANCFCC-logistics.git
cd ANCFCC-logistics/backend
npm install
cp .env.example .env
npm run dev
```

The server defaults to port 3001 and calls database setup on startup. Use a local demo database. The repository includes database snapshots; inspect them before deciding which data to retain.

In another terminal:

```bash
cd ANCFCC-logistics/frontend
npm install
npm run dev
```

Open Vite's printed URL, normally `http://localhost:5173`.

Optional demo seeding is available as `npm run seed` in the backend. Review the seed script and back up the database before using it; do not run it against records you need to preserve.

## Configuration

| Setting | Use |
| --- | --- |
| `PORT` | Backend port; default 3001 |
| `NODE_ENV` | Environment label |
| `FRONTEND_URL` | Additional allowed browser origin |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Authentication-related configuration |
| `LOG_LEVEL` | Logging configuration |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Legacy MySQL-style entries; the active adapter opens a local SQLite file |

The browser API URL is hard-coded in `frontend/src/services/api.ts`. Change it when moving the backend or changing its port. Copy environment examples and supply your own values; do not reuse committed runtime configuration.

## API orientation

| Endpoint family | Responsibility |
| --- | --- |
| `GET /health` | Process health response |
| `/api/assets` | Inventory records |
| `/api/movements` | Stock movements |
| `/api/recipients` | Recipient records |
| `/api/warehouses`, `/api/zones` | Storage organization |
| `/api/departments`, `/api/categories` | Reference data |
| `/api/dashboard/stats` | Overview aggregates |
| `/api/reports/...` | Statistics and report generation |
| `/api/archive/assets` | Archived records |

Consult `backend/src/routes/` and `backend/src/server.ts` for methods and payloads. Server middleware includes CORS, Helmet, compression, rate limiting, logging, and validation/error handling. Their presence alone does not establish complete authorization coverage.

## Build and verification

Backend: `npm run build`, then `npm start`. Frontend: `npm run lint`, `npm run build`, then `npm run preview`.

For a manual smoke check, request `http://localhost:3001/health`, load the overview, and create/edit a disposable asset in a local demo database. Check browser network errors and server logs. No automated test script is declared.

## Repository layout and limitations

Controllers implement operations; routes expose them; `backend/src/config/database.ts` defines storage and schema creation; `backend/src/scripts/` contains setup and seeding variants. The frontend's `src/pages/` contains active pages plus duplicated `_old`/`_new` versions. `App.tsx` determines which pages are rendered.

A committed `.env`, SQLite files, and WAL/SHM files need review before reusing this repository with organizational data. Separate demo data from operational records, move configuration outside tracked files, and verify access controls before deployment. No standalone license file is included.

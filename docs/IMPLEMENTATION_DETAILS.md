## Implementation Details (Condensed)

### 1. Introduction

Farm Assist is a **full‑stack TypeScript Progressive Web App (PWA)** that helps smallholder farmers track fields, crops, expenses, harvests, and sales, and see profit in a simple dashboard.  
This document summarizes **how the system is implemented**: the architecture, main technologies, key modules, and the most important technical decisions and trade‑offs.

The goal is to provide a **clear high‑level explanation** that is easy to read in a report, while the full low‑level details remain in `docs/RAW_IMPLEMENTATION_DETAILS.md`.

---

### 2. High‑Level Architecture

Farm Assist follows a **modern React + TanStack Start full‑stack architecture**:

- **Client (UI)**: React + TypeScript, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui
- **Server**: TanStack Start server functions (`createServerFn`), Better Auth
- **Database**: SQLite with Drizzle ORM schema and migrations
- **Runtime & Tooling**: Bun, Vite, `vite-plugin-pwa`, Docker

The system is structured around three main layers:

- **Presentation layer**: React components and pages under `src/routes` and `src/components`
- **Domain / data layer**: Typed utilities and server functions under `src/utils` (fields, crops, expenses, harvests, sales, reports)
- **Persistence layer**: Drizzle schema and database access under `src/db`

Routing, data fetching, and server logic are strongly typed end‑to‑end using TypeScript.

---

### 3. Frontend Implementation

#### 3.1 Routing and Layout

Routing is implemented with **TanStack Router** using **file‑based routes**:

- `/` – public landing page with hero section
- `/sign-in` – authentication (login / sign‑up toggle)
- `/dashboard/*` – protected routes behind authentication:
  - `/dashboard` – main dashboard with summary statistics
  - `/dashboard/fields` – manage fields
  - `/dashboard/crops` – manage crops
  - `/dashboard/expenses` – manage expenses
  - `/dashboard/harvests` – manage harvests
  - `/dashboard/sales` – manage sales
  - `/dashboard/reports` – financial reports (PWA start page)

The dashboard uses a **layout route** (`src/routes/dashboard/route.tsx`) which renders:

- A **sidebar** (`AppSidebar`) for navigation
- A **top navbar** with:
  - Logo (`Logo` component with 🌱)
  - **Time‑based greeting** (Good morning/afternoon/evening + first name)
  - Avatar + profile popover
  - Logout button wrapped in an AlertDialog for confirmation
- A `<main>` area containing `<Outlet />` where each dashboard page is rendered

The `<Outlet />` is wrapped in **React Suspense**, so page layout loads immediately while data fetches in the background.

#### 3.2 UI & Styling

UI is built with **Tailwind CSS** and **shadcn/ui**:

- **Global styles** (`src/styles.css`):
  - Default font: **Ubuntu** via `@fontsource/ubuntu`
  - Base font size: **16px**
  - Primary color: **vibrant green** (`#16a34a`), applied via CSS variables
  - Custom animation for hero text (fade‑in / slide‑up)
  - Subtle grid background for the landing page
- **Reusable components**:
  - `Logo` – shared brand component (“🌱 Farm Assist”)
  - `AppSidebar` – main navigation using shadcn `Sidebar`
  - Buttons, dialogs, cards, tables, avatar, popover from shadcn/ui

Each dashboard feature has a page optimized for its data:

- **Dashboard** – stat cards for:
  - Total fields, active crops, harvests
  - Total expenses, total revenue, net profit
  - Monetary values use a locale‑aware formatter (`Intl.NumberFormat`) from `src/utils/format.ts`
- **Fields & Crops** – card layouts with:
  - Name, season, size (fields)
  - Field, planting date, expected harvest, variety (crops)
  - Delete buttons protected by AlertDialogs
- **Expenses, Harvests, Sales** – table layouts:
  - Expenses: emoji + category, description, date, amount, crop (optional)
  - Harvests: crop, quantity + unit, quality, date, season
  - Sales: crop/harvest, buyer, quantity, date, total amount

Active sidebar items are highlighted with green background and white text. On mobile, selecting a menu item also closes the sidebar for a better experience.

#### 3.3 Data Fetching with TanStack Query + Suspense

All data fetching is done using **TanStack Query**:

- Each domain area exposes **query options** helpers in `src/utils/*.ts`:
  - `fieldsQueryOptions`, `cropsQueryOptions`, `expensesQueryOptions`, `harvestsQueryOptions`, `salesQueryOptions`, `statsQueryOptions`, `reportQueryOptions`
- On the client, the dashboard pages use **`useSuspenseQuery`** instead of `useQuery`:
  - Components assume data is ready (no `isLoading` checks)
  - While data is loading, the thrown Promise is caught by Suspense and a skeleton UI (`PageSkeleton`) is shown
- Mutations (add / delete) are implemented with **`useMutation`**, and on success:
  - Relevant queries are invalidated (`queryClient.invalidateQueries`) to refresh the UI
  - Toast notifications are shown (with emojis) to give feedback

This pattern keeps the components simple and provides smooth loading states without blocking page layout.

---

### 4. Backend, Database, and Domain Logic

#### 4.1 Drizzle ORM Schema

The database is **SQLite**, modeled using **Drizzle ORM** in `src/db/schema.ts`.  
Key tables include:

- `users` – Better Auth users (id, name, email, etc.)
- `fields` – farm fields (name, area, location, season, notes, `userId`)
- `crops` – crops tied to fields (name, variety, season, planting and expected harvest dates, notes)
- `expenses` – farm expenses (category, description, amount, date, season, optional `cropId`, notes)
- `harvests` – harvest records (crop, date, quantity, unit, quality grade, season, notes)
- `sales` – sales records (harvest, buyer, quantity, unit price, total amount, date, season, notes)
- Better Auth auth tables: `sessions`, `accounts`, `verifications`

The schema is designed so that:

- **Season** is stored as `TEXT` on each relevant table (no separate season table), matching the user’s preference (e.g. “2024 Long Rains”).
- Foreign keys link fields → users, crops → fields, harvests → crops, sales → harvests.
- Indexes are defined via Drizzle’s index helpers for efficient queries on common fields.

#### 4.2 Server Functions and Utilities

Business logic is implemented in **server functions** created with TanStack Start’s `createServerFn`.  
Each domain has a corresponding utility module under `src/utils`:

- `fields.ts` – `getFields`, `addField`, `deleteField`
- `crops.ts` – `getCrops`, `addCrop`, `deleteCrop`
- `expenses.ts` – `getExpenses`, `addExpense`, `deleteExpense`
- `harvests.ts` – `getHarvests`, `addHarvest`, `deleteHarvest`
- `sales.ts` – `getSales`, `addSale`, `deleteSale`
- `dashboard.ts` – `getStats` (aggregated counts and financials)
- `reports.ts` – `getReportsData` (net profit, total revenue, total expenses, expenses by category, recent expenses, recent sales)

Typical patterns:

- **Validation**: Input is validated using `zod` schemas on the server side.
- **Queries**: Drizzle is used to query and aggregate data directly in SQLite (e.g. sums for expenses/revenue, counts for dashboard stats).
- **Error handling**: Errors are logged on the server and surfaced to the UI via toast messages.

This keeps the React components focused on presentation while the domain logic lives in dedicated, testable modules.

---

### 5. Authentication and Session Handling

Authentication is implemented with **Better Auth** and Drizzle adapter:

- **Server config** (`src/lib/auth.ts`):
  - Uses Better Auth’s Drizzle adapter configured with the same SQLite database
  - Uses plural table names (`users`, `sessions`, `accounts`, `verifications`) with `usePlural: true`
- **Client config** (`src/lib/auth-client.ts`):
  - Configured for the browser with Better Auth’s client SDK
  - Uses the current origin (no custom base URL required)

The **sign‑in page** (`src/routes/sign-in.tsx`) includes:

- A **toggle** between “Log in” and “Sign up” modes (single page for both flows)
- A form built with shadcn `Card`, `Input`, `Button` components
- After a successful login:
  - The client calls `useSession().refetch()` to refresh session data
  - This ensures the dashboard greeting and avatar update immediately

The dashboard layout uses `useSession()` to:

- Show the user’s initials in the avatar
- Display the first name in the greeting (“Good morning, John 👋”)
- Protect dashboard routes by enforcing authentication via middleware (`authMiddleware`).

Logout is handled by calling `authClient.signOut()` and then refetching the session plus redirecting to the home page.

---

### 6. PWA and Deployment

#### 6.1 PWA Configuration

The app is configured as a **Progressive Web App** using `vite-plugin-pwa` in `vite.config.ts`:

- Web App Manifest (generated by Vite) with:
  - `name`: Farm Assist
  - `short_name`: Farm Assist
  - `start_url`: `/dashboard/reports` (reports page as PWA entry point)
  - `display`: `standalone`
  - `theme_color`: green (`#16a34a`)
  - Icons: `android-chrome-192x192.png`, `android-chrome-512x512.png`, `apple-touch-icon.png`
- The root layout (`src/routes/__root.tsx`) adds important PWA meta tags:
  - `apple-mobile-web-app-capable=yes`
  - `apple-mobile-web-app-status-bar-style=default`
  - `apple-mobile-web-app-title=Farm Assist`
  - `theme-color=#16a34a`
  - `<link rel="manifest" href="/manifest.webmanifest">`

This allows the app to be **installed on mobile home screens**, particularly on iOS (via Safari → “Add to Home Screen”) and Android (Chrome PWA install).

At this stage, the PWA focuses on **installability and standalone experience**; full offline sync is considered future work.

#### 6.2 Docker Deployment and Database Persistence

A **Dockerfile** is provided to build and run the app in production:

- Single stage image using **Bun**:
  - `WORKDIR /app`
  - Copy `package.json`, `bun.lockb`, and install dependencies
  - Copy source code and build the app (`bun run build`)
- Runtime configuration:
  - Create `/data` directory inside the container for SQLite storage
  - `DATABASE_URL` is set to `file:/data/data.db`
  - On container start:
    - Run database migrations (`bun run db:migrate`)
    - Start the server (`bun run server.ts`)

For persistence, the container is run with a **Docker volume** mounted at `/data`:

- This ensures SQLite data survives container restarts and redeployments.
- The volume path and `DATABASE_URL` were carefully aligned to fix an initial persistence bug.

---

### 7. Key Challenges and Solutions (Summary)

1. **Bun + SQLite vs Node tooling**
   - Issue: Some tools (Better Auth CLI, Vite dev server) run under Node and could not import `bun:sqlite`.
   - Solution:  
     - Manually created Better Auth tables in Drizzle schema.  
     - Ensured production runtime uses Bun where `bun:sqlite` is valid.  
     - Kept dev experience stable by avoiding incompatible native drivers.

2. **Authentication + Session Refresh**
   - Issue: After login, the dashboard greeting and avatar did not update immediately.
   - Solution: Called `useSession().refetch()` on successful login to refresh session state on the client.

3. **Database persistence in Docker**
   - Issue: SQLite data was not persisted between container restarts.
   - Cause: Mismatch between Docker volume mount path and `DATABASE_URL`.
   - Solution: Standardized on `/data` for both the volume and `DATABASE_URL=file:/data/data.db`.

4. **UI/UX Iterations**
   - Multiple passes on crop cards, expense layouts, and dashboard stats to:
     - Reduce visual noise
     - Make dates human‑readable
     - Use emojis and colors meaningfully (e.g. red for expenses, green for revenue)
   - Final design emphasizes **clarity, mobile usability, and a friendly feel** for smallholder farmers.

---

### 8. How to Use This Document

- For **reports and presentations**:  
  - This condensed document can be copied almost directly into an “Implementation” chapter.
  - Sections can be shortened or expanded depending on required length.

- For **deeper technical reference**:  
  - See `docs/RAW_IMPLEMENTATION_DETAILS.md` for full, step‑by‑step implementation notes, extended explanations, and additional diagrams.

Together, these documents give both a **high‑level narrative** suitable for non‑technical readers and a **detailed technical record** for developers and examiners.



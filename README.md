# Contour

Contour is a collaborative Kanban board for small teams who want a fast, opinionated place to organize work - without the overhead of a full project-management suite.

Teams organize their work in **workspaces**. Each workspace holds one or more **boards**, each board is made up of **columns** representing stages of work, and each column holds **cards** that move across the board as work progresses. Collaborators join a workspace, get assigned a role, and see changes to a board as they happen.

## What you can do with Contour

- **Organize work visually.** Create boards, add columns for your workflow stages, and track cards as they move through them.
- **Drag and drop.** Reorder cards within a column, move them across columns, and reorder columns themselves - all with full keyboard support as an alternative to the mouse.
- **Collaborate with a team.** Invite people to a workspace with an invite link and assign each member a role.
- **Control access with roles.** Owners, editors, and viewers each have clearly defined permissions, enforced by the API - not just hidden in the interface.
- **See changes live.** When a teammate moves a card, renames a column, or edits a board while you're looking at it, your view updates on its own.
- **Keep details where they belong.** Cards carry a description, an assignee, a due date, and labels, all editable from a dedicated detail view.
- **Trust what you see.** Every change is saved to the database immediately - reload the page and the board looks exactly as you left it.
- **Use it comfortably on any screen.** The board adapts from a full multi-column desktop layout down to a single-column, swipeable view on a phone.

## How it's organized

```
Workspace
 └─ Board
     └─ Column
         └─ Card
```

A **workspace** is the top-level container for a team and its members. A **board** belongs to one workspace and represents a single project or area of work. A **board** is divided into **columns**, and each column holds an ordered list of **cards** - the individual pieces of work being tracked.

Access is controlled at the workspace level. Every member of a workspace has a role - **owner**, **editor**, or **viewer** - and that role applies across every board inside it. Owners manage membership and workspace settings, editors can create and modify boards/columns/cards, and viewers can look but not touch.

New collaborators join through an invite link generated from within a workspace; opening the link and signing in adds them as a member with the role they were invited as.

## Technical overview

Contour is a TypeScript monorepo with three packages:

- **`apps/frontend`** - a React + Vite single-page application. Board interactions (drag-and-drop, keyboard reordering, optimistic updates) are built on [dnd-kit](https://dndkit.com/) and [TanStack Query](https://tanstack.com/query), styled with Tailwind CSS.
- **`apps/backend`** - a Node.js + Express REST API backed by MongoDB (via Mongoose). Routes are organized into a layered structure (routes → middleware → controllers → services → repositories) so authorization and business rules live in one place rather than scattered across handlers. Authentication is JWT-based, and workspace roles are enforced on every request.
- **`packages/shared`** - Zod schemas used by both the frontend and backend, so validation rules and TypeScript types stay in sync between client and server instead of drifting apart.

Live updates are delivered over WebSockets (Socket.io): the server emits an event after a change is persisted, and connected clients update their view of the board without a refresh. The backend always remains the source of truth - sockets never carry state directly between clients.

## Repository structure

```
apps/
  frontend/    React + TypeScript client
  backend/     Express + TypeScript API
packages/
  shared/      Zod schemas and inferred types shared by both apps
docker/        Container definitions for local and production-style runs
docs/          Additional setup documentation
```

## Running locally

### With Docker (recommended)

Docker is the only prerequisite - no local Node.js or MongoDB install needed.

```bash
git clone <repository-url> contour
cd contour
docker compose up --build
```

Then open:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

Contour can also be run using its containerized Docker setup for production-style verification and deployment. See [`docs/DOCKER_SETUP_AND_DEPLOYMENT.md`](./docs/DOCKER_SETUP_AND_DEPLOYMENT.md) for the complete instructions, including troubleshooting and deploying to production.

### Without Docker

Requirements: Node.js 20+, npm 10+, and a running MongoDB instance (local or a hosted connection string).

```bash
npm install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
npm run dev
```

This starts the backend and frontend together. To run them separately, use `npm run dev:backend` or `npm run dev:frontend`.

Other useful commands:

```bash
npm run build        # build shared, backend, and frontend in order
npm run typecheck
npm run lint
npm run test
```

`packages/shared` must be built before the backend or frontend can type-check or build against it - `npm run build` and `npm run typecheck` already handle this ordering for you.

### Environment variables

Backend configuration (`apps/backend/.env`) is validated at startup - `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, and related values must be present and well-formed or the server refuses to start. See `apps/backend/.env.example` and `apps/frontend/.env.example` for the variables each app needs locally, and never commit a real `.env` file.

## Deployment

The frontend deploys to Vercel (`vercel.json`), the backend deploys to Render (`render.yaml`), and the database runs on MongoDB Atlas. Full deployment steps and environment variable reference are in [`docs/DOCKER_SETUP_AND_DEPLOYMENT.md`](./docs/DOCKER_SETUP_AND_DEPLOYMENT.md#13-production-architecture).

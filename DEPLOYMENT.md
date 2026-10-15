# Railway Continuous Deployment (CD) Setup Guide

This repository is configured with an automated Continuous Deployment (CD) pipeline using GitHub Actions to deploy both the **Backend** and **Frontend** services to **[Railway](https://railway.app)**.

---

## 🚀 How the Pipeline Works

Whenever you push to the `main` (or `master`) branch or trigger a manual deployment:
1. **Quality Gate (`validate`)**:
   - Generates Prisma client and compiles the backend TypeScript.
   - Runs frontend linting (`oxlint`), unit tests (`vitest`), and production bundle build (`vite build`).
2. **Backend Deployment (`deploy-backend`)**:
   - Applies pending Prisma database migrations using `railway run npm run prisma:deploy`.
   - Deploys the backend Docker container via `railway up --detach`.
   - Probes `/api/health` to confirm the backend is up.
3. **Frontend Deployment (`deploy-frontend`)**:
   - Deploys the frontend Nginx + Vite container via `railway up --detach`.
   - Probes `/health` to confirm the frontend is up.

---

## 🔑 GitHub Secrets Configuration

Go to your repository on GitHub:
**Settings** ➡️ **Secrets and variables** ➡️ **Actions** ➡️ **New repository secret**

### 1. Required Secret

| Secret Name | Required | Description | Where to find |
|---|---|---|---|
| `RAILWAY_TOKEN` | **Yes** | Your Railway Project or Account Token | In Railway: **Project Settings** ➡️ **Tokens** ➡️ **New Token** (or Account Settings ➡️ Tokens) |

> [!TIP]
> A single **Project Token** created in your Railway project has access to deploy both the `backend` and `frontend` services in that project!

---

### 2. Optional Customization Secrets

If your service names or URLs in Railway differ from the defaults:

| Secret Name | Default | Description |
|---|---|---|
| `RAILWAY_BACKEND_SERVICE` | `backend` | Name of your backend service inside your Railway project |
| `RAILWAY_FRONTEND_SERVICE` | `frontend` | Name of your frontend service inside your Railway project |
| `BACKEND_PUBLIC_URL` | *None* | Railway public domain for backend (e.g. `https://backend-production.up.railway.app`) for health checks |
| `FRONTEND_PUBLIC_URL` | *None* | Railway public domain for frontend (e.g. `https://frontend-production.up.railway.app`) for health checks |

---

## 🛠️ Railway Project Configuration Checklist

In your Railway project dashboard, make sure you have:
1. **PostgreSQL Database Service**: Created via **+ New** ➡️ **Database** ➡️ **Add PostgreSQL**.
2. **Backend Service**:
   - Set Root Directory to `/backend` (or uses [`backend/railway.json`](file:///Users/shamsheer/Documents/GitHub/MY-BOOK/backend/railway.json)).
   - Environment variables set in Railway:
     - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
     - `JWT_SECRET` = `<your-jwt-secret>`
     - `CLIENT_URL` = `https://<your-frontend-domain>.up.railway.app`
     - `PORT` = `5000`
3. **Frontend Service**:
   - Set Root Directory to `/frontend` (or uses [`frontend/railway.json`](file:///Users/shamsheer/Documents/GitHub/MY-BOOK/frontend/railway.json)).
   - Environment variable set in Railway:
     - `VITE_API_URL` = `https://<your-backend-domain>.up.railway.app/api`

---

## 🕹️ Manual Deployments (`workflow_dispatch`)

You can trigger deployments on demand without committing code:
1. Go to the **Actions** tab in GitHub.
2. Click **CD - Continuous Deployment (Railway)** on the left menu.
3. Click **Run workflow**.
4. Choose the target service:
   - `all` (Deploys both Backend & Frontend)
   - `backend` (Deploys only Railway Backend & runs Prisma migrations)
   - `frontend` (Deploys only Railway Frontend)
5. Choose whether to run database migrations (checked by default).

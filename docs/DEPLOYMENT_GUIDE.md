# CloudVuln - Production Deployment Guide

This guide provides step-by-step instructions for deploying the **CloudVuln** security engine to production using **Vercel** for the frontend and **Render** for the backend API server and persistent SQLite database.

---

## 📋 Prerequisites & Tools

- GitHub Account (with project repository pushed)
- [Vercel Account](https://vercel.com)
- [Render Account](https://render.com)
- Python 3.10+ & Node.js 18+ locally

---

## 🛠️ Part 1: Backend Deployment on Render

### Step 1: Create Web Service on Render

1. Log into your **Render Dashboard** (`https://dashboard.render.com`).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository containing `cloudvuln`.
4. Configure service parameters:
   - **Name**: `cloudvuln-api`
   - **Region**: Oregon (US West) or nearest region
   - **Branch**: `main`
   - **Root Directory**: (Leave blank)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn -c backend/gunicorn.conf.py backend.main:app`

### Step 2: Attach Persistent Disk Storage

Because CloudVuln uses SQLite WAL mode, database state must be stored on persistent disk:

1. In your Render Web Service settings, scroll to **Disks**.
2. Click **Add Disk**:
   - **Name**: `cloudvuln-data`
   - **Mount Path**: `/var/data`
   - **Size**: `1 GB` (or larger as needed)

### Step 3: Configure Backend Environment Variables

In the Render Web Service **Environment** tab, set the following environment variables:

| Key | Recommended Value | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `production` | Enables production error handling |
| `LOG_LEVEL` | `INFO` | Controls logging verbosity |
| `PORT` | `8000` | Internal application port |
| `BIND` | `0.0.0.0:8000` | Binding network interface |
| `SECRET_KEY` | `[Generate 64-char hex]` | Primary JWT signature key |
| `REFRESH_SECRET_KEY` | `[Generate 64-char hex]` | JWT Refresh token key |
| `ALLOWED_ORIGINS` | `https://cloudvuln-frontend.vercel.app` | Allowed CORS origins |
| `DATABASE_URL` | `sqlite:////var/data/cloudvuln.db` | Persistent SQLite file path |

Click **Save Changes**. Render will trigger automatic deployment.

---

## 🚀 Part 2: Frontend Deployment on Vercel

### Step 1: Import Project into Vercel

1. Log into **Vercel Dashboard** (`https://vercel.com/dashboard`).
2. Click **Add New...** -> **Project**.
3. Import your `cloudvuln` repository.

### Step 2: Configure Build Settings & Environment Variables

1. **Framework Preset**: `Vite`
2. **Root Directory**: `./`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://cloudvuln-api.onrender.com/api` (Replace with your actual Render API URL)

6. Click **Deploy**.

---

## 🔄 Part 3: Automated Database Backup Setup

To automate daily backups on Render:

1. Open SSH terminal in Render Web Service or set up a Cron Job.
2. Execute the included online backup utility:
   ```bash
   python backend/backup_db.py
   ```
3. Backup files will be stored safely in `/var/data/backups/cloudvuln_backup_YYYYMMDD_HHMMSS.db`.

---

## ✅ Deployment Verification Checklist

- [ ] Frontend successfully deployed on Vercel without build errors.
- [ ] Backend API responding to health check: `GET https://cloudvuln-api.onrender.com/api/health`.
- [ ] Login and Registration functional with JWT tokens persisted.
- [ ] New scan trigger creates vulnerability records in persistent SQLite DB `/var/data/cloudvuln.db`.
- [ ] PDF and HTML executive report downloads function cleanly.

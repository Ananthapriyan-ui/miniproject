# 🛡️ CloudVuln - Cloud Infrastructure & Security Vulnerability Engine

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20WAL-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org)

**CloudVuln** is an enterprise-grade cloud security scanner and vulnerability management platform designed for DevSecOps, Cloud Architects, and Security Engineers. It delivers deep static and dynamic vulnerability analysis across multi-cloud environments (AWS, Azure, GCP), Docker container images, and Infrastructure-as-Code (Terraform, Kubernetes, CloudFormation) configurations.

---

## 🌟 Features

- 🔐 **Enterprise Authentication**: SecOps-grade JWT authentication with sliding access tokens and HTTP-only refresh tokens.
- ⚡ **Multi-Vector Security Scanner**:
  - **Cloud Infrastructure**: AWS IAM policy misconfigurations, public S3 buckets, open security groups (0.0.0.0/0), unencrypted EBS volumes.
  - **Container Security**: Vulnerable base images, root privilege execution, exposed secrets, missing resource limits.
  - **Infrastructure as Code (IaC)**: Terraform wildcard permissions, Kubernetes privileged containers, unencrypted S3 state files.
- 📊 **Real-Time Analytics & Dashboard**: Instant visibility into risk scores, severity breakdowns (Critical, High, Medium, Low), and historical trend analysis.
- 📄 **Executive PDF & HTML Reports**: Dynamic compliance and audit report generation with executive summaries, CVSS severity metrics, and remediation guides powered by ReportLab.
- 🛡️ **Rate Limiting & Security Safeguards**: Built-in sliding-window rate limiting (100 req/min per IP), security headers, CORS origin enforcement, and safe error obscuration.
- 💾 **High-Performance Database Engine**: Production SQLite configuration featuring Write-Ahead Logging (WAL) mode, 64MB memory caching, and zero-downtime online backup automation.

---

## 📁 Folder Structure

```text
cloudvuln/
├── backend/
│   ├── analyzer.py            # Vulnerability detection engine & rules database
│   ├── backup_db.py           # Zero-downtime online SQLite backup utility
│   ├── cloudvuln.db           # SQLite production database (WAL mode)
│   ├── config.py              # Centralized environment & security configuration
│   ├── database.py            # SQLAlchemy engine, session maker, WAL pragmas
│   ├── gunicorn.conf.py       # Production Gunicorn / Uvicorn worker settings
│   ├── main.py                # FastAPI app bootstrap, middleware, & endpoints
│   ├── models.py              # SQLAlchemy ORM models (User, Scan, Vulnerability)
│   ├── report_generator.py    # ReportLab PDF & HTML executive report builder
│   ├── requirements.txt       # Pinned Python production dependencies
│   ├── schemas.py             # Pydantic request/response validation schemas
│   ├── security.py            # Password hashing & JWT token lifecycle handlers
│   ├── seed_data.py           # Database seeding & initial mock vulnerability scans
│   └── .env.example           # Backend production environment template
├── docs/
│   ├── DEPLOYMENT_GUIDE.md    # Vercel & Render production deployment guide
│   ├── PROJECT_DOCUMENTATION.md# System architecture, data flow & security specs
│   └── USER_MANUAL.md         # End-user operational manual & feature guide
├── src/
│   ├── components/            # Reusable UI components & navigation layouts
│   ├── context/               # AuthContext state management
│   ├── lib/                   # API client, token refresh logic & custom hooks
│   ├── pages/                 # Dashboard, Scanner, ScanHistory, Report pages
│   ├── App.jsx                # React Router navigation & route guards
│   ├── main.jsx               # React DOM entrypoint
│   └── index.css              # Modern dark-mode design system & CSS rules
├── dist/                      # Production compiled frontend asset bundle
├── index.html                 # Single page application HTML entrypoint
├── package.json               # Frontend dependencies & build scripts
├── Procfile                   # Process file for Render web service deployment
├── render.yaml                # Render Infrastructure-as-Code deployment blueprint
├── requirements.txt           # Root production Python dependencies
├── vercel.json                # Vercel SPA routing & security headers config
├── vite.config.js             # Vite build configuration & chunk optimization
└── .env.example               # Root frontend environment template
```

---

## 🚀 Installation & Local Setup

### Prerequisites

- **Python**: Version 3.10+
- **Node.js**: Version 18+ (LTS)
- **npm**: Version 9+

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install production dependencies
pip install -r requirements.txt

# Start backend server in development mode
py -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup

```bash
# Open a new terminal in project root
cd cloudvuln

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend application will be running at `http://localhost:3000` with automated proxying to the backend API at `http://127.0.0.1:8000/api`.

---

## ⚙️ Environment Configuration

### Frontend (`.env`)

```ini
# Production API backend URL (Leave blank if using Vercel proxy rewrites)
VITE_API_URL=https://cloudvuln-api.onrender.com/api
```

### Backend (`backend/.env`)

```ini
PROJECT_NAME="CloudVuln Security Engine"
APP_ENV=production
LOG_LEVEL=INFO

# Generate strong 64-character secrets in production
SECRET_KEY="c44ba6a9e105e197d1979927b233a0058bbf9a89d70dfef198a287fa44e782a1"
REFRESH_SECRET_KEY="e9b92209706fb6b559779dfbb7aa27e7f6d4d12c8b7f23a9d90e8f7a81234567"
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Allowed CORS origins (comma-separated string or array)
ALLOWED_ORIGINS="https://cloudvuln-frontend.vercel.app,http://localhost:3000"

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

# Persistent SQLite database location
DATABASE_URL="sqlite:////var/data/cloudvuln.db"
```

---

## 📡 API Documentation

Interactive Swagger API documentation is available at `/api/docs` and ReDoc format at `/api/redoc`.

### Key Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new SecOps user account | ❌ |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT tokens | ❌ |
| `POST` | `/api/auth/refresh` | Refresh expired access token | ❌ |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | ✅ |
| `GET` | `/api/scans` | List all historical vulnerability scans | ✅ |
| `POST` | `/api/scans` | Trigger new Cloud/Container/IaC security scan | ✅ |
| `GET` | `/api/scans/{scan_ref}` | Fetch detailed scan result & findings | ✅ |
| `GET` | `/api/reports/{scan_ref}/download` | Download PDF or HTML executive audit report | ✅ |
| `GET` | `/api/analytics/summary` | Fetch dashboard analytics & severity counts | ✅ |
| `GET` | `/api/health` | Health check endpoint for load balancers | ❌ |

---

## 🖼️ Application Screenshots Section

```text
+-------------------------------------------------------------------------------+
|  🛡️ CLOUDVULN SECURITY DASHBOARD                                              |
+-------------------------------------------------------------------------------+
|  [ Total Scans: 24 ]  [ Risk Score: 8.4/10 ]  [ Critical Findings: 3 ]        |
+-------------------------------------------------------------------------------+
|  Vulnerability Trend Chart                                                    |
|   10 |  *                                                                     |
|    5 |  *    *    *                                                           |
|    0 +-------------------                                                     |
|       Mon  Tue  Wed                                                           |
+-------------------------------------------------------------------------------+
|  Recent Scans List                                                            |
|  - SCAN-2026-AWS-01  | AWS Production VPC    | High Risk   | 2026-07-29 18:00 |
|  - SCAN-2026-K8S-02  | Production K8s Cluster| Critical    | 2026-07-29 14:20 |
+-------------------------------------------------------------------------------+
```

*(Refer to `docs/USER_MANUAL.md` for complete screenshot guides and interface walk-throughs).*

---

## 🔮 Future Enhancements

- 🌐 **AWS / Azure / GCP Live Cloud IAM Integration**: Direct OAuth connection to query live cloud provider APIs via SDKs (boto3, azure-mgmt, google-cloud).
- 🔔 **Slack & Webhook Alerts**: Real-time notifications dispatched to DevSecOps channels upon critical vulnerability detection.
- 🤖 **AI-Driven Remediation Generator**: Automatic generation of custom Terraform/CloudFormation code patches to resolve flagged misconfigurations.
- 🗄️ **PostgreSQL / Enterprise DB Driver**: Native support for Amazon RDS / PostgreSQL for large-scale enterprise deployments.

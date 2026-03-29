# University HRM — Frontend

React frontend for the University HRM System, built with an earthy & professional design language.

---

## Tech Stack

- **React 18** + React Router v6
- **Recharts** — dashboard charts
- **Axios** — API client with JWT interceptors
- **Google Fonts** — Playfair Display + DM Sans
- Pure CSS variables — no UI library dependency

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set API URL (edit .env if backend runs elsewhere)
#    REACT_APP_API_URL=http://localhost:8000/api/v1

# 3. Start dev server
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Login Credentials

| Role        | Email                  | Password   |
|-------------|------------------------|------------|
| Admin       | admin@uni.edu          | admin123   |
| HR          | hr@uni.edu             | hr123      |
| HOD (CS)    | hod.cs@uni.edu         | hod123     |
| Accountant  | accountant@uni.edu     | acc123     |
| Employee    | employee@uni.edu       | emp123     |

> Click the role pill buttons on the login page to auto-fill credentials.

---

## Pages & Role Access

| Page              | Admin | HR | HOD | Accountant | Employee |
|-------------------|-------|----|-----|------------|----------|
| Dashboard         | ✓     | ✓  | ✓   | ✓          | ✓        |
| Employees         | ✓     | ✓  | —   | —          | —        |
| Departments       | ✓     | ✓  | —   | —          | —        |
| Leave             | ✓     | ✓  | ✓   | ✓          | ✓        |
| Attendance        | ✓     | ✓  | ✓   | ✓          | ✓        |
| Payroll           | ✓     | ✓  | —   | ✓          | ✓ (own)  |
| Onboarding        | ✓     | ✓  | —   | —          | ✓ (own)  |
| Performance       | ✓     | ✓  | ✓   | ✓          | ✓        |
| AI Chat           | ✓     | ✓  | ✓   | ✓          | ✓        |
| Audit Logs        | ✓     | —  | —   | —          | —        |

---

## Project Structure

```
src/
├── pages/           # One file per module
│   ├── Login.js
│   ├── Dashboard.js
│   ├── Employees.js
│   ├── Departments.js
│   ├── Leaves.js
│   ├── Attendance.js
│   ├── Payroll.js
│   ├── Onboarding.js
│   ├── Performance.js
│   ├── Chat.js
│   └── AuditLogs.js
├── components/
│   ├── layout/      # Sidebar, AppLayout, ProtectedRoute
│   └── ui/          # Btn, Card, Table, Modal, Input, Toast…
├── context/         # AuthContext (JWT + user state)
├── services/        # api.js — all Axios calls grouped by module
└── index.css        # CSS variables (earthy theme)
```

---

## Key Design Decisions

- **Earthy palette** — soil (`#2C1A0E`), terracotta (`#C4622D`), sage (`#6B7C5C`), cream (`#F5ECD7`)
- **Playfair Display** headings + **DM Sans** body — refined, academic feel
- **Collapsible sidebar** — icon-only mode for compact screens
- **Role-based rendering** — sidebar items and page access adapt to logged-in role
- **JWT auto-refresh** — 401 responses automatically redirect to login
- **Toast notifications** — non-blocking feedback on all actions

---

## Connecting to Backend

Make sure your FastAPI backend is running:

```bash
# In the backend directory
uv run uvicorn app.main:app --reload --port 8000
```

Or via Docker:

```bash
docker-compose up
```

The frontend expects CORS to be enabled on `http://localhost:3000` in your FastAPI app.
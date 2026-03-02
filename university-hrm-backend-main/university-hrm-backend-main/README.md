# University HRM System - Backend

FastAPI + Async SQLAlchemy + PostgreSQL backend for a modern University Human Resource Management System.

Built with clean architecture, full JWT Authentication + Role-Based Access Control (RBAC), and ready for frontend integration.

---

 🚀 Quick Start 

1. Clone the repository
```bash
git clone https://github.com/Divyansh1132/university-hrm-backend.git
cd university-hrm-backend

```

2. Backend Setup (Local Development)

Bash# Create virtual environment
uv venv

# Activate
# Windows
.venv\Scripts\activate

# Install dependencies
uv pip install -r requirements.txt

# Run the server
uv run uvicorn app.main:app --reload --port 8000

```
```

3. First Time Setup (Run Once)
Bash# Seed default data (Admin, HR, Accountant, HOD, Employee + Departments)
uv run python seed.py
```
```
4. API Documentation

Interactive Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
OpenAPI JSON: http://localhost:8000/openapi.json

All protected routes require Bearer <token> in Authorization header.
```
```

🛠 Tech Stack

Framework: FastAPI (Python 3.13)
Database: PostgreSQL + SQLAlchemy 2.0 (async)
ORM: Async SQLAlchemy
Migrations: Alembic
Auth: JWT + Argon2 password hashing
Role System: Admin, HR, Department Head, Accountant, Employee
Dependency Management: uv / pip

```
```
Project Structure
textuniversity-hrm-backend/
├── app/
│   ├── api/           # Routers (v1/auth, v1/employees, v1/departments, ...)
│   ├── core/          # Config, security, logging
│   ├── db/            # Models, session, base
│   ├── schemas/       # Pydantic models
│   ├── services/      # Business logic
│   └── main.py
├── alembic/           # Database migrations
├── seed.py            # Default data (Admin, HR, etc.)
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```
```
🔑 Key Features Implemented

Full JWT Authentication + Refresh-ready structure
Role-Based Access Control (RBAC) with dependency guards
Employee Self-Service (/me profile view/update)
HR Management (Create/List/View Employees)
Department Management
Accountant role ready for Payroll module
Proper leave approval hierarchy (HOD → HR) planned next
```
```
🌐 Frontend Integration Guide
Base URL: http://localhost:8000/api/v1
Auth Flow:

POST /api/v1/auth/login → get access_token
Store token (localStorage / context)
Add Authorization: Bearer <token> to every protected request
```
```
🤝 For Frontend Developer

All endpoints are RESTful and follow standard HTTP status codes
Request/Response models are clearly defined in Swagger
Protected routes return 401 or 403 with clear messages
Feel free to ask me (Divyansh) anything about any endpoint
```





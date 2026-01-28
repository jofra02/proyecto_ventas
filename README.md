# Enterprise ERP

A modern, full-stack ERP solution built with **FastAPI** (Python) and **React** (Vite).  
Features a modular monolith architecture designed for scalability and maintainability.

---

## 🚀 Quick Start (Production / Docker)

The easiest way to run the full stack (Frontend + Backend + Database) is using Docker Compose.

### Prerequisites
- Docker & Docker Compose installed.

### Steps
1. **Clone the repository.**
2. **Start the stack:**
   ```bash
   docker-compose up -d
   ```
   This will spin up:
   - **Frontend**: `http://localhost:80` (Served via Nginx)
   - **Backend**: Internal communication via `erp_net`
   - **Database**: Postgres 15 (volume persisted)

3. **Access the App:**  
   Open [http://localhost](http://localhost) in your browser.

---

## 🛠️ Local Development

If you want to run the services individually for development.

### 1. Database & Environment
- **Security First**: This project enforces Strict Environment Separation.
- **Backend Secrets**: Copy `backend/.env.example` to `backend/.env`.
  ```bash
  cp backend/.env.example backend/.env
  ```
  *(By default, it uses SQLite for local dev if no DB credentials are set)*

- **Frontend Config**: Copy `frontend/.env.example` to `frontend/.env`.
  ```bash
  cp frontend/.env.example frontend/.env
  ```

### 2. Backend (FastAPI)
Using `uv` (recommended) or standard `pip`.

```bash
cd backend

# Option A: Using uv (Fastest)
uv sync
uv run uvicorn app.main:app --reload

# Option B: Standard pip
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```
*API docs available at: http://localhost:8000/docs*

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*App available at: http://localhost:5173* (Note: Ensure `frontend/.env` points to `http://localhost:8000/api/v1`)

---

## 📦 Modules
- **IAM**: User management, Roles (RBAC), Authentication.
- **Catalog**: Product management, Categories, Pricing.
- **Inventory**: Stock tracking, Movements, Adjustments.
- **Sales**: Point of Sale (POS), Sales History, Analytics.
- **Customers**: CRM, Account Balance.
- **Payments**: Payment methods, Transaction recording.
- **Admin**: System configuration, Regional settings.
- **Finance**: Cost management, Treasury, Expenses.

## 🏗️ Architecture
- **Modular Monolith**: Each module (`modules/xyz`) contains its own `domain`, `application`, and `api` layers.
- **Feature-Sliced Frontend**: Organized by `features/xyz` for scalability.

## 🔐 Default Credentials
*Admin user created automatically on first run:*
- **User**: `admin`
- **Pass**: `admin123`

## 📄 License
MIT

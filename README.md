# Enterprise ERP

A modern, full-stack ERP solution built with **FastAPI** (Python) and **React** (Vite).
Features a modular monolith architecture designed for scalability and maintainability.

## Modules
- **IAM**: User management, Roles (RBAC), Authentication.
- **Catalog**: Product management, Categories, Pricing.
- **Inventory**: Stock tracking, Movements, Adjustments.
- **Sales**: Point of Sale (POS), Sales History, Analytics.
- **Customers**: CRM, Account Balance.
- **Payments**: Payment methods, Transaction recording.
- **Admin**: System configuration, Regional settings.

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup

1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Linux/Mac
   # .venv\Scripts\activate   # Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment:
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```
5. Run the server:
   ```bash
   # Run with auto-reload
   uvicorn app.main:app --reload
   ```
   *API docs available at: http://localhost:8000/docs*

### Frontend Setup

1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment:
   ```bash
   cp .env.example .env
   ```
4. Run development server:
   ```bash
   npm run dev
   ```
   *App available at: http://localhost:5173*

## Login Credentials
*Default admin user created on first run (check `create_admin.py` if needed)*
- **Username**: admin
- **Password**: admin123

## Architecture
This project follows a **Modular Monolith** pattern.
- **Backend**: Each module (`modules/xyz`) has its own `domain` (models), `application` (logic), and `api` (routes).
- **Frontend**: Feature-sliced design (`features/xyz`) containing `components`, `views`, and `services`.

## License
MIT

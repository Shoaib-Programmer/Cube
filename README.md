## Testing

Unit tests are provided in `backend/solver/tests.py` and cover:
 - Cube state validation (valid/invalid cubes)
 - Facelet string conversion
 - API endpoint responses for `/solve/`, `/validate/`, and `/health/`

### How to Run Tests

You can run all tests using [uv](https://github.com/astral-sh/uv) for fast and reliable test execution:

```bash
uv pip install -r requirements.txt
uv test backend/solver/
```

Or use Django's built-in test runner:

```bash
python manage.py test solver
```

Tests will automatically check cube validation, API responses, and facelet string correctness.

# Rubik's Cube Solver Web Application

## Overview

This project is a full-stack web application designed to solve Rubik's Cubes using Kociemba's two-phase algorithm. The backend is built with Django and exposes a RESTful API for cube solving, validation, and history tracking. The frontend is implemented with Next.js, providing an interactive user interface for entering cube states, visualizing solutions, and viewing solve history. The project aims to deliver a robust, scalable, and user-friendly experience for both casual users and speedcubers.

### Distinctiveness and Complexity

#### Distinctiveness
This project stands out from typical course projects due to its integration of advanced algorithmic solving (Kociemba), real-time validation, and persistent history tracking. Unlike standard CRUD or blog applications, it combines:
- **Algorithmic Complexity:** The backend leverages the kociemba Python package to compute optimal solutions for arbitrary cube states, requiring careful data validation and transformation.
- **Data Modeling:** Solve records are stored with detailed metadata (move count, solve time, IP address, timestamp), supporting analytics and user feedback.
- **Frontend-Backend Integration:** The Next.js frontend communicates with the Django backend via REST APIs, enabling interactive cube input and solution visualization.
- **Distinct UI/UX:** The frontend features custom components for cube manipulation and history browsing, distinguishing it from template-based apps. The landing page also appears like something straight out of the [Resend website](https://resend.com)

#### Complexity
- **Validation Logic:** The backend performs multi-level validation (shape, color counts, physical possibility) before attempting to solve, ensuring only valid cubes are processed.
- **Error Handling:** Robust error handling is implemented for malformed requests, unsolvable cubes, and database failures.
- **Database Design:** The CubeSolve model tracks all relevant data for each solve, supporting efficient queries and pagination.
- **API Endpoints:** Multiple endpoints (solve, validate, health, history) provide a comprehensive interface for frontend and external integrations.
- **Frontend Architecture:** The Next.js app is modular, with reusable components and type-safe data handling.

This combination of algorithmic, architectural, and user experience complexity sets the project apart from standard web applications in the course.

## File Structure and Contents

### Backend (`backend/`)
- `main.py`: Entry point for standalone backend execution (prints a greeting).
- `manage.py`: Django's command-line utility for administrative tasks.
- `pyproject.toml`: Python project metadata and dependencies.
- `cube/`: Django project settings and configuration.
  - `settings.py`: Main settings (static files, security, installed apps).
  - `urls.py`: URL routing for all API endpoints.
  - `asgi.py`, `wsgi.py`: ASGI/WGI entry points for deployment.
- `solver/`: Django app for cube solving logic.
  - `models.py`: Defines the `CubeSolve` model for storing solve records.
  - `views.py`: Implements API endpoints for solving, validating, health check, and history.
  - `apps.py`: App configuration.
  - `admin.py`: (Optional) Model registration for Django admin.
  - `tests.py`: Placeholder for unit tests.
  - `migrations/`: Database migration files.
- `staticfiles/`: Static assets for admin and Grappelli UI.

### Frontend (`frontend/`)
- `README.md`: Next.js boilerplate documentation.
- `package.json`, `bun.lock`, etc.: Frontend dependencies and configuration.
- `src/`: Main source code.
  - `app/`: Application pages and layout.
  - `components/`: UI components (e.g., cube scene, controls).
  - `lib/`: Utility functions.
  - `types/`: Type definitions for cube data.
  - `public/`: Static assets (SVGs, icons).

## How to Run the Application

### Backend
1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   (Or use `pyproject.toml` with Poetry or pip.)
2. **Apply migrations:**
   ```bash
   python manage.py migrate
   ```
3. **Run the development server:**
   ```bash
   python manage.py runserver
   ```
   The API will be available at `http://localhost:8000/`.

### Frontend
1. **Install Node.js dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```
2. **Start the frontend server:**
   ```bash
   npm run dev
   # or
   bun dev
   ```
   The frontend will be available at `http://localhost:3000/`.

## Additional Information
- **API Endpoints:**
  - `/solve/`: POST a cube state to receive a solution.
  - `/validate/`: POST a cube state to check validity.
  - `/history/`: GET recent solve records (supports pagination).
  - `/health/`: GET health status of the backend.
- **Distinctive Features:**
  - Real-time cube validation and solving.
  - Persistent solve history with analytics.
  - Modular, type-safe frontend for interactive cube manipulation.
  - Advanced error handling and input validation.
- **Python Packages:**
  - All required packages are listed in `requirements.txt` and `pyproject.toml` (Django, kociemba, pydantic, etc.).
- **Deployment:**
  - The backend can be deployed on any WSGI/ASGI-compatible server.
  - The frontend is ready for deployment on Vercel or similar platforms.

## Requirements
See `requirements.txt` for all Python dependencies. If you add new packages, update this file accordingly.

---

If you have any questions or need further clarification, please contact the project maintainer.

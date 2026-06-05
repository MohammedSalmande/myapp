# Quickstart: Smart Task Manager

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ installed for frontend dependency management
- Java 17+ installed for local backend build/test if needed

## Local Startup

1. Copy `.env.example` to `.env` and update values if needed.
2. From the project root (`/home/salman/my-app/app`), run:

```bash
docker compose up --build
```

3. Open the frontend at `http://localhost:3000`.
4. The backend API will be available at `http://localhost:8080`.

## Development Workflow

- Frontend changes: update `frontend/src/` and rebuild via Docker Compose or local `npm run dev`.
- Backend changes: update `backend/src/` and rebuild via Docker Compose or local `./mvnw spring-boot:run`.
- Database migrations: seed SQL is defined in `db/init/schema.sql` and executed by the MySQL container initialization.

## Feature Scope

- Task CRUD operations
- Urgent / Important classification
- Eisenhower Matrix task organization
- Status management: `TODO`, `IN_PROGRESS`, `DONE`
- Responsive UI using Tailwind CSS
- REST API integration between Next.js frontend and Spring Boot backend

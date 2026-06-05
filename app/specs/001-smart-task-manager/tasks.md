# Tasks: Smart Task Manager

**Input**: Design documents from `specs/001-smart-task-manager/`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [P] Use the existing root Next.js project scaffold for the frontend
- [ ] T002 [P] Create backend Spring Boot project scaffold in `backend/`
- [ ] T003 [P] Create Docker Compose configuration in `docker-compose.yml`
- [ ] T004 Create database init scripts in `backend/src/main/resources/db/schema.sql`
- [ ] T005 [P] Add `.env.example` with MySQL and service settings at `.env.example`
- [ ] T006 [P] Configure Tailwind CSS and global styles in `tailwind.config.ts`, `postcss.config.mjs`, and `app/globals.css`
- [ ] T007 [P] Add project README and quickstart notes in `README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T008 [P] Implement `Task` entity in `backend/src/main/java/com/example/taskmanager/model/Task.java`
- [ ] T009 [P] Implement `TaskStatus` enum in `backend/src/main/java/com/example/taskmanager/model/TaskStatus.java`
- [ ] T010 Create Spring Data repository interface in `backend/src/main/java/com/example/taskmanager/repository/TaskRepository.java`
- [ ] T011 Create service layer skeleton in `backend/src/main/java/com/example/taskmanager/service/TaskService.java`
- [ ] T012 Create REST controller skeleton in `backend/src/main/java/com/example/taskmanager/controller/TaskController.java`
- [ ] T013 Create DTOs and validation classes in `backend/src/main/java/com/example/taskmanager/dto/TaskDto.java`
- [ ] T014 Configure MySQL datasource and application properties in `backend/src/main/resources/application.yml`
- [ ] T015 Create frontend API client module in `lib/api.ts`
- [ ] T016 Create shared frontend types in `lib/types.ts`
- [ ] T017 Create `components/Layout.tsx` for shared page layout
- [ ] T018 Create backend Dockerfile in `backend/Dockerfile`
- [ ] T019 Create frontend Dockerfile in `Dockerfile.frontend`
- [ ] T020 Create backend database schema and sample seed script in `backend/src/main/resources/db/schema.sql`
- [ ] T021 Create local Docker Compose startup docs in `specs/001-smart-task-manager/quickstart.md`

---

## Phase 3: User Story 1 - Manage tasks and status workflows (Priority: P1)

**Goal**: Enable users to create, edit, delete, and update task status through the UI with backend persistence.

**Independent Test**: Create a task, change its status, edit details, and delete it; verify all operations succeed via the UI and backend API.

- [ ] T022 [P] [US1] Create task list page in `app/page.tsx`
- [ ] T023 [P] [US1] Create task form component in `components/TaskForm.tsx`
- [ ] T024 [P] [US1] Create task card component in `components/TaskCard.tsx`
- [ ] T025 [US1] Add task create, update, and delete methods in `lib/api.ts`
- [ ] T026 [US1] Add task CRUD flows and state management in `app/page.tsx`
- [ ] T027 [US1] Add backend CRUD methods to `backend/src/main/java/com/example/taskmanager/service/TaskService.java`
- [ ] T028 [US1] Add backend CRUD endpoints to `backend/src/main/java/com/example/taskmanager/controller/TaskController.java`
- [ ] T029 [US1] Add request validation for task creation and updates in `backend/src/main/java/com/example/taskmanager/dto/TaskDto.java`
- [ ] T030 [US1] Add frontend title validation and error state in `frontend/src/components/TaskForm.tsx`
- [ ] T031 [US1] Create backend unit tests for `TaskService` in `backend/src/test/java/com/example/taskmanager/service/TaskServiceTest.java`
- [ ] T032 [US1] Create backend controller tests in `backend/src/test/java/com/example/taskmanager/controller/TaskControllerTest.java`

---

## Phase 4: User Story 2 - Classify tasks using urgent/important labels and Eisenhower Matrix (Priority: P2)

**Goal**: Allow users to mark tasks as urgent/important and organize them into an Eisenhower Matrix view.

**Independent Test**: Create tasks with all urgent/important combinations and verify they render in the correct matrix quadrants.

- [ ] T033 [P] [US2] Create Eisenhower Matrix component in `components/EisenhowerMatrix.tsx`
- [ ] T034 [P] [US2] Create status filter component in `components/StatusFilter.tsx`
- [ ] T035 [P] [US2] Add urgent/important toggles to `components/TaskForm.tsx`
- [ ] T036 [P] [US2] Add urgent and important badges to `components/TaskCard.tsx`
- [ ] T037 [US2] Add matrix grouping and quadrant logic in `app/page.tsx`
- [ ] T038 [US2] Add backend support for query filtering by urgent and important in `backend/src/main/java/com/example/taskmanager/controller/TaskController.java`
- [ ] T039 [US2] Add frontend filter controls and matrix visualization in `app/page.tsx`
- [ ] T040 [US2] Update API calls to include classification fields in `lib/api.ts`

---

## Phase 5: User Story 3 - Responsive UI (Priority: P3)

**Goal**: Ensure the app is usable and visually consistent on desktop, tablet, and mobile screen sizes.

**Independent Test**: Validate the dashboard, forms, and matrix across mobile and desktop viewport sizes.

- [ ] T041 [P] [US3] Add responsive layout utilities in `tailwind.config.ts` and `app/globals.css`
- [ ] T042 [US3] Add mobile-friendly task card layout in `components/TaskCard.tsx`
- [ ] T043 [US3] Add responsive form layout in `components/TaskForm.tsx`
- [ ] T044 [US3] Add responsive matrix layout in `components/EisenhowerMatrix.tsx`
- [ ] T045 [US3] Add responsive grid and spacing in `app/page.tsx`
- [ ] T046 [US3] Create visual breakpoint validations in `app/page.tsx`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T047 [P] Improve API error handling in `frontend/src/lib/api.ts`
- [ ] T048 [P] Improve backend exception handling in `backend/src/main/java/com/example/taskmanager/exception/GlobalExceptionHandler.java`
- [ ] T049 [P] Add Docker Compose environment documentation to `README.md`
- [ ] T050 [P] Add final UI polish and accessibility checks in `frontend/src/components/TaskForm.tsx` and `frontend/src/components/TaskCard.tsx`
- [ ] T051 [P] Add smoke test instructions to `specs/001-smart-task-manager/quickstart.md`
- [ ] T052 [P] Add integration notes and feature acceptance criteria to `specs/001-smart-task-manager/spec.md`

---

## Dependencies & Execution Order

- Phase 1 tasks must complete first to establish project structure and Docker support.
- Phase 2 tasks are foundational and block all story implementation until complete.
- Phase 3, Phase 4, and Phase 5 tasks depend on Phase 2 and can be developed in parallel once the foundation is ready.
- Phase 6 contains polish and cross-cutting improvements after core stories are functional.

## Parallel Opportunities

- Setup tasks `T001`, `T002`, `T003`, `T005`, `T006` can run in parallel.
- Foundational tasks `T008`, `T009`, `T010`, `T011`, `T013`, `T015`, `T016`, `T018`, `T019` can be parallelized where they touch independent files.
- User Story 1 frontend tasks `T022`, `T023`, `T024` can run in parallel with backend foundational task `T027` after the service skeleton exists.
- User Story 2 tasks `T033`, `T034`, `T035`, `T036` can run in parallel once the task model and API are available.
- User Story 3 responsive styling tasks `T041`, `T042`, `T043`, `T044` can run in parallel across components.

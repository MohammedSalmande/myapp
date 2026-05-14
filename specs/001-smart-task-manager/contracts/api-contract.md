# API Contract: Smart Task Manager

## Base URL

- `http://localhost:8080/api`

## Endpoints

### GET /tasks

Returns a list of tasks.

Query parameters:
- `status` (optional): filter by `TODO`, `IN_PROGRESS`, or `DONE`
- `urgent` (optional): `true` or `false`
- `important` (optional): `true` or `false`

Response:
- `200 OK`
- Body: `Task[]`

### GET /tasks/{id}

Returns a single task by ID.

Response:
- `200 OK` with `Task`
- `404 Not Found` if task does not exist

### POST /tasks

Creates a new task.

Request body:
```json
{
  "title": "Finish report",
  "description": "Prepare Q3 summary",
  "urgent": true,
  "important": false,
  "status": "TODO",
  "dueDate": "2026-09-01"
}
```

Response:
- `201 Created` with created `Task`
- `400 Bad Request` if validation fails

### PUT /tasks/{id}

Updates an existing task.

Request body: same as POST.

Response:
- `200 OK` with updated `Task`
- `404 Not Found` if task does not exist
- `400 Bad Request` if validation fails

### DELETE /tasks/{id}

Deletes the specified task.

Response:
- `204 No Content` on success
- `404 Not Found` if task does not exist

## Task Object

```json
{
  "id": 1,
  "title": "Finish report",
  "description": "Prepare Q3 summary",
  "urgent": true,
  "important": false,
  "status": "TODO",
  "dueDate": "2026-09-01",
  "createdAt": "2026-05-15T10:00:00Z",
  "updatedAt": "2026-05-15T10:00:00Z"
}
```

## Error Response

```json
{
  "timestamp": "2026-05-15T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Title must not be blank",
  "path": "/api/tasks"
}
```

## Contracts Notes

- The frontend will treat the REST API as the authoritative contract boundary.
- All task mutations are synchronous and reflected back in the API response.
- The `urgent` and `important` flags are used by the frontend to compute Eisenhower Matrix placement.

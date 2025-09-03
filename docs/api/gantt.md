# Gantt Chart API Documentation

## Overview

The Gantt Chart API provides endpoints for global project management where authenticated users can view and manage task timelines for all tasks in the system, regardless of task ownership.

## Authentication

All Gantt endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### GET /api/gantt/tasks

Retrieves all tasks with their timeline information for Gantt chart visualization.

**Request:**
```http
GET /api/gantt/tasks
Authorization: Bearer <token>
```

**Response:**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Task Title",
      "description": "Task description",
      "priority": "high",
      "status": "in_progress",
      "dueDate": "2025-09-30T00:00:00.000Z",
      "startDate": "2025-09-01T00:00:00.000Z",
      "endDate": "2025-09-15T00:00:00.000Z",
      "area": "Development",
      "subarea": "Frontend",
      "userId": 2,
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2025-08-01T10:00:00.000Z",
      "updatedAt": "2025-08-15T14:30:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (invalid or missing token)
- `500` - Internal server error

---

### PUT /api/gantt/tasks/:id/timeline

Updates the timeline (start and end dates) for a specific task.

**Request:**
```http
PUT /api/gantt/tasks/1/timeline
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2025-09-01",
  "endDate": "2025-09-15"
}
```

**Parameters:**
- `id` (path) - Task ID to update

**Request Body:**
- `startDate` (string, optional) - Start date in ISO format or null
- `endDate` (string, optional) - End date in ISO format or null

**Response:**
```json
{
  "message": "Task timeline updated successfully",
  "task": {
    "id": 1,
    "title": "Task Title",
    "startDate": "2025-09-01T00:00:00.000Z",
    "endDate": "2025-09-15T00:00:00.000Z",
    "updatedAt": "2025-08-15T14:30:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request (invalid dates, start date after end date)
- `401` - Unauthorized
- `404` - Task not found
- `500` - Internal server error

---

### POST /api/gantt/dependencies

Creates a dependency relationship between two tasks.

**Request:**
```http
POST /api/gantt/dependencies
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskId": 2,
  "dependsOnTaskId": 1,
  "dependencyType": "finish_to_start"
}
```

**Request Body:**
- `taskId` (number) - ID of the dependent task
- `dependsOnTaskId` (number) - ID of the task that must be completed first
- `dependencyType` (string, optional) - Type of dependency relationship
  - `finish_to_start` (default) - Task can start when dependency finishes
  - `start_to_start` - Task can start when dependency starts
  - `finish_to_finish` - Task finishes when dependency finishes
  - `start_to_finish` - Task finishes when dependency starts

**Response:**
```json
{
  "message": "Task dependency created successfully",
  "dependency": {
    "id": 1,
    "taskId": 2,
    "dependsOnTaskId": 1,
    "dependencyType": "finish_to_start",
    "createdAt": "2025-08-15T14:30:00.000Z",
    "updatedAt": "2025-08-15T14:30:00.000Z"
  }
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Bad request (invalid dependency type, circular dependency, self-dependency, duplicate)
- `401` - Unauthorized
- `404` - One or both tasks not found
- `500` - Internal server error

---

### DELETE /api/gantt/dependencies/:id

Deletes a task dependency.

**Request:**
```http
DELETE /api/gantt/dependencies/1
Authorization: Bearer <token>
```

**Parameters:**
- `id` (path) - Dependency ID to delete

**Response:**
```json
{
  "message": "Task dependency deleted successfully"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Dependency not found
- `500` - Internal server error

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

## Business Rules

### Task Timeline Rules
- Start date must be before or equal to end date
- Both dates are optional and can be set to null
- Any authenticated user can update any task's timeline

### Dependency Rules
- Tasks cannot depend on themselves
- Circular dependencies are prevented automatically
- Duplicate dependencies between the same tasks are not allowed
- Dependencies can only be created between existing tasks

### Security
- All endpoints require valid JWT authentication
- Users can view and modify any task's timeline (global project management)
- This differs from regular task endpoints which are user-specific

## Examples

### Complete Workflow Example

1. **Get all tasks for Gantt view:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:5000/api/gantt/tasks
```

2. **Set timeline for a task:**
```bash
curl -X PUT \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"startDate": "2025-09-01", "endDate": "2025-09-15"}' \
     http://localhost:5000/api/gantt/tasks/1/timeline
```

3. **Create a dependency:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"taskId": 2, "dependsOnTaskId": 1, "dependencyType": "finish_to_start"}' \
     http://localhost:5000/api/gantt/dependencies
```

4. **Remove a dependency:**
```bash
curl -X DELETE \
     -H "Authorization: Bearer <token>" \
     http://localhost:5000/api/gantt/dependencies/1
```
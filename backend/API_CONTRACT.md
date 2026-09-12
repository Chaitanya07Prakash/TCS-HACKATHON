# API Contract for SMART CAMPUS AI

This document specifies the APIs built for the MVP. The Base URL for all endpoints is `/api`.

## General Information
- **Content-Type**: `application/json` for all requests.
- **Authentication**: JWT sent in the `Authorization` header as `Bearer <token>`.
- **Standard Response**:
  - Success: `{ "success": true, "data": ... }`
  - Error: `{ "success": false, "message": "..." }`

---

## 1. Authentication (`/api/auth`)

### POST `/register`
Registers a new student profile.
- **Request Body**:
  ```json
  {
    "email": "student@example.com",
    "password": "password123",
    "name": "John Doe",
    "branch": "CSE",
    "year": 3,
    "semester": 6,
    "graduationYear": 2026,
    "cgpa": 8.5
  }
  ```
- **Response**: `201 Created` with JWT token.

### POST `/login`
- **Request Body**: `{ "email": "...", "password": "..." }`
- **Response**: `200 OK` with JWT token.

### GET `/me`
- **Auth Required**: Yes
- **Response**: `200 OK` with basic user information.

---

## 2. User Profile (`/api/users`)

### GET `/profile`
- **Auth Required**: Yes
- **Response**: Full user profile including skills, interests, and placement preferences.

### PUT `/profile`
Updates the student profile.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "skills": ["React", "Node.js"],
    "interests": ["AI"],
    "placementPreference": {
      "preferredRoles": ["SDE"],
      "expectedCtc": 10.0,
      "locations": ["Bangalore"]
    }
  }
  ```
- **Response**: `200 OK` with updated profile.

---

## 3. Notices (`/api/notices`)

### POST `/process`
Sends raw notice text to the AI service for extraction, creates Notice, checks eligibility, generates tasks and notifications.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "title": "Google Recruitment",
    "rawText": "Google is hiring SDEs for 2026 batch. Min CGPA 8.0."
  }
  ```
- **Response**: `201 Created` with processed Notice data.

### GET `/`
- **Auth Required**: Yes
- **Query Params**: `?category=PLACEMENT`, `?search=software`, `?deadline=upcoming`
- **Response**: List of notices.

### GET `/:id`, PUT `/:id`, DELETE `/:id`
Standard CRUD operations for a specific notice.

---

## 4. Opportunities (`/api/opportunities`)

### GET `/`
- **Auth Required**: Yes
- **Response**: All opportunities.

### GET `/eligible`
- **Auth Required**: Yes
- **Response**: List of opportunities where the logged-in student is eligible. Includes `relevanceScore`, `priority`, and `reasons`.

### GET `/recommended`
- **Auth Required**: Yes
- **Response**: Top 10 highly relevant opportunities (`priority = HIGH or MEDIUM`).

---

## 5. Tasks (`/api/tasks`)

### GET `/`
- **Auth Required**: Yes
- **Response**: List of tasks for the user.

### POST `/`
- **Auth Required**: Yes
- **Request Body**: `{ "noticeId": "...", "title": "...", "deadline": "...", "priority": "HIGH" }`
- **Response**: `201 Created`.

### PUT `/:id`
Updates a task (e.g., status).
- **Auth Required**: Yes
- **Request Body**: `{ "status": "COMPLETED" }`
- **Response**: `200 OK`.

---

## 6. Dashboard (`/api/dashboard`)

### GET `/`
- **Auth Required**: Yes
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {},
      "importantDeadlines": [],
      "tasks": [],
      "recommendedOpportunities": [],
      "recentNotices": [],
      "notifications": []
    }
  }
  ```

---

## 7. Notifications (`/api/notifications`)

### GET `/`
- **Auth Required**: Yes
- **Response**: List of notifications for the user.

### PATCH `/:id/read`
- **Auth Required**: Yes
- **Response**: `200 OK`.

---

## 8. AI Assistant (`/api/assistant`)

### POST `/chat`
- **Auth Required**: Yes
- **Request Body**: `{ "message": "What am I eligible for?" }`
- **Response**: `200 OK` with AI response including context-aware answers.

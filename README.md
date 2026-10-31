# Practical 5: Database Integration with MongoDB Atlas & Mongoose

## Objective
To connect a Node.js and Express RESTful API with MongoDB Atlas using Mongoose, replacing temporary in-memory data structures from Practical 4 with a fully persistent cloud database. This practical implements data schemas, validation, pre-save hooks, complete CRUD operations, robust error handling, and environment-based configuration management.

---

## Technologies Used
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web framework for building RESTful APIs
- **MongoDB Atlas**: Managed multi-cloud document database service
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB and Node.js
- **dotenv**: Module to load environment variables from a `.env` file into `process.env`

---

## Architecture & Project Structure

```
task-manager-api-24IT054/
├── models/
│   └── Task.js          # Mongoose Task schema, validation, & pre-save hook
├── .env                 # Environment variables (ignored by Git)
├── .env.example         # Template for environment variables (safe for Git)
├── .gitignore           # Ignores node_modules/ and .env
├── package.json         # Project metadata, scripts, and dependencies
├── package-lock.json    # Dependency lockfile
├── server.js            # Express server, CRUD routes, error handling, & DB connection
└── README.md            # Practical documentation and testing guide
```

---

## MongoDB Atlas Setup Guide

1. **Create an Account and Cluster**:
   - Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a free shared cluster (e.g., `Cluster0`).

2. **Configure Database Access (User Credentials)**:
   - Navigate to **Security** → **Database Access**.
   - Click **Add New Database User**.
   - Choose **Password** authentication.
   - Enter a username (e.g., `taskadmin`).
   - Enter or auto-generate a secure password.
   - Set Built-in Role to **Read and write to any database**.
   - Click **Add User**.
   *(Note: Remember this username and password for your `.env` file)*.

3. **Configure Network Access (IP Whitelist)**:
   - Navigate to **Security** → **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) for development/testing, or add your current IP address.
   - Confirm and wait for the status to show active.

4. **Obtain Connection String**:
   - Go to **Database** → **Clusters** → Click **Connect** on `Cluster0`.
   - Select **Drivers** (Node.js).
   - Copy the connection string format:
     ```
     mongodb+srv://<username>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials. If your password contains special characters (such as `@`, `:`, `#`, `%`), URL-encode them (e.g., `@` becomes `%40`).
   - Append your database name (e.g., `taskmanager`) before the query string.

---

## Installation & Setup

1. **Clone or Navigate to the Backend Folder**:
   ```bash
   cd student-portfolio/task-manager-api-24IT054
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   - Copy `.env.example` to create `.env`:
     ```bash
     cp .env.example .env
     ```
   - In `.env`, provide your MongoDB Atlas connection string:
     ```env
     MONGO_URI=mongodb+srv://<username>:<password>@cluster0.vqmnod8.mongodb.net/taskmanager?retryWrites=true&w=majority
     PORT=5000
     ```
   > **Security Note:** Never commit `.env` or your actual credentials to Git. Ensure `.env` is listed in `.gitignore`.

4. **Start the Server**:
   ```bash
   npm start
   ```
   Expected console output upon successful connection:
   ```
   MongoDB connected
   Task Manager API running at http://localhost:5000
   ```

---

## Task Schema & Validation Rules

Defined in [`models/Task.js`](file:///c:/Users/Admin/OneDrive/Documents/awdf_prac1/student-portfolio/task-manager-api-24IT054/models/Task.js):

| Field | Type | Required | Default | Validation & Rules |
|---|---|---|---|---|
| `title` | `String` | Yes | N/A | Trimmed whitespace; must not be blank |
| `description` | `String` | No | `""` | Optional details about the task |
| `completed` | `Boolean` | No | `false` | Status of completion |
| `createdAt` | `Date` | No | `Date.now` | Automatically records creation timestamp |
| `priority` | `String` | No | `"medium"` | Enum: `'low'`, `'medium'`, or `'high'` |

- **Pre-save Hook**: Trims the `title` before saving document to MongoDB.

---

## API Endpoints

| Method | Endpoint | Description | Request Body | Success Status | Error Statuses |
|---|---|---|---|---|---|
| **GET** | `/tasks` | Retrieve all tasks | None | `200 OK` | `500` |
| **GET** | `/tasks/:id` | Retrieve single task by ID | None | `200 OK` | `400` (invalid ID), `404` (not found), `500` |
| **POST** | `/tasks` | Create a new task | JSON task object | `201 Created` | `400` (validation/content-type), `500` |
| **PUT** | `/tasks/:id` | Update an existing task | JSON fields to update | `200 OK` | `400` (invalid ID/validation), `404`, `500` |
| **DELETE** | `/tasks/:id` | Delete a task by ID | None | `200 OK` | `400` (invalid ID), `404`, `500` |

---

## Example JSON Request & Response Bodies

### 1. Create Task (`POST /tasks`)
**Request Body**:
```json
{
  "title": "Complete AWDF Practical 5",
  "description": "Integrate MongoDB Atlas with Express and Mongoose",
  "priority": "high",
  "completed": false
}
```

**Response (`201 Created`)**:
```json
{
  "_id": "67232f14c2b9a7852e90e11a",
  "title": "Complete AWDF Practical 5",
  "description": "Integrate MongoDB Atlas with Express and Mongoose",
  "priority": "high",
  "completed": false,
  "createdAt": "2026-10-31T07:15:00.000Z",
  "__v": 0
}
```

### 2. Update Task (`PUT /tasks/:id`)
**Request Body**:
```json
{
  "completed": true,
  "priority": "medium"
}
```

**Response (`200 OK`)**:
```json
{
  "_id": "67232f14c2b9a7852e90e11a",
  "title": "Complete AWDF Practical 5",
  "description": "Integrate MongoDB Atlas with Express and Mongoose",
  "priority": "medium",
  "completed": true,
  "createdAt": "2026-10-31T07:15:00.000Z",
  "__v": 0
}
```

### 3. Delete Task (`DELETE /tasks/:id`)
**Response (`200 OK`)**:
```json
{
  "message": "Task deleted successfully",
  "task": {
    "_id": "67232f14c2b9a7852e90e11a",
    "title": "Complete AWDF Practical 5",
    "completed": true
  }
}
```

---

## Error Handling & Status Codes

All responses utilize standardized JSON structures:

- **Missing Content-Type (`400 Bad Request`)**:
  ```json
  { "error": "Content-Type must be application/json" }
  ```
- **Malformed JSON (`400 Bad Request`)**:
  ```json
  { "error": "Invalid JSON payload" }
  ```
- **Schema Validation Error (`400 Bad Request`)**:
  ```json
  {
    "error": "Validation failed",
    "details": [
      { "field": "title", "message": "Task title is required" }
    ]
  }
  ```
- **Invalid MongoDB ID (`400 Bad Request`)**:
  ```json
  { "error": "Invalid task ID" }
  ```
- **Task Not Found (`404 Not Found`)**:
  ```json
  { "error": "Task not found" }
  ```
- **Unknown Route (`404 Not Found`)**:
  ```json
  { "error": "Route not found", "path": "/unsupported-route" }
  ```

---

## Testing CRUD Operations (PowerShell / curl)

```powershell
# 1. Get all tasks
curl http://localhost:5000/tasks

# 2. Create a task
curl -X POST http://localhost:5000/tasks `
  -H "Content-Type: application/json" `
  -d '{\"title\": \"Test MongoDB\", \"priority\": \"high\"}'

# 3. Get task by ID (replace <ID> with the _id returned from POST)
curl http://localhost:5000/tasks/<ID>

# 4. Update task
curl -X PUT http://localhost:5000/tasks/<ID> `
  -H "Content-Type: application/json" `
  -d '{\"completed\": true}'

# 5. Delete task
curl -X DELETE http://localhost:5000/tasks/<ID>

# 6. Test invalid ID
curl http://localhost:5000/tasks/12345invalid

# 7. Test missing title validation
curl -X POST http://localhost:5000/tasks `
  -H "Content-Type: application/json" `
  -d '{\"description\": \"No title here\"}'
```

---

## MongoDB Persistence Verification

Unlike Practical 4 where tasks were stored in a volatile JavaScript in-memory array (`let tasks = [...]`), Practical 5 stores every document in a remote MongoDB Atlas database collection (`tasks`).

**How to verify persistence:**
1. Create a task using `POST /tasks`.
2. Stop the Node.js server (`Ctrl + C`).
3. Start the server again (`npm start`).
4. Execute `GET /tasks` or view MongoDB Atlas Browse Collections.
5. Notice that all previously created tasks remain intact and persisted.


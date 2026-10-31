# Practical 6: Full Stack Integration (React + Node.js + Express + MongoDB)

## Objective
To wire the React frontend with the Node.js/Express and MongoDB Atlas backend into a fully integrated, functional full-stack application. Practical 6 replaces the Practical 3 GitHub API repository list with dynamic task data stored and persisted in MongoDB Atlas, supporting end-to-end CRUD operations, optimistic state synchronization, CORS communication, and loading/error handling.

---

## Architecture & Communication Flow

```
┌──────────────────────────────────────┐
│  React Frontend (Vite)               │
│  http://localhost:5173               │
│  - TaskManager.jsx / TaskForm.jsx    │
│  - api.js (centralized fetch calls)  │
└──────────────────┬───────────────────┘
                   │
                   │ HTTP / JSON (CORS Enabled)
                   ▼
┌──────────────────────────────────────┐
│  Express Backend                     │
│  http://localhost:5000               │
│  - server.js                         │
│  - cors middleware                   │
│  - RESTful CRUD routes (/tasks)      │
└──────────────────┬───────────────────┘
                   │
                   │ Mongoose ODM
                   ▼
┌──────────────────────────────────────┐
│  MongoDB Atlas Cloud Database        │
│  - taskmanager database              │
│  - tasks collection                  │
└──────────────────────────────────────┘
```

**End-to-End Flow:**
`React UI Form` → `POST /tasks` → `Express Backend` → `Mongoose` → `MongoDB Atlas` → `201 Response` → `React state updates & Toast notification shown`

---

## Technologies Used
- **Frontend**: React 19, Vite, React Router, CSS3 (matching Practical 6 reference UI)
- **Backend**: Node.js, Express 5, Mongoose 9, cors, dotenv
- **Database**: MongoDB Atlas (Cloud Cluster `Cluster0`)

---

## Prerequisites & Installation

### 1. Install Backend Dependencies
```bash
cd student-portfolio/task-manager-api-24IT054
npm install
```

### 2. Install Frontend Dependencies
```bash
cd student-portfolio
npm install
```

---

## Configuration & Environment Setup

### 1. Backend Environment Variables (`.env`)
Create or edit `.env` in `student-portfolio/task-manager-api-24IT054/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.vqmnod8.mongodb.net/taskmanager?retryWrites=true&w=majority
```
> **Security Note:** Never commit `.env` or plain-text database credentials to Git. Ensure `.env` is listed in `.gitignore`.

### 2. MongoDB Atlas Configuration
1. **Database Access**: Under **Security** → **Database Access**, verify your database user and password.
2. **Network Access**: Under **Security** → **Network Access**, ensure IP `0.0.0.0/0` (Allow access from anywhere) is active.
3. **Database Name**: The database name `taskmanager` is specified in the connection string.

### 3. CORS Configuration
In `server.js`, CORS is enabled before all route definitions:
```javascript
const cors = require('cors');
app.use(cors());
```
This allows the React development server on `http://localhost:5173` to make asynchronous requests to the Express server on `http://localhost:5000`.

---

## Running the Application (Simultaneous Servers)

Practical 6 requires two separate terminal windows:

### Terminal 1: Backend Server (Port 5000)
```powershell
cd student-portfolio/task-manager-api-24IT054
npm start
```
*Expected Console Output:*
```
MongoDB connected
Task Manager API running at http://localhost:5000
```

### Terminal 2: Frontend Server (Port 5173)
```powershell
cd student-portfolio
npm run dev
```
*Expected Console Output:*
```
  VITE v8.3.5  ready in 150 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## API Endpoints

| Method | Endpoint | Description | Request Body | Status Code |
|---|---|---|---|---|
| **GET** | `/tasks` | Retrieve all tasks | None | `200 OK` |
| **GET** | `/tasks/:id` | Retrieve single task | None | `200 OK` / `400` / `404` |
| **POST** | `/tasks` | Create new task | `{ title, description, priority }` | `201 Created` / `400` |
| **PUT** | `/tasks/:id` | Update task | `{ title, description, priority, completed }` | `200 OK` / `400` / `404` |
| **DELETE** | `/tasks/:id` | Delete task | None | `200 OK` / `400` / `404` |

---

## Frontend Components & State Management

- **[`src/api.js`](file:///c:/Users/Admin/OneDrive/Documents/awdf_prac1/student-portfolio/src/api.js)**: Centralized API layer using `fetch` with error checking for all CRUD calls.
- **[`src/components/TaskManager.jsx`](file:///c:/Users/Admin/OneDrive/Documents/awdf_prac1/student-portfolio/src/components/TaskManager.jsx)**: Main task dashboard, managing task state, pending/done counter badges, loading spinner, and error retry states.
- **[`src/components/TaskForm.jsx`](file:///c:/Users/Admin/OneDrive/Documents/awdf_prac1/student-portfolio/src/components/TaskForm.jsx)**: Task creation form matching reference UI layout (`What needs to be done?`, priority dropdown, `Description (optional)`, and `Add` button).
- **[`src/components/TaskItem.jsx`](file:///c:/Users/Admin/OneDrive/Documents/awdf_prac1/student-portfolio/src/components/TaskItem.jsx)**: Task row with completion checkbox, priority badge (`LOW`, `MEDIUM`, `HIGH`), inline editing mode, and delete button.
- **[`src/components/Toast.jsx`](file:///c:/Users/Admin/OneDrive/Documents/awdf_prac1/student-portfolio/src/components/Toast.jsx)**: Floating notifications displaying operation feedback (success/error).

---

## Supplementary Features Implemented

1. **Delete Confirmation Dialog**:
   - Before executing `DELETE /tasks/:id`, a confirmation prompt alerts the user (`window.confirm`). If canceled, no request is sent.
2. **Toast Notifications**:
   - Success and failure toast messages trigger after every API operation (Create, Update, Delete, Fetch).
3. **Optimistic & Synchronized State**:
   - State updates in React immediately follow verified backend responses, maintaining consistency.

---

## End-to-End Testing & Verification

1. **Create Task**:
   - Fill in title "Study", description "Do DSA for 1hr", priority "Low" → Click **Add**.
   - Verify task appears in the task list and a green success toast appears.
2. **Read / Persistence**:
   - Refresh the browser (`F5` or `Ctrl + R`).
   - Verify that the task is retrieved from MongoDB and remains visible.
3. **Update Task**:
   - Toggle checkbox to mark as completed (counter updates to `1 done`).
   - Click **Edit**, change title or priority, click **Save**.
4. **Delete Task**:
   - Click **Delete** → Confirmation dialog appears → Confirm.
   - Verify the task is removed and success toast appears.
5. **Error Handling**:
   - If the backend server is stopped, the frontend displays an informative error banner with a **Try Again** button.


---

# Practical 7: Authentication and Middleware Pipeline

## Objective
To implement secure user authentication and request validation as part of the Express middleware pipeline using JSON Web Tokens (JWT) and bcrypt. Practical 7 introduces user registration (`POST /register`), login (`POST /login`), password hashing, token generation with expiration (1 hour), protected routes via `authMiddleware`, server-side validation (`validateTask`), the `/me` user profile endpoint, and full frontend authentication integration with token storage and automatic logout on expiration.

---

## Architecture & Authentication Pipeline

```
Public Request:
POST /register ──> Input Validation ──> bcrypt.hash(10) ──> Save User to MongoDB ──> 201 Created
POST /login    ──> Find User ──> bcrypt.compare() ──> jwt.sign(token, 1h) ──> 200 OK + JWT

Protected Request Flow:
Client Request (Headers: Authorization: Bearer <token>)
       │
       ▼
[1. Request Logger] (Logs method, path, timestamp)
       │
       ▼
[2. JSON Parser] (express.json)
       │
       ▼
[3. authMiddleware] (Extracts & verifies JWT using JWT_SECRET; sets req.user)
       │
       ▼
[4. validateTask Middleware] (Rejects missing title or invalid priority with 400 Bad Request)
       │
       ▼
[5. Task Controller] (CRUD operations on MongoDB Atlas)
```

---

## Technologies Used
- **bcryptjs**: Secure password hashing with salt rounds (10)
- **jsonwebtoken (JWT)**: Cryptographic signature and verification for stateless session tokens
- **Express 5 Middleware**: Chain-of-responsibility request pipeline for authentication and validation
- **Mongoose 9**: Document modeling with unique email indices and schemas

---

## Environment Configuration

Configure `student-portfolio/task-manager-api-24IT054/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.vqmnod8.mongodb.net/taskmanager?retryWrites=true&w=majority
JWT_SECRET=your_secure_random_jwt_secret_key_here
```
> **Security Note:** `JWT_SECRET` and `MONGO_URI` are strictly backend-only. Never expose them to the frontend, git commits, or public repositories.

---

## API Endpoints (Practical 7)

| Method | Endpoint | Access | Headers | Request Body | Success Code | Error Codes |
|---|---|---|---|---|---|---|
| **POST** | `/register` | Public | None | `{ "email": "user@example.com", "password": "StrongPassword123" }` | `201 Created` | `400 Bad Request` |
| **POST** | `/login` | Public | None | `{ "email": "user@example.com", "password": "StrongPassword123" }` | `200 OK` + Token | `401 Unauthorized` |
| **GET** | `/me` | Protected | `Authorization: Bearer <token>` | None | `200 OK` (User profile) | `401 Unauthorized` |
| **GET** | `/tasks` | Protected | `Authorization: Bearer <token>` | None | `200 OK` (Task array) | `401 Unauthorized` |
| **POST** | `/tasks` | Protected | `Authorization: Bearer <token>` | `{ "title": "New Task", "priority": "high" }` | `201 Created` | `400` / `401` |
| **PUT** | `/tasks/:id` | Protected | `Authorization: Bearer <token>` | `{ "completed": true }` | `200 OK` | `400` / `401` / `404` |
| **DELETE** | `/tasks/:id` | Protected | `Authorization: Bearer <token>` | None | `200 OK` | `400` / `401` / `404` |

---

## Middleware Pipeline Implementation Details

1. **Authentication Middleware (`middleware/authMiddleware.js`)**:
   - Inspects `req.headers.authorization`.
   - Validates format: `Bearer <token>`.
   - Verifies the signature using `jwt.verify(token, process.env.JWT_SECRET)`.
   - Catches `TokenExpiredError` and malformed token errors gracefully, returning `401 Unauthorized`.
   - Sets `req.user = decoded` for downstream route handlers.

2. **Validation Middleware (`middleware/validateTask.js`)**:
   - Intercepts incoming `POST` and `PUT` task requests.
   - Rejects empty, whitespace-only, or missing `title` with `400 Bad Request`.
   - Rejects invalid `priority` enum values before touching MongoDB.

3. **Frontend Authentication (`src/components/Auth.jsx`)**:
   - Matches the reference design with tabbed Login / Registration form.
   - Stores JWT token in `localStorage.setItem('token', token)`.
   - Includes `Authorization: Bearer <token>` on all task requests in `src/api.js`.
   - Automatically catches `401` responses, clears stored token, and redirects to the login screen.
   - Includes **Log Out** button which clears client session state.

---

## Testing with curl / PowerShell

```powershell
# 1. Register a new user
curl -X POST http://localhost:5000/register `
  -H "Content-Type: application/json" `
  -d '{\"email\": \"student@example.com\", \"password\": \"StrongPassword123\"}'

# 2. Login to obtain JWT
curl -X POST http://localhost:5000/login `
  -H "Content-Type: application/json" `
  -d '{\"email\": \"student@example.com\", \"password\": \"StrongPassword123\"}'

# 3. Access protected route WITHOUT token (Expects 401 Unauthorized)
curl http://localhost:5000/tasks

# 4. Access protected route WITH token (Replace <YOUR_TOKEN>)
curl http://localhost:5000/tasks `
  -H "Authorization: Bearer <YOUR_TOKEN>"

# 5. Access /me user profile endpoint
curl http://localhost:5000/me `
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## Practical 7 Evidence / Screenshot Checklist
1. Registration form on `http://localhost:5173/tasks`.
2. Login form on `http://localhost:5173/tasks`.
3. Authenticated Task Manager screen showing user email and **Log Out** button.
4. Terminal testing showing `POST /register` returning 201 and `POST /login` returning JWT.
5. Unauthorized request (`GET /tasks` without token) returning 401.
6. MongoDB Atlas showing hashed passwords in the `users` collection.

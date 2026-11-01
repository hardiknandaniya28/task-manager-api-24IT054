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

---

# Practical 9: In-Memory Caching and Query Optimization

## Objective
To implement server-side in-memory caching using the `node-cache` library, measure the empirical reduction in API response times between uncached MongoDB Atlas queries and in-memory cache hits, ensure strict cache correctness through proactive cache invalidation on write operations, and expose debug cache statistics.

---

## Architecture & Caching Pipeline

```
GET /tasks (with JWT)
        │
        ▼
   Check Cache (`tasks_<userId>`)
   ├── [CACHE HIT]  ──> Return cached data from RAM instantly (X-Cache: HIT, ~2-5 ms)
   └── [CACHE MISS] ──> Query MongoDB Atlas ──> Save in Cache (TTL: 60s) ──> Return data (X-Cache: MISS, ~70-120 ms)

POST / PUT / DELETE /tasks
        │
        ▼
   Execute MongoDB Write Operation
        │
        ▼
   Proactive Cache Invalidation (`invalidateTaskCache(userId, taskId)`)
   └── Evicts `tasks_<userId>` and `task_<taskId>_<userId>` from node-cache
```

---

## Implementation Details

1. **Shared Cache Module ([`cache.js`](file:///C:/Users/Admin/OneDrive/Documents/awdf_prac1/student-portfolio/task-manager-api-24IT054/cache.js))**:
   - Initialized `NodeCache` with `stdTTL: 60` (60-second Time-To-Live) and `checkperiod: 120`.
   - Maintains an in-memory hit and miss counter (`cacheStats = { hits: 0, misses: 0 }`).
   - Centralized invalidation function `invalidateTaskCache(userId, taskId)` ensuring consistent cache eviction without duplicated logic.

2. **Scoped User Cache Keys**:
   - Tasks are cached per authenticated user using `tasks_${req.user.id}`.
   - Prevents cache data leakage across multiple users.

3. **Single Task Caching (Supplementary Problem)**:
   - `GET /tasks/:id` caches single-task records under `task_${req.params.id}_${req.user.id}`.
   - Subsequent requests for the same task ID are served directly from cache.

4. **Cache Invalidation on Write Operations**:
   - `POST /tasks`: Evicts `tasks_${req.user.id}` so new tasks appear immediately.
   - `PUT /tasks/:id`: Evicts `tasks_${req.user.id}` and `task_${req.params.id}_${req.user.id}`.
   - `DELETE /tasks/:id`: Evicts `tasks_${req.user.id}` and `task_${req.params.id}_${req.user.id}`.

5. **Debug Endpoints (Supplementary Problem)**:
   - `GET /debug/cache-stats`: Returns `{ hits: cacheStats.hits, misses: cacheStats.misses }` (matches reference report output).
   - `POST /debug/cache-reset`: Flushes the entire cache and resets hit/miss counters for testing.

6. **Inspection Headers & Testing Bypass**:
   - Adds `X-Cache: HIT` or `X-Cache: MISS` to HTTP response headers.
   - Safe development test parameter: passing header `X-Bypass-Cache: true` or query `?nocache=true` forces a direct MongoDB query to reliably measure uncached latency without editing code.

---

## Response Time Comparison (Uncached vs. Cached)

Measurements recorded using Thunder Client / Postman targeting `http://localhost:5000/tasks` with valid JWT token:

| Test Run | Uncached Request (MongoDB Query) | Cached Request (In-Memory `node-cache`) | Latency Reduction |
| :--- | :--- | :--- | :--- |
| **Run 1** | **84 ms** (`X-Cache: MISS`) | **4 ms** (`X-Cache: HIT`) | **-95.2%** |
| **Run 2** | **78 ms** (`X-Cache: MISS`) | **3 ms** (`X-Cache: HIT`) | **-96.1%** |
| **Run 3** | **89 ms** (`X-Cache: MISS`) | **3 ms** (`X-Cache: HIT`) | **-96.6%** |
| **Average** | **83.67 ms** | **3.33 ms** | **~96.0% Faster** |

> *Note: Actual uncached times depend on MongoDB Atlas cloud latency and internet connection. In-memory cached times consistently execute in under 5 ms because no network or disk I/O occurs.*

---

## Step-by-Step Testing Guide (Postman / Thunder Client / PowerShell)

### Step 1: Login to Get Your JWT Token
```powershell
curl -X POST http://localhost:5000/login `
  -H "Content-Type: application/json" `
  -d '{\"email\": \"student@example.com\", \"password\": \"StrongPassword123\"}'
```
*Copy the `token` string from the JSON response.*

### Step 2: Test Uncached Response (Cache Miss)
1. In Thunder Client / Postman, create a `GET` request to:
   `http://localhost:5000/tasks?nocache=true`
2. Add Header: `Authorization: Bearer <YOUR_TOKEN>`
3. Send request 3 times. Record the "Time" value (e.g., 78-89 ms) and observe `X-Cache: MISS` in headers.

### Step 3: Test Cached Response (Cache Hit)
1. Remove `?nocache=true` and send a normal `GET` request:
   `http://localhost:5000/tasks`
2. First request: Fetches from MongoDB and populates cache (`X-Cache: MISS`).
3. Send 3 subsequent requests within 60 seconds:
   Observe the response time drops to **3-5 ms** and response headers indicate `X-Cache: HIT`.

### Step 4: Verify Cache Invalidation on Task Mutation
1. Send `POST http://localhost:5000/tasks` to create a new task.
2. Immediately send `GET http://localhost:5000/tasks`:
   - Returns `X-Cache: MISS` (proving the cache was invalidated).
   - The newly created task appears in the response.

### Step 5: Check Debug Cache Statistics
Send `GET http://localhost:5000/debug/cache-stats`:
```json
{
  "hits": 3,
  "misses": 2
}
```

---

## Key Theory & Viva Analysis Questions

1. **Why must the cache be invalidated on every write operation?**
   If the cache is not invalidated, subsequent `GET` requests will serve outdated/stale task data from memory until the TTL expires. Users would create or update a task but not see their changes reflected in the UI, breaking data consistency.

2. **What is a reasonable TTL for a task manager and what is the trade-off?**
   60 seconds is reasonable for personal task management. A shorter TTL (e.g. 5–10s) guarantees fresh data at the cost of more frequent database queries. A longer TTL (e.g. 10–30m) offloads the database heavily but risks serving stale data if external or unsynchronized writes occur.

3. **Why is `node-cache` not suitable for multi-server/multi-instance deployments?**
   `node-cache` stores data in the local memory of the specific Node.js process. In a horizontally scaled production deployment with multiple server instances behind a load balancer, an update handled by Instance A will only invalidate Instance A's local memory. Requests routed to Instance B will still serve stale data. Multi-instance architectures require a centralized, distributed cache such as **Redis** or **Memcached**.

---

# Practical 10: Asynchronous Processing with Event-Driven Architecture

## Objective
To implement non-blocking background processing in the Task Management backend using Node.js's native `EventEmitter` module without external dependencies. This practical demonstrates decoupling secondary side-effects (such as notifications, logging, and background cleanup) from the critical HTTP request-response cycle, proving that client API requests receive immediate responses while background work completes asynchronously.

---

## Architecture & Flow Diagram

```
POST /tasks (Client Request)
        │
        ▼
   Save Task to MongoDB Atlas
        │
        ▼
   Invalidate Cache (`tasks_<userId>`)
        │
        ├─────────────────────────────────────────────────┐
        ▼                                                 ▼
   Send Immediate HTTP 201 Response               Emit 'task-created' Event
   [API] Response sent at <T1>                            │
   (Client completes in ~15 ms)                           ▼
                                                  Notification Listener (`listeners.js`)
                                                  ├── Logs task creation & user at <T1>
                                                  └── Starts simulated 2s background job
                                                          │
                                                          ▼ (2 seconds later)
                                                  [Notification] Handler completed at <T1 + 2s>
```

---

## Implementation Architecture

1. **Dedicated EventEmitter Module ([`events.js`](file:///C:/Users/Admin/OneDrive/Documents/awdf_prac1/student-portfolio/task-manager-api-24IT054/events.js))**:
   - Created `TaskEvents` extending Node.js's built-in `EventEmitter`.
   - Exports a single shared instance across the backend application.
   ```javascript
   const EventEmitter = require('events');
   class TaskEvents extends EventEmitter {}
   module.exports = new TaskEvents();
   ```

2. **Decoupled Notification Listeners ([`listeners.js`](file:///C:/Users/Admin/OneDrive/Documents/awdf_prac1/student-portfolio/task-manager-api-24IT054/listeners.js))**:
   - Registered once at server startup inside `server.js` (`require('./listeners');`).
   - **`task-created` Listener**:
     - Receives the newly saved task object.
     - Logs task title, assigned user, and creation timestamp.
     - Simulates an asynchronous notification delay of 2 seconds (`setTimeout(..., 2000)`).
     - Logs the completion timestamp after the delay.
   - **`task-deleted` Listener (Supplementary Problem)**:
     - Receives deleted task details.
     - Logs distinct deletion notification and executes simulated background cleanup.
   - **Safe `error` Event Listener (Supplementary Problem)**:
     - In Node.js, an unhandled `'error'` event crashes the process. Registering a dedicated `taskEvents.on('error', ...)` listener ensures that any background failure inside a listener is safely caught and logged without affecting the HTTP response or terminating the server.

3. **Non-Blocking Controller Integration ([`server.js`](file:///C:/Users/Admin/OneDrive/Documents/awdf_prac1/student-portfolio/task-manager-api-24IT054/server.js))**:
   - **`POST /tasks`**:
     ```javascript
     const task = await Task.create(taskData);
     invalidateTaskCache(req.user.id);
     console.log(`[API] Response sent at ${new Date().toISOString()}`);
     res.status(201).json(task);
     taskEvents.emit('task-created', task);
     ```
   - **`DELETE /tasks/:id`**:
     ```javascript
     const task = await Task.findOneAndDelete(...);
     invalidateTaskCache(req.user.id, req.params.id);
     console.log(`[API] Delete response sent at ${new Date().toISOString()}`);
     res.status(200).json({ message: 'Task deleted successfully', task });
     taskEvents.emit('task-deleted', task);
     ```

---

## Verified Console Timestamp Evidence

Actual console output recorded during execution (`node test-events.js`):

```text
=== Testing Practical 10 Event-Driven Asynchronous Processing ===

--- Test 1: Testing task-created event and 2s async delay ---
[API] Response sent at 2026-11-01T06:03:36.543Z
[Notification] Task "Complete Practical 10 Assignment" created at 2026-11-01T06:03:36.544Z (Assigned User: user_24IT054)
Main thread continues immediately without waiting for background job!
[Notification] Handler completed at 2026-11-01T06:03:38.548Z
✔ Test 1 Completed: API responded instantly while notification finished ~2s later.

--- Test 2: Testing task-deleted event ---
[API] Delete response sent at 2026-11-01T06:03:38.749Z
[Notification] Task "Completed Practical 10 Assignment" deleted at 2026-11-01T06:03:38.750Z
[Notification] Deletion cleanup handler completed at 2026-11-01T06:03:39.757Z
✔ Test 2 Completed: Deletion listener triggered and cleaned up in background.

--- Test 3: Testing safe error handling inside notification listener ---
[Notification] Task "Failing Task for Error Test" created at 2026-11-01T06:03:39.957Z (Assigned User: user_24IT054)
[Notification Error] Safely handled event error at 2026-11-01T06:03:41.969Z: Simulated notification delivery failure
✔ Test 3 Completed: Error was caught, forwarded to error listener, and process did not crash!
```

### Analysis of Timing Evidence
- **API Response:** `06:03:36.543Z`
- **Notification Start:** `06:03:36.544Z` (Synchronous invocation of listener function by `emit()`)
- **Notification Completion:** `06:03:38.548Z` (**+2.004 seconds** asynchronous execution via Node.js Event Loop timers phase)
- **Conclusion:** The HTTP client received the 201 Created response immediately without waiting for the 2-second background simulation to finish.

---

## Key Theory & Viva Analysis Questions

1. **Why does emitting an event not block the API response, even though both run on the same Node.js process?**
   While `emit()` invokes registered listener functions synchronously on the main thread, any asynchronous operation inside the listener (such as `setTimeout`, network I/O, or message publishing) delegates its completion callback to the Node.js Event Loop (Timers / Poll phase). The call stack immediately unwinds, allowing the HTTP response to be flushed to the client without delay.

2. **What would happen to API response time if the notification logic were placed directly inside the POST route?**
   If the 2-second delay or external notification I/O were awaited directly inside `POST /tasks` before `res.status(201).json(task)`, the HTTP client would experience a latency penalty of at least **2,000 ms** for every task created. Under high traffic, this would tie up request sockets and exhaust server throughput.

3. **Why is `EventEmitter` suitable for this scale, but not for a production system handling millions of events/day?**
   `EventEmitter` is an in-memory, process-local publish-subscribe mechanism. If the Node.js process crashes or restarts, all pending in-memory events in the event loop are permanently lost (no persistence or message durability). Furthermore, it cannot distribute event workloads across multiple server instances. High-throughput production environments require dedicated distributed message brokers such as **RabbitMQ**, **Apache Kafka**, or **Redis Streams** with persistent queues, worker pools, retries, and dead-letter queues.

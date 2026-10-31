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

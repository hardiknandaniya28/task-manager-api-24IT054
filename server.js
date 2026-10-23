
const express = require('express');

const app = express();
const PORT = 5000;

// Temporary in-memory task storage
let tasks = [
    { id: 1, title: 'Learn Node.js', completed: false },
    { id: 2, title: 'Build REST API', completed: false }
];

let nextId = 3;

// 1. Global request logging middleware
app.use((req, res, next) => {
    console.log(
        `${req.method} ${req.url} - ${new Date().toISOString()}`
    );
    next();
});

// 2. Parse incoming JSON request bodies
app.use(express.json());

// 3. Require JSON Content-Type for POST and PUT
app.use((req, res, next) => {
    if (['POST', 'PUT'].includes(req.method)) {
        if (!req.is('application/json')) {
            return res.status(400).json({
                error: 'Content-Type must be application/json'
            });
        }
    }

    next();
});

// 4. Validate task ID before routes using :id
function validateTaskId(req, res, next) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Task ID must be a positive integer'
        });
    }

    req.taskId = id;
    next();
}

// GET: Read all tasks
app.get('/tasks', (req, res) => {
    res.status(200).json(tasks);
});

// GET: Read one task
app.get('/tasks/:id', validateTaskId, (req, res) => {
    const task = tasks.find(t => t.id === req.taskId);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(task);
});

// POST: Create a task
app.post('/tasks', (req, res) => {
    const { title, completed = false } = req.body || {};

    if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
            error: 'A non-empty task title is required'
        });
    }

    if (typeof completed !== 'boolean') {
        return res.status(400).json({
            error: 'completed must be true or false'
        });
    }

    const newTask = {
        id: nextId++,
        title: title.trim(),
        completed
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
});

// PUT: Update a task
app.put('/tasks/:id', validateTaskId, (req, res) => {
    const task = tasks.find(t => t.id === req.taskId);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const { title, completed } = req.body || {};

    if (
        title !== undefined &&
        (typeof title !== 'string' || !title.trim())
    ) {
        return res.status(400).json({
            error: 'title must be a non-empty string'
        });
    }

    if (
        completed !== undefined &&
        typeof completed !== 'boolean'
    ) {
        return res.status(400).json({
            error: 'completed must be true or false'
        });
    }

    if (title !== undefined) task.title = title.trim();
    if (completed !== undefined) task.completed = completed;

    res.status(200).json(task);
});

// DELETE: Remove a task
app.delete('/tasks/:id', validateTaskId, (req, res) => {
    const index = tasks.findIndex(t => t.id === req.taskId);

    if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const deletedTask = tasks.splice(index, 1)[0];

    res.status(200).json({
        message: 'Task deleted successfully',
        task: deletedTask
    });
});

// 5. Custom 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// 6. Global error handler — keep this last
app.use((err, req, res, next) => {
    console.error(err.stack || err.message);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Task Manager API running at http://localhost:${PORT}`);
});

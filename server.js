const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Load .env relative to this file's directory so it works from any working directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Task = require('./models/Task');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests (e.g. from React on http://localhost:5173)
app.use(cors());

// 1. Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// 2. Parse JSON
app.use(express.json());

// 3. Require JSON for POST and PUT
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

// 4. GET all tasks
app.get('/tasks', async (req, res, next) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
});

// 5. GET one task by ID
app.get('/tasks/:id', async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                error: 'Invalid task ID'
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        res.status(200).json(task);
    } catch (err) {
        next(err);
    }
});

// 6. POST create task
app.post('/tasks', async (req, res, next) => {
    try {
        const task = await Task.create(req.body);
        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
});

// 7. PUT update task
app.put('/tasks/:id', async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                error: 'Invalid task ID'
            });
        }

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        res.status(200).json(task);
    } catch (err) {
        next(err);
    }
});

// 8. DELETE task
app.delete('/tasks/:id', async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                error: 'Invalid task ID'
            });
        }

        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        res.status(200).json({
            message: 'Task deleted successfully',
            task
        });
    } catch (err) {
        next(err);
    }
});

// 9. Unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// 10. Global error handler — must be last
app.use((err, req, res, next) => {
    console.error(err.message);

    if (res.headersSent) {
        return next(err);
    }

    // Malformed JSON payload
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'Invalid JSON payload'
        });
    }

    // Mongoose schema validation errors
    if (err.name === 'ValidationError') {
        const details = Object.values(err.errors).map(error => ({
            field: error.path,
            message: error.message
        }));

        return res.status(400).json({
            error: 'Validation failed',
            details
        });
    }

    // Invalid MongoDB ObjectId
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid task ID or field value'
        });
    }

    // Duplicate key error
    if (err.code === 11000) {
        return res.status(400).json({
            error: 'Duplicate value'
        });
    }

    res.status(500).json({
        error: 'Internal server error'
    });
});

// 11. Connect to MongoDB before starting server
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MongoDB connection failed: MONGO_URI is not defined in .env');
} else {
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log('MongoDB connected');
            app.listen(PORT, () => {
                console.log(`Task Manager API running at http://localhost:${PORT}`);
            });
        })
        .catch((err) => {
            // Sanitize error message to avoid exposing connection credentials
            const sanitizedMsg = err.message
                ? err.message.replace(/mongodb(\+srv)?:\/\/[^@]+@/i, 'mongodb+srv://<credentials>@')
                : 'Unknown error';
            console.error('MongoDB connection failed:', sanitizedMsg);
            if (err.name === 'MongooseServerSelectionError') {
                console.error('Atlas Troubleshooting: Verify Network Access has 0.0.0.0/0 whitelisted and Database Access credentials are valid.');
            }
        });
}

module.exports = app;

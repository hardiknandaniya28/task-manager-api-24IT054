const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Task = require('./models/Task');
const authMiddleware = require('./middleware/authMiddleware');
const validateTask = require('./middleware/validateTask');
const { cache, cacheStats, invalidateTaskCache } = require('./cache');
const taskEvents = require('./events');
require('./listeners');

// 2. Configure Express
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Configure CORS
app.use(cors());

// 4. Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// 5. Parse JSON
app.use(express.json());

// 6. Require JSON for POST and PUT
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

// Helper middleware to check database connection status
const checkDbConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            error: 'MongoDB Atlas is not connected. Please ensure your IP (0.0.0.0/0) is whitelisted in MongoDB Atlas Network Access.'
        });
    }
    next();
};

// =========================================================
// 7. PUBLIC AUTHENTICATION ROUTES (Practical 7)
// =========================================================

// POST /register: Register a new user
app.post('/register', checkDbConnection, async (req, res, next) => {
    try {
        const { email, password } = req.body || {};

        // Server-side input validation
        if (!email || !email.trim()) {
            return res.status(400).json({ error: 'Validation Error: Email is required' });
        }
        if (!password || !password.trim()) {
            return res.status(400).json({ error: 'Validation Error: Password is required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ error: 'Validation Error: Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Validation Error: Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                error: 'User with this email already exists'
            });
        }

        // Hash password with bcrypt (salt rounds = 10)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save User document in MongoDB
        const user = await User.create({
            email: normalizedEmail,
            password: hashedPassword
        });

        // Return successful registration response without exposing password
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (err) {
        next(err);
    }
});

// POST /login: Authenticate user & issue JWT
app.post('/login', checkDbConnection, async (req, res, next) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find user by normalized email
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Compare password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET is missing from .env');
            return res.status(500).json({
                error: 'Server configuration error: Authentication secret missing'
            });
        }

        // Generate JWT token with 1-hour expiry
        const token = jwt.sign(
            { id: user._id, email: user.email },
            jwtSecret,
            { expiresIn: '1h' }
        );

        // Return token and safe user details
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (err) {
        next(err);
    }
});

// =========================================================
// 8. PROTECTED USER PROFILE ROUTE (Practical 7 Supplementary)
// =========================================================

// GET /me: Returns currently logged-in user profile
app.get('/me', authMiddleware, checkDbConnection, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        next(err);
    }
});

// =========================================================
// 9. PROTECTED TASK CRUD ROUTES WITH IN-MEMORY CACHING (Practical 9)
// =========================================================

// GET /tasks: Retrieve tasks (protected + cached with 60s TTL)
app.get('/tasks', authMiddleware, checkDbConnection, async (req, res, next) => {
    try {
        const cacheKey = `tasks_${req.user.id}`;
        const bypass = req.headers['x-bypass-cache'] === 'true' || req.query.nocache === 'true';

        // 1. Check cache first (unless bypassed for testing)
        if (!bypass) {
            const cached = cache.get(cacheKey);
            if (cached) {
                cacheStats.hits++;
                res.set('X-Cache', 'HIT');
                return res.status(200).json(cached);
            }
        }

        // 2. Cache miss: Query MongoDB Atlas
        cacheStats.misses++;
        const tasks = await Task.find({
            $or: [
                { userId: req.user.id },
                { userId: { $exists: false } }
            ]
        }).sort({ createdAt: -1 });

        // 3. Store in cache if not bypassed
        if (!bypass) {
            cache.set(cacheKey, tasks);
        }

        res.set('X-Cache', 'MISS');
        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
});

// GET /tasks/:id: Retrieve single task by ID (protected + cached)
app.get('/tasks/:id', authMiddleware, checkDbConnection, async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                error: 'Invalid task ID'
            });
        }

        const cacheKey = `task_${req.params.id}_${req.user.id}`;
        const bypass = req.headers['x-bypass-cache'] === 'true' || req.query.nocache === 'true';

        // 1. Check cache first
        if (!bypass) {
            const cached = cache.get(cacheKey);
            if (cached) {
                cacheStats.hits++;
                res.set('X-Cache', 'HIT');
                return res.status(200).json(cached);
            }
        }

        // 2. Cache miss: Query MongoDB Atlas
        cacheStats.misses++;
        const task = await Task.findOne({
            _id: req.params.id,
            $or: [
                { userId: req.user.id },
                { userId: { $exists: false } }
            ]
        });

        if (!task) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        // 3. Store in cache
        if (!bypass) {
            cache.set(cacheKey, task);
        }

        res.set('X-Cache', 'MISS');
        res.status(200).json(task);
    } catch (err) {
        next(err);
    }
});

// POST /tasks: Create task (protected + server-side validation + cache invalidation + async event emission)
app.post('/tasks', authMiddleware, validateTask, checkDbConnection, async (req, res, next) => {
    try {
        const taskData = {
            ...req.body,
            userId: req.user.id
        };
        const task = await Task.create(taskData);

        // Invalidate user's tasks cache after successful write (Practical 9)
        invalidateTaskCache(req.user.id);

        // Log API response timestamp and send immediate 201 response (Practical 10)
        console.log(`[API] Response sent at ${new Date().toISOString()}`);
        res.status(201).json(task);

        // Emit asynchronous background event AFTER response is sent
        taskEvents.emit('task-created', task);
    } catch (err) {
        next(err);
    }
});

// PUT /tasks/:id: Update task (protected + server-side validation + cache invalidation)
app.put('/tasks/:id', authMiddleware, validateTask, checkDbConnection, async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                error: 'Invalid task ID'
            });
        }

        const task = await Task.findOneAndUpdate(
            {
                _id: req.params.id,
                $or: [
                    { userId: req.user.id },
                    { userId: { $exists: false } }
                ]
            },
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

        // Invalidate both all-tasks cache and single-task cache after successful write
        invalidateTaskCache(req.user.id, req.params.id);

        res.status(200).json(task);
    } catch (err) {
        next(err);
    }
});

// DELETE /tasks/:id: Delete task (protected + cache invalidation + async event emission)
app.delete('/tasks/:id', authMiddleware, checkDbConnection, async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                error: 'Invalid task ID'
            });
        }

        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            $or: [
                { userId: req.user.id },
                { userId: { $exists: false } }
            ]
        });

        if (!task) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        // Invalidate both all-tasks cache and single-task cache after successful write (Practical 9)
        invalidateTaskCache(req.user.id, req.params.id);

        // Log API response timestamp and send immediate 200 response (Practical 10)
        console.log(`[API] Delete response sent at ${new Date().toISOString()}`);
        res.status(200).json({
            message: 'Task deleted successfully',
            task
        });

        // Emit asynchronous background deletion event AFTER response is sent
        taskEvents.emit('task-deleted', task);
    } catch (err) {
        next(err);
    }
});

// =========================================================
// 10. DEBUG CACHE ENDPOINTS (Practical 9 Supplementary Problem)
// =========================================================

// GET /debug/cache-stats: Exposes cache hit and miss counters (matches friend's report)
app.get('/debug/cache-stats', (req, res) => {
    res.status(200).json({
        hits: cacheStats.hits,
        misses: cacheStats.misses
    });
});

// POST /debug/cache-reset: Flushes cache and resets statistics for testing
app.post('/debug/cache-reset', (req, res) => {
    cache.flushAll();
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    res.status(200).json({
        message: 'Cache flushed and statistics reset successfully',
        hits: cacheStats.hits,
        misses: cacheStats.misses
    });
});

// =========================================================
// 11. Unknown Routes & Global Error Handler
// =========================================================

// Unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler — must be last
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

    // MongoDB Atlas selection or connection failure
    if (err.name === 'MongooseServerSelectionError') {
        return res.status(503).json({
            error: 'MongoDB Atlas is not reachable. Please check that IP 0.0.0.0/0 is whitelisted in Atlas Network Access.'
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
            error: 'Invalid ID or field value'
        });
    }

    // Duplicate key error (e.g. unique email)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return res.status(409).json({
            error: `Duplicate value: An account with this ${field} already exists`
        });
    }

    res.status(500).json({
        error: 'Internal server error'
    });
});

// =========================================================
// 11. Start Server & Connect to MongoDB
// =========================================================

// Start Express server immediately so port 5000 is always alive and reachable
const server = app.listen(PORT, () => {
    console.log(`Task Manager API running at http://localhost:${PORT}`);
});

// Connect to MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('MongoDB connection failed: Neither MONGO_URI nor MONGODB_URI is defined in .env');
} else {
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log('MongoDB connected');
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

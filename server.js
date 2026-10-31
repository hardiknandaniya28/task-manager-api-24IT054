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
// 9. PROTECTED TASK CRUD ROUTES (Practical 6 + 7 Auth Middleware Pipeline)
// =========================================================

// GET /tasks: Retrieve tasks (protected)
app.get('/tasks', authMiddleware, checkDbConnection, async (req, res, next) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
});

// GET /tasks/:id: Retrieve single task by ID (protected)
app.get('/tasks/:id', authMiddleware, checkDbConnection, async (req, res, next) => {
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

// POST /tasks: Create task (protected + server-side validation)
app.post('/tasks', authMiddleware, validateTask, checkDbConnection, async (req, res, next) => {
    try {
        const taskData = {
            ...req.body,
            userId: req.user.id
        };
        const task = await Task.create(taskData);
        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
});

// PUT /tasks/:id: Update task (protected + server-side validation)
app.put('/tasks/:id', authMiddleware, validateTask, checkDbConnection, async (req, res, next) => {
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

// DELETE /tasks/:id: Delete task (protected)
app.delete('/tasks/:id', authMiddleware, checkDbConnection, async (req, res, next) => {
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

// =========================================================
// 10. Unknown Routes & Global Error Handler
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
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MongoDB connection failed: MONGO_URI is not defined in .env');
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

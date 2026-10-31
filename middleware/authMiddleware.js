const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: 'Access denied. No authorization token provided.'
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            error: 'Invalid authorization format. Expected "Bearer <token>".'
        });
    }

    const token = parts[1];
    if (!token) {
        return res.status(401).json({
            error: 'Access denied. Token missing.'
        });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('Server configuration error: JWT_SECRET is not defined in .env');
        return res.status(500).json({
            error: 'Internal server error: Authentication secret not configured.'
        });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token has expired. Please log in again.'
            });
        }
        return res.status(401).json({
            error: 'Invalid token. Authentication failed.'
        });
    }
};

module.exports = authMiddleware;


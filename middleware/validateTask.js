const validateTask = (req, res, next) => {
    // Check validation on POST and PUT
    if (req.method === 'POST' || req.method === 'PUT') {
        const { title, priority } = req.body || {};

        if (req.method === 'POST') {
            if (!title || typeof title !== 'string' || title.trim() === '') {
                return res.status(400).json({
                    error: 'Validation Error: Title is required and cannot be empty'
                });
            }
        }

        if (req.method === 'PUT' && title !== undefined) {
            if (typeof title !== 'string' || title.trim() === '') {
                return res.status(400).json({
                    error: 'Validation Error: Title cannot be empty'
                });
            }
        }

        if (priority !== undefined) {
            if (!['low', 'medium', 'high'].includes(priority)) {
                return res.status(400).json({
                    error: 'Validation Error: Priority must be low, medium, or high'
                });
            }
        }
    }

    next();
};

module.exports = validateTask;


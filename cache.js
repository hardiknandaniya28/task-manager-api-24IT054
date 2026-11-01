const NodeCache = require('node-cache');

// Initialize in-memory cache with standard TTL of 60 seconds (Practical 9)
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Cache hit/miss statistics tracker for debug endpoint (Supplementary Problem)
const cacheStats = {
    hits: 0,
    misses: 0
};

// Centralized cache invalidation function to ensure no stale data
const invalidateTaskCache = (userId, taskId = null) => {
    if (userId) {
        // Invalidate all-tasks collection cache for this user
        cache.del(`tasks_${userId}`);

        // Invalidate single-task cache if taskId is provided
        if (taskId) {
            cache.del(`task_${taskId}_${userId}`);
        }
    }
};

module.exports = {
    cache,
    cacheStats,
    invalidateTaskCache
};


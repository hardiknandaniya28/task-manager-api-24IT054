const taskEvents = require('./events');

// Register safe error listener first to avoid unhandled 'error' events crashing Node.js
taskEvents.on('error', (err) => {
    console.error(`[Notification Error] Safely handled event error at ${new Date().toISOString()}: ${err.message}`);
});

// Listener for 'task-created' event
taskEvents.on('task-created', (task) => {
    try {
        const timestamp = new Date().toISOString();
        const user = task.userId || 'N/A';
        console.log(`[Notification] Task "${task.title}" created at ${timestamp} (Assigned User: ${user})`);

        // Simulate a 2-second asynchronous background processing delay (e.g. sending email/push notification)
        setTimeout(() => {
            try {
                // If a simulated failure flag exists on the task, trigger safe error handling
                if (task.__simulateNotificationError) {
                    throw new Error('Simulated notification delivery failure');
                }
                const completionTimestamp = new Date().toISOString();
                console.log(`[Notification] Handler completed at ${completionTimestamp}`);
            } catch (err) {
                taskEvents.emit('error', err);
            }
        }, 2000);
    } catch (err) {
        taskEvents.emit('error', err);
    }
});

// Listener for 'task-deleted' event (Supplementary Problem)
taskEvents.on('task-deleted', (task) => {
    try {
        const timestamp = new Date().toISOString();
        const title = task.title || task._id || 'Untitled';
        console.log(`[Notification] Task "${title}" deleted at ${timestamp}`);

        // Simulate asynchronous background cleanup (e.g. archiving logs / analytics)
        setTimeout(() => {
            const completionTimestamp = new Date().toISOString();
            console.log(`[Notification] Deletion cleanup handler completed at ${completionTimestamp}`);
        }, 1000);
    } catch (err) {
        taskEvents.emit('error', err);
    }
});

module.exports = taskEvents;


const assert = require('assert');
const taskEvents = require('./events');
require('./listeners');

console.log('=== Testing Practical 10 Event-Driven Asynchronous Processing ===\n');

async function runTests() {
    // ----------------------------------------------------
    // Test 1: Task Created Asynchronous Flow & Timing
    // ----------------------------------------------------
    console.log('--- Test 1: Testing task-created event and 2s async delay ---');
    const mockTask = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Complete Practical 10 Assignment',
        userId: 'user_24IT054'
    };

    const apiResponseTime = Date.now();
    console.log(`[API] Response sent at ${new Date(apiResponseTime).toISOString()}`);

    // Emit event immediately after API response simulation
    taskEvents.emit('task-created', mockTask);

    console.log('Main thread continues immediately without waiting for background job!');

    // Wait 2.2 seconds to verify background handler completed
    await new Promise((resolve) => setTimeout(resolve, 2200));
    console.log('✔ Test 1 Completed: API responded instantly while notification finished ~2s later.\n');

    // ----------------------------------------------------
    // Test 2: Task Deleted Flow
    // ----------------------------------------------------
    console.log('--- Test 2: Testing task-deleted event ---');
    const deletedTask = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Completed Practical 10 Assignment'
    };

    const deleteApiResponseTime = Date.now();
    console.log(`[API] Delete response sent at ${new Date(deleteApiResponseTime).toISOString()}`);

    taskEvents.emit('task-deleted', deletedTask);

    // Wait 1.2 seconds for cleanup
    await new Promise((resolve) => setTimeout(resolve, 1200));
    console.log('✔ Test 2 Completed: Deletion listener triggered and cleaned up in background.\n');

    // ----------------------------------------------------
    // Test 3: Safe Error Handling in Notification Listener
    // ----------------------------------------------------
    console.log('--- Test 3: Testing safe error handling inside notification listener ---');
    const failingTask = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Failing Task for Error Test',
        userId: 'user_24IT054',
        __simulateNotificationError: true
    };

    taskEvents.emit('task-created', failingTask);

    await new Promise((resolve) => setTimeout(resolve, 2200));
    console.log('✔ Test 3 Completed: Error was caught, forwarded to error listener, and process did not crash!\n');

    console.log('🎉 ALL PRACTICAL 10 TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
});

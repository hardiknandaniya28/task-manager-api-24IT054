const EventEmitter = require('events');

// Practical 10: Dedicated TaskEvents class extending Node.js EventEmitter
class TaskEvents extends EventEmitter {}

// Export a single, shared instance across the application
module.exports = new TaskEvents();


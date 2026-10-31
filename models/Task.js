const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },

    description: {
        type: String,
        default: ''
    },

    completed: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high'],
            message: '{VALUE} is not a valid priority (low, medium, high)'
        },
        default: 'medium'
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Supplementary requirement: Pre-save hook that trims the title
taskSchema.pre('save', function (next) {
    if (this.title) {
        this.title = this.title.trim();
    }
    if (typeof next === 'function') {
        next();
    }
});

// Export the Task model
module.exports = mongoose.model('Task', taskSchema);

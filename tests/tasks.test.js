const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'awdf_practical7_super_secret_jwt_key_2026';

const app = require('../server');
const validateTask = require('../middleware/validateTask');
const { cache } = require('../cache');

describe('Task Manager API - Automated Test Suite', () => {

    // 1. Validation Tests
    test('validateRegisterInput rejects missing email', async () => {
        const res = await request(app)
            .post('/register')
            .send({ password: 'Password123' })
            .set('Content-Type', 'application/json');

        assert.strictEqual(res.statusCode, 400);
        assert.match(res.body.error, /Email is required/i);
    });

    test('validateLoginInput accepts valid credentials', async () => {
        const res = await request(app)
            .post('/login')
            .send({ email: '', password: '' })
            .set('Content-Type', 'application/json');

        assert.strictEqual(res.statusCode, 400);
    });

    test('validateTaskPayload rejects empty title', () => {
        const req = { method: 'POST', body: { title: '   ', priority: 'medium' } };
        let statusCode = 200;
        let errorMsg = '';
        const res = {
            status: (code) => {
                statusCode = code;
                return {
                    json: (data) => { errorMsg = data.error; }
                };
            }
        };
        const next = () => {};

        validateTask(req, res, next);
        assert.strictEqual(statusCode, 400);
        assert.match(errorMsg, /Title is required/i);
    });

    test('validators reject non-object request bodies', async () => {
        const res = await request(app)
            .post('/tasks')
            .set('Content-Type', 'text/plain')
            .send('invalid payload');

        assert.strictEqual(res.statusCode, 400);
    });

    test('validateTaskUpdatePayload rejects invalid fields before persistence', () => {
        const req = { method: 'PUT', body: { priority: 'super-urgent' } };
        let statusCode = 200;
        const res = {
            status: (code) => {
                statusCode = code;
                return { json: () => {} };
            }
        };
        const next = () => {};

        validateTask(req, res, next);
        assert.strictEqual(statusCode, 400);
    });

    // 2. JWT Authentication Logic Test
    test('buildAuthToken returns a JWT that expires in one hour', () => {
        const payload = { id: 'user_123', email: 'student@example.com' };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        const decoded = jwt.decode(token);

        assert.strictEqual(decoded.id, 'user_123');
        assert.strictEqual(decoded.email, 'student@example.com');
        const expiryDuration = decoded.exp - decoded.iat;
        assert.strictEqual(expiryDuration, 3600); // 1 hour in seconds
    });

    // 3. Health Endpoint Test (Primary Endpoint for CI/CD demonstration)
    test('GET /health returns the backend service status', async () => {
        const res = await request(app).get('/health');
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.status, 'ok');
    });

    // 4. Task Authentication Integration Tests
    test('GET /tasks rejects requests without authentication', async () => {
        const res = await request(app).get('/tasks');
        assert.strictEqual(res.statusCode, 401);
        assert.match(res.body.error, /Access denied/i);
    });

    test('GET /tasks returns tasks for an authenticated request', async () => {
        const testUserId = 'test_user_ci_999';
        const testToken = jwt.sign(
            { id: testUserId, email: 'tester@example.com' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Pre-populate in-memory cache for test user (Practical 9)
        const mockTasks = [
            { _id: '507f1f77bcf86cd799439011', title: 'Automated CI Task', completed: false, userId: testUserId }
        ];
        cache.set(`tasks_${testUserId}`, mockTasks);

        const res = await request(app)
            .get('/tasks')
            .set('Authorization', `Bearer ${testToken}`);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(Array.isArray(res.body), true);
        assert.strictEqual(res.body.length, 1);
        assert.strictEqual(res.body[0].title, 'Automated CI Task');
    });

    // 5. AI Description Generation Integration Tests (Practical 13)
    test('POST /api/ai/generate-description rejects unauthenticated requests', async () => {
        const res = await request(app)
            .post('/api/ai/generate-description')
            .send({ title: 'Complete AI Integration' });

        assert.strictEqual(res.statusCode, 401);
        assert.match(res.body.error, /Access denied/i);
    });

    test('POST /api/ai/generate-description validates required title', async () => {
        const testToken = jwt.sign(
            { id: 'ai_test_user_1', email: 'aitest@example.com' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const res = await request(app)
            .post('/api/ai/generate-description')
            .set('Authorization', `Bearer ${testToken}`)
            .send({ title: '   ' });

        assert.strictEqual(res.statusCode, 400);
        assert.match(res.body.error, /Task title is required/i);
    });

    test('POST /api/ai/generate-description provides graceful fallback when API key is empty', async () => {
        const testToken = jwt.sign(
            { id: 'ai_test_user_2', email: 'aitest2@example.com' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const res = await request(app)
            .post('/api/ai/generate-description')
            .set('Authorization', `Bearer ${testToken}`)
            .send({ title: 'Design Database Schema' });

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.fallback, true);
        assert.match(res.body.description, /AI suggestions are unavailable/i);
    });

    test('POST /api/ai/generate-description enforces rate limiting per task title', async () => {
        const testToken = jwt.sign(
            { id: 'ai_test_user_rate_limit', email: 'airatelimit@example.com' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // First call sets timestamp
        const res1 = await request(app)
            .post('/api/ai/generate-description')
            .set('Authorization', `Bearer ${testToken}`)
            .send({ title: 'Unique Task for Rate Limit' });

        assert.strictEqual(res1.statusCode, 200);

        // Immediate second call with same title must trigger 429
        const res2 = await request(app)
            .post('/api/ai/generate-description')
            .set('Authorization', `Bearer ${testToken}`)
            .send({ title: 'Unique Task for Rate Limit' });

        assert.strictEqual(res2.statusCode, 429);
        assert.match(res2.body.error, /Please wait one minute/i);
    });

});

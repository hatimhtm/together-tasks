import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { detectLocationContext, saveLocationUpdate, type Location } from './geolocation.ts';

describe('Geolocation Context', () => {
    // Store original env
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset env before each test
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should detect work location correctly', () => {
        process.env.NEXT_PUBLIC_WORK_LAT = '10.0';
        process.env.NEXT_PUBLIC_WORK_LNG = '20.0';
        process.env.NEXT_PUBLIC_WORK_RADIUS = '200';
        process.env.NEXT_PUBLIC_HOME_LAT = '30.0';
        process.env.NEXT_PUBLIC_HOME_LNG = '40.0';

        const location: Location = {
            latitude: 10.0,
            longitude: 20.0,
            accuracy: 10,
            timestamp: Date.now()
        };

        const context = detectLocationContext(location);
        assert.strictEqual(context.isAtWork, true);
        assert.strictEqual(context.currentPlace, 'work');
    });

    it('should detect home location correctly', () => {
        process.env.NEXT_PUBLIC_WORK_LAT = '10.0';
        process.env.NEXT_PUBLIC_WORK_LNG = '20.0';
        process.env.NEXT_PUBLIC_HOME_LAT = '30.0';
        process.env.NEXT_PUBLIC_HOME_LNG = '40.0';
        process.env.NEXT_PUBLIC_HOME_RADIUS = '100';

        const location: Location = {
            latitude: 30.0,
            longitude: 40.0,
            accuracy: 10,
            timestamp: Date.now()
        };

        const context = detectLocationContext(location);
        assert.strictEqual(context.isAtHome, true);
        assert.strictEqual(context.currentPlace, 'home');
    });

    it('should detect commuting/unknown when far from known locations', () => {
        process.env.NEXT_PUBLIC_WORK_LAT = '10.0';
        process.env.NEXT_PUBLIC_WORK_LNG = '20.0';
        process.env.NEXT_PUBLIC_HOME_LAT = '30.0';
        process.env.NEXT_PUBLIC_HOME_LNG = '40.0';

        const location: Location = {
            latitude: 50.0,
            longitude: 60.0,
            accuracy: 10,
            timestamp: Date.now()
        };

        const context = detectLocationContext(location);
        assert.strictEqual(context.isAtWork, false);
        assert.strictEqual(context.isAtHome, false);
        assert.strictEqual(context.isCommuting, true);
        assert.strictEqual(context.currentPlace, 'unknown');
    });

    it('should handle missing environment variables gracefully', () => {
        // Clear relevant env vars
        delete process.env.NEXT_PUBLIC_WORK_LAT;
        delete process.env.NEXT_PUBLIC_WORK_LNG;
        delete process.env.NEXT_PUBLIC_HOME_LAT;
        delete process.env.NEXT_PUBLIC_HOME_LNG;

        const location: Location = {
            latitude: 10.0,
            longitude: 20.0,
            accuracy: 10,
            timestamp: Date.now()
        };

        const context = detectLocationContext(location);
        // Defaults are 0,0. So if location is not 0,0, it should be unknown.
        assert.strictEqual(context.isAtWork, false);
        assert.strictEqual(context.isAtHome, false);
        assert.strictEqual(context.currentPlace, 'unknown');
    });
});


describe('saveLocationUpdate', () => {
    let logMock: any;
    let errorMock: any;

    beforeEach(() => {
        logMock = mock.method(console, 'log', () => {});
        errorMock = mock.method(console, 'error', () => {});
    });

    afterEach(() => {
        if (logMock) logMock.mock.restore();
        if (errorMock) errorMock.mock.restore();
    });

    it('should log the location update', async () => {
        const userId = 'user-123';
        const location: Location = { latitude: 10, longitude: 20, accuracy: 5, timestamp: 12345 };
        const context = { isAtWork: false, isAtHome: true, isCommuting: false, currentPlace: 'home' as const };

        await saveLocationUpdate(userId, location, context);

        assert.strictEqual(logMock.mock.callCount(), 1);
        assert.deepStrictEqual(logMock.mock.calls[0].arguments, [
            "Local static build: location update tracked locally.",
            { userId, location, context }
        ]);
        assert.strictEqual(errorMock.mock.callCount(), 0);
    });

    it('should catch and log errors', async () => {
        const userId = 'user-123';
        const location: Location = { latitude: 10, longitude: 20, accuracy: 5, timestamp: 12345 };
        const context = { isAtWork: false, isAtHome: true, isCommuting: false, currentPlace: 'home' as const };

        const expectedError = new Error('Test error');
        logMock.mock.restore(); // restore first so we can throw
        logMock = mock.method(console, 'log', () => { throw expectedError; });

        await saveLocationUpdate(userId, location, context);

        assert.strictEqual(errorMock.mock.callCount(), 1);
        assert.deepStrictEqual(errorMock.mock.calls[0].arguments, [
            "Failed to save location:",
            expectedError
        ]);
    });
});

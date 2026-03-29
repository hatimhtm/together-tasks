import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { detectLocationContext, stopWatchingLocation, saveLocationUpdate, type Location, type LocationContext } from './geolocation.ts';

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

describe('stopWatchingLocation', () => {
    let originalNavigator: any;

    beforeEach(() => {
        originalNavigator = global.navigator;
    });

    afterEach(() => {
        if (originalNavigator === undefined) {
            delete (global as any).navigator;
        } else {
            Object.defineProperty(global, 'navigator', {
                value: originalNavigator,
                writable: true,
                configurable: true
            });
        }
    });

    it('should call clearWatch when geolocation is available', () => {
        const mockClearWatch = Object.assign(
            function(id: number) { mockClearWatch.calls.push(id); },
            { calls: [] as number[] }
        );

        Object.defineProperty(global, 'navigator', {
            value: {
                geolocation: {
                    clearWatch: mockClearWatch
                }
            },
            writable: true,
            configurable: true
        });

        stopWatchingLocation(123);

        assert.strictEqual(mockClearWatch.calls.length, 1);
        assert.strictEqual(mockClearWatch.calls[0], 123);
    });

    it('should not throw when geolocation is missing', () => {
        Object.defineProperty(global, 'navigator', {
            value: {},
            writable: true,
            configurable: true
        });

        assert.doesNotThrow(() => {
            stopWatchingLocation(456);
        });
    });
});

describe('saveLocationUpdate', () => {
    let originalConsoleLog: any;
    let originalConsoleError: any;

    beforeEach(() => {
        originalConsoleLog = console.log;
        originalConsoleError = console.error;
    });

    afterEach(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });

    it('should log the location update successfully', async () => {
        const mockConsoleLog = Object.assign(
            function(...args: any[]) { mockConsoleLog.calls.push(args); },
            { calls: [] as any[][] }
        );
        console.log = mockConsoleLog;

        const mockConsoleError = Object.assign(
            function(...args: any[]) { mockConsoleError.calls.push(args); },
            { calls: [] as any[][] }
        );
        console.error = mockConsoleError;

        const location: Location = {
            latitude: 10.0,
            longitude: 20.0,
            accuracy: 10,
            timestamp: 1234567890
        };

        const context: LocationContext = {
            isAtWork: true,
            isAtHome: false,
            isCommuting: false,
            currentPlace: 'work'
        };

        await saveLocationUpdate('user-123', location, context);

        assert.strictEqual(mockConsoleLog.calls.length, 1);
        assert.strictEqual(mockConsoleLog.calls[0][0], 'Local static build: location update tracked locally.');
        assert.deepStrictEqual(mockConsoleLog.calls[0][1], { userId: 'user-123', location, context });
        assert.strictEqual(mockConsoleError.calls.length, 0);
    });

    it('should log an error if saving fails', async () => {
        const testError = new Error('Simulated logging failure');
        const mockConsoleLog = Object.assign(
            function(...args: any[]) { throw testError; },
            { calls: [] as any[][] }
        );
        console.log = mockConsoleLog;

        const mockConsoleError = Object.assign(
            function(...args: any[]) { mockConsoleError.calls.push(args); },
            { calls: [] as any[][] }
        );
        console.error = mockConsoleError;

        const location: Location = {
            latitude: 10.0,
            longitude: 20.0,
            accuracy: 10,
            timestamp: 1234567890
        };

        const context: LocationContext = {
            isAtWork: true,
            isAtHome: false,
            isCommuting: false,
            currentPlace: 'work'
        };

        await saveLocationUpdate('user-123', location, context);

        assert.strictEqual(mockConsoleError.calls.length, 1);
        assert.strictEqual(mockConsoleError.calls[0][0], 'Failed to save location:');
        assert.strictEqual(mockConsoleError.calls[0][1], testError);
    });
});

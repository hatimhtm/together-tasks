import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { detectLocationContext, stopWatchingLocation, watchLocation, type Location } from './geolocation';

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

describe('watchLocation', () => {
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

    it('should return null when geolocation is missing', () => {
        Object.defineProperty(global, 'navigator', {
            value: {},
            writable: true,
            configurable: true
        });

        const watchId = watchLocation(() => {});
        assert.strictEqual(watchId, null);
    });

    it('should call watchPosition and invoke callback with location and context', () => {
        const mockPosition = {
            coords: {
                latitude: 10.0,
                longitude: 20.0,
                accuracy: 10
            },
            timestamp: 1234567890
        };

        const mockWatchPosition = Object.assign(
            function(successCb: Function, errorCb: Function, options: any) {
                mockWatchPosition.calls.push({ successCb, errorCb, options });
                successCb(mockPosition);
                return 42;
            },
            { calls: [] as any[] }
        );

        Object.defineProperty(global, 'navigator', {
            value: {
                geolocation: {
                    watchPosition: mockWatchPosition
                }
            },
            writable: true,
            configurable: true
        });

        const callback = Object.assign(
            function(loc: any, ctx: any) { callback.calls.push({ loc, ctx }); },
            { calls: [] as any[] }
        );

        // Mock env vars for detectLocationContext
        process.env.NEXT_PUBLIC_WORK_LAT = '10.0';
        process.env.NEXT_PUBLIC_WORK_LNG = '20.0';
        process.env.NEXT_PUBLIC_WORK_RADIUS = '200';

        const watchId = watchLocation(callback);

        assert.strictEqual(watchId, 42);
        assert.strictEqual(mockWatchPosition.calls.length, 1);
        assert.strictEqual(callback.calls.length, 1);

        const { loc, ctx } = callback.calls[0];
        assert.strictEqual(loc.latitude, 10.0);
        assert.strictEqual(loc.longitude, 20.0);
        assert.strictEqual(loc.accuracy, 10);
        assert.strictEqual(loc.timestamp, 1234567890);

        assert.strictEqual(ctx.isAtWork, true);
        assert.strictEqual(ctx.currentPlace, 'work');
    });

    it('should handle location watch errors', () => {
        const mockError = new Error('Test watch error');
        const mockWatchPosition = Object.assign(
            function(successCb: Function, errorCb: Function, options: any) {
                errorCb(mockError);
                return 43;
            },
            { calls: [] as any[] }
        );

        Object.defineProperty(global, 'navigator', {
            value: {
                geolocation: {
                    watchPosition: mockWatchPosition
                }
            },
            writable: true,
            configurable: true
        });

        const originalConsoleError = console.error;
        const consoleErrors: any[] = [];
        console.error = (...args) => consoleErrors.push(args);

        try {
            const watchId = watchLocation(() => {});
            assert.strictEqual(watchId, 43);
            assert.strictEqual(consoleErrors.length, 1);
            assert.strictEqual(consoleErrors[0][0], 'Location watch error:');
            assert.strictEqual(consoleErrors[0][1], mockError);
        } finally {
            console.error = originalConsoleError;
        }
    });
});

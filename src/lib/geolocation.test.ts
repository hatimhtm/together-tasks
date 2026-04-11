import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { detectLocationContext, stopWatchingLocation, type Location } from './geolocation.ts';

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

describe('getCurrentLocation', () => {
    let originalNavigator: any;
    let originalConsoleWarn: typeof console.warn;
    let originalConsoleError: typeof console.error;
    let warnCalls: any[][] = [];
    let errorCalls: any[][] = [];

    beforeEach(() => {
        originalNavigator = global.navigator;
        originalConsoleWarn = console.warn;
        originalConsoleError = console.error;

        warnCalls = [];
        console.warn = (...args) => { warnCalls.push(args); };

        errorCalls = [];
        console.error = (...args) => { errorCalls.push(args); };
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
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
    });

    it('should return null and warn if geolocation is not supported', async () => {
        Object.defineProperty(global, 'navigator', {
            value: {},
            writable: true,
            configurable: true
        });

        const { getCurrentLocation } = await import('./geolocation.ts');
        const location = await getCurrentLocation();

        assert.strictEqual(location, null);
        assert.strictEqual(warnCalls.length, 1);
        assert.strictEqual(warnCalls[0][0], 'Geolocation not supported');
    });

    it('should resolve with Location object on success', async () => {
        const dummyPosition = {
            coords: {
                latitude: 12.34,
                longitude: 56.78,
                accuracy: 5
            },
            timestamp: 1234567890
        };

        Object.defineProperty(global, 'navigator', {
            value: {
                geolocation: {
                    getCurrentPosition: (successCallback: any) => {
                        successCallback(dummyPosition);
                    }
                }
            },
            writable: true,
            configurable: true
        });

        const { getCurrentLocation } = await import('./geolocation.ts');
        const location = await getCurrentLocation();

        assert.notStrictEqual(location, null);
        assert.strictEqual(location?.latitude, 12.34);
        assert.strictEqual(location?.longitude, 56.78);
        assert.strictEqual(location?.accuracy, 5);
        assert.strictEqual(location?.timestamp, 1234567890);
    });

    it('should resolve with null and error log on failure', async () => {
        const dummyError = new Error('Permission denied');

        Object.defineProperty(global, 'navigator', {
            value: {
                geolocation: {
                    getCurrentPosition: (successCallback: any, errorCallback: any) => {
                        errorCallback(dummyError);
                    }
                }
            },
            writable: true,
            configurable: true
        });

        const { getCurrentLocation } = await import('./geolocation.ts');
        const location = await getCurrentLocation();

        assert.strictEqual(location, null);
        assert.strictEqual(errorCalls.length, 1);
        assert.strictEqual(errorCalls[0][0], 'Geolocation error:');
        assert.strictEqual(errorCalls[0][1], dummyError);
    });
});

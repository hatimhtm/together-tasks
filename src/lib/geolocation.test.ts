import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { detectLocationContext, getCurrentLocation, type Location } from './geolocation.ts';

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

describe('getCurrentLocation', () => {
    let originalWarn: any;
    let originalError: any;

    beforeEach(() => {
        // Save original globals
        originalWarn = console.warn;
        originalError = console.error;

        // Suppress console output during tests
        console.warn = () => {};
        console.error = () => {};

        // Ensure navigator is writable or object configurable by redefining it if necessary
        // In Node environments, `global.navigator` usually doesn't exist, but if it does and is read-only, we can overwrite it.
    });

    afterEach(() => {
        // Restore original globals
        console.warn = originalWarn;
        console.error = originalError;

        // Cleanup global navigator
        if ('navigator' in global) {
            delete (global as any).navigator;
        }
    });

    it('should return null and warn if geolocation is not supported', async () => {
        // Mock navigator without geolocation
        Object.defineProperty(global, 'navigator', {
            value: {},
            writable: true,
            configurable: true
        });

        let warnCalled = false;
        console.warn = () => { warnCalled = true; };

        const result = await getCurrentLocation();

        assert.strictEqual(result, null);
        assert.strictEqual(warnCalled, true);
    });

    it('should resolve with Location when getCurrentPosition succeeds', async () => {
        // Mock navigator with successful geolocation
        Object.defineProperty(global, 'navigator', {
            value: {
                geolocation: {
                    getCurrentPosition: (successCallback: any) => {
                        successCallback({
                            coords: {
                                latitude: 12.34,
                                longitude: 56.78,
                                accuracy: 10
                            },
                            timestamp: 1234567890
                        });
                    }
                }
            },
            writable: true,
            configurable: true
        });

        const result = await getCurrentLocation();

        assert.deepStrictEqual(result, {
            latitude: 12.34,
            longitude: 56.78,
            accuracy: 10,
            timestamp: 1234567890
        });
    });

    it('should resolve with null and log error when getCurrentPosition fails', async () => {
        // Mock navigator with failing geolocation
        Object.defineProperty(global, 'navigator', {
            value: {
                geolocation: {
                    getCurrentPosition: (_successCallback: any, errorCallback: any) => {
                        errorCallback(new Error('Permission denied'));
                    }
                }
            },
            writable: true,
            configurable: true
        });

        let errorCalled = false;
        console.error = () => { errorCalled = true; };

        const result = await getCurrentLocation();

        assert.strictEqual(result, null);
        assert.strictEqual(errorCalled, true);
    });
});

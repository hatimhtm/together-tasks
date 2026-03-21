import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { detectLocationContext, getCurrentLocation, watchLocation, stopWatchingLocation, saveLocationUpdate, type Location } from './geolocation.ts';
import { mock } from 'node:test';

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
    let originalNavigator: any;

    beforeEach(() => {
        originalNavigator = (global as any).navigator;
    });

    afterEach(() => {
        mock.restoreAll();
        if (originalNavigator === undefined) {
            // Revert by not defining it or deleting if possible
        }
    });

    it('should return null and warn if geolocation is not supported', async () => {
        const consoleWarnMock = mock.method(console, 'warn', () => {});
        Object.defineProperty(global, 'navigator', {
            value: {},
            configurable: true
        });

        const result = await getCurrentLocation();

        assert.strictEqual(result, null);
        assert.strictEqual(consoleWarnMock.mock.calls.length, 1);
    });

    it('should resolve with location on success', async () => {
        const mockGeolocation = {
            getCurrentPosition: mock.fn((successCb: Function, errorCb: Function, options: any) => {
                successCb({
                    coords: {
                        latitude: 10.0,
                        longitude: 20.0,
                        accuracy: 5
                    },
                    timestamp: 1000000
                });
            })
        };

        Object.defineProperty(global, 'navigator', {
            value: {
                geolocation: mockGeolocation
            },
            configurable: true
        });

        const result = await getCurrentLocation();

        assert.notStrictEqual(result, null);
        assert.strictEqual(result?.latitude, 10.0);
        assert.strictEqual(result?.longitude, 20.0);
        assert.strictEqual(result?.accuracy, 5);
        assert.strictEqual(result?.timestamp, 1000000);
    });

    it('should resolve with null and error on failure', async () => {
        const consoleErrorMock = mock.method(console, 'error', () => {});
        const mockGeolocation = {
            getCurrentPosition: mock.fn((successCb: Function, errorCb: Function, options: any) => {
                errorCb(new Error("Position unavailable"));
            })
        };

        Object.defineProperty(global, 'navigator', {
            value: {
                geolocation: mockGeolocation
            },
            configurable: true
        });

        const result = await getCurrentLocation();

        assert.strictEqual(result, null);
        assert.strictEqual(consoleErrorMock.mock.calls.length, 1);
    });
});

describe('watchLocation', () => {
    let originalNavigator: any;

    beforeEach(() => {
        originalNavigator = (global as any).navigator;
    });

    afterEach(() => {
        mock.restoreAll();
        if (originalNavigator === undefined) {
            // Revert by doing nothing
        }
    });

    it('should return null if geolocation is not supported', () => {
        Object.defineProperty(global, 'navigator', {
            value: {},
            configurable: true
        });
        const result = watchLocation(() => {});
        assert.strictEqual(result, null);
    });

    it('should call watchPosition and invoke callback with context', () => {
        const watchId = 123;

        // Mock getCurrentPosition/watchPosition
        const mockGeolocation = {
            watchPosition: mock.fn((successCb: Function, errorCb: Function, options: any) => {
                successCb({
                    coords: {
                        latitude: 10.0,
                        longitude: 20.0,
                        accuracy: 5
                    },
                    timestamp: 1000000
                });
                return watchId;
            })
        };

        Object.defineProperty(global, 'navigator', {
            value: {
                geolocation: mockGeolocation
            },
            configurable: true
        });

        const callback = mock.fn();
        const result = watchLocation(callback);

        assert.strictEqual(result, watchId);
        assert.strictEqual(mockGeolocation.watchPosition.mock.calls.length, 1);
        assert.strictEqual(callback.mock.calls.length, 1);

        const [location, context] = callback.mock.calls[0].arguments;
        assert.strictEqual(location.latitude, 10.0);
        assert.strictEqual(location.longitude, 20.0);
        assert.strictEqual(location.accuracy, 5);
        assert.strictEqual(location.timestamp, 1000000);
        assert.strictEqual(typeof context.isAtWork, 'boolean');
    });

    it('should handle errors in watchPosition', () => {
        const consoleErrorMock = mock.method(console, 'error', () => {});
        const watchId = 456;
        const mockGeolocation = {
            watchPosition: mock.fn((successCb: Function, errorCb: Function, options: any) => {
                errorCb(new Error("Position unavailable"));
                return watchId;
            })
        };

        Object.defineProperty(global, 'navigator', {
            value: {
                geolocation: mockGeolocation
            },
            configurable: true
        });

        const callback = mock.fn();
        const result = watchLocation(callback);

        assert.strictEqual(result, watchId);
        assert.strictEqual(mockGeolocation.watchPosition.mock.calls.length, 1);
        assert.strictEqual(callback.mock.calls.length, 0);
        assert.strictEqual(consoleErrorMock.mock.calls.length, 1);
    });
});

describe('stopWatchingLocation', () => {
    let originalNavigator: any;

    beforeEach(() => {
        originalNavigator = (global as any).navigator;
    });

    afterEach(() => {
        mock.restoreAll();
        if (originalNavigator === undefined) {
            // Revert by doing nothing
        }
    });

    it('should call clearWatch if geolocation is supported', () => {
        const mockGeolocation = {
            clearWatch: mock.fn()
        };

        Object.defineProperty(global, 'navigator', {
            value: {
                geolocation: mockGeolocation
            },
            configurable: true
        });

        stopWatchingLocation(123);
        assert.strictEqual(mockGeolocation.clearWatch.mock.calls.length, 1);
        assert.strictEqual(mockGeolocation.clearWatch.mock.calls[0].arguments[0], 123);
    });

    it('should do nothing if geolocation is not supported', () => {
        Object.defineProperty(global, 'navigator', {
            value: {},
            configurable: true
        });

        assert.doesNotThrow(() => {
            stopWatchingLocation(123);
        });
    });
});

describe('saveLocationUpdate', () => {
    let consoleLogMock: any;
    let consoleErrorMock: any;

    beforeEach(() => {
        consoleLogMock = mock.method(console, 'log', () => {});
        consoleErrorMock = mock.method(console, 'error', () => {});
    });

    afterEach(() => {
        mock.restoreAll();
    });

    it('should log location update to console', async () => {
        const location: Location = { latitude: 10, longitude: 20, accuracy: 5, timestamp: 1000 };
        const context = { isAtWork: true, isAtHome: false, isCommuting: false, currentPlace: 'work' as const };

        await saveLocationUpdate('user1', location, context);

        assert.strictEqual(consoleLogMock.mock.calls.length, 1);
        assert.strictEqual(consoleErrorMock.mock.calls.length, 0);
    });

    it('should catch and log errors', async () => {
        const error = new Error('Test error');
        consoleLogMock.mock.restore();
        consoleLogMock = mock.method(console, 'log', () => { throw error; });

        const location: Location = { latitude: 10, longitude: 20, accuracy: 5, timestamp: 1000 };
        const context = { isAtWork: true, isAtHome: false, isCommuting: false, currentPlace: 'work' as const };

        await saveLocationUpdate('user1', location, context);

        assert.strictEqual(consoleErrorMock.mock.calls.length, 1);
        assert.strictEqual(consoleErrorMock.mock.calls[0].arguments[1], error);
    });
});

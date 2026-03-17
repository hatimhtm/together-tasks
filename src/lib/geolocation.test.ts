import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import {
  detectLocationContext,
  watchLocation,
  stopWatchingLocation,
  type Location,
} from "./geolocation.ts";
import { mock } from "node:test";

describe("Geolocation Context", () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should detect work location correctly", () => {
    process.env.NEXT_PUBLIC_WORK_LAT = "10.0";
    process.env.NEXT_PUBLIC_WORK_LNG = "20.0";
    process.env.NEXT_PUBLIC_WORK_RADIUS = "200";
    process.env.NEXT_PUBLIC_HOME_LAT = "30.0";
    process.env.NEXT_PUBLIC_HOME_LNG = "40.0";

    const location: Location = {
      latitude: 10.0,
      longitude: 20.0,
      accuracy: 10,
      timestamp: Date.now(),
    };

    const context = detectLocationContext(location);
    assert.strictEqual(context.isAtWork, true);
    assert.strictEqual(context.currentPlace, "work");
  });

  it("should detect home location correctly", () => {
    process.env.NEXT_PUBLIC_WORK_LAT = "10.0";
    process.env.NEXT_PUBLIC_WORK_LNG = "20.0";
    process.env.NEXT_PUBLIC_HOME_LAT = "30.0";
    process.env.NEXT_PUBLIC_HOME_LNG = "40.0";
    process.env.NEXT_PUBLIC_HOME_RADIUS = "100";

    const location: Location = {
      latitude: 30.0,
      longitude: 40.0,
      accuracy: 10,
      timestamp: Date.now(),
    };

    const context = detectLocationContext(location);
    assert.strictEqual(context.isAtHome, true);
    assert.strictEqual(context.currentPlace, "home");
  });

  it("should detect commuting/unknown when far from known locations", () => {
    process.env.NEXT_PUBLIC_WORK_LAT = "10.0";
    process.env.NEXT_PUBLIC_WORK_LNG = "20.0";
    process.env.NEXT_PUBLIC_HOME_LAT = "30.0";
    process.env.NEXT_PUBLIC_HOME_LNG = "40.0";

    const location: Location = {
      latitude: 50.0,
      longitude: 60.0,
      accuracy: 10,
      timestamp: Date.now(),
    };

    const context = detectLocationContext(location);
    assert.strictEqual(context.isAtWork, false);
    assert.strictEqual(context.isAtHome, false);
    assert.strictEqual(context.isCommuting, true);
    assert.strictEqual(context.currentPlace, "unknown");
  });

  it("should handle missing environment variables gracefully", () => {
    // Clear relevant env vars
    delete process.env.NEXT_PUBLIC_WORK_LAT;
    delete process.env.NEXT_PUBLIC_WORK_LNG;
    delete process.env.NEXT_PUBLIC_HOME_LAT;
    delete process.env.NEXT_PUBLIC_HOME_LNG;

    const location: Location = {
      latitude: 10.0,
      longitude: 20.0,
      accuracy: 10,
      timestamp: Date.now(),
    };

    const context = detectLocationContext(location);
    // Defaults are 0,0. So if location is not 0,0, it should be unknown.
    assert.strictEqual(context.isAtWork, false);
    assert.strictEqual(context.isAtHome, false);
    assert.strictEqual(context.currentPlace, "unknown");
  });
});

describe("watchLocation", () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    if (originalNavigator === undefined) {
      delete (globalThis as any).navigator;
    } else {
      globalThis.navigator = originalNavigator;
    }
  });

  it("returns null if geolocation is missing", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      writable: true,
      configurable: true,
    });
    const watchId = watchLocation(() => {});
    assert.strictEqual(watchId, null);
  });

  it("calls watchPosition and returns watchId", () => {
    const mockWatchPosition = mock.fn(() => 123);
    Object.defineProperty(globalThis, "navigator", {
      value: {
        geolocation: {
          watchPosition: mockWatchPosition,
        },
      },
      writable: true,
      configurable: true,
    });

    const watchId = watchLocation(() => {});
    assert.strictEqual(watchId, 123);
    assert.strictEqual(mockWatchPosition.mock.calls.length, 1);
  });

  it("calls callback with correct parameters on success", () => {
    let successCallback: any;
    const mockWatchPosition = mock.fn((success, error, options) => {
      successCallback = success;
      return 123;
    });

    Object.defineProperty(globalThis, "navigator", {
      value: {
        geolocation: {
          watchPosition: mockWatchPosition,
        },
      },
      writable: true,
      configurable: true,
    });

    const myCallback = mock.fn();
    watchLocation(myCallback);

    // trigger success callback
    successCallback({
      coords: { latitude: 10, longitude: 20, accuracy: 5 },
      timestamp: 1000,
    });

    assert.strictEqual(myCallback.mock.calls.length, 1);
    const args = myCallback.mock.calls[0].arguments;
    assert.strictEqual(args[0].latitude, 10);
    assert.strictEqual(args[0].longitude, 20);
    assert.strictEqual(args[0].accuracy, 5);
    assert.strictEqual(args[0].timestamp, 1000);
    assert.ok("isAtWork" in args[1]); // context check
  });

  it("handles errors by logging to console", () => {
    let errorCallback: any;
    const mockWatchPosition = mock.fn((success, error, options) => {
      errorCallback = error;
      return 123;
    });

    Object.defineProperty(globalThis, "navigator", {
      value: {
        geolocation: {
          watchPosition: mockWatchPosition,
        },
      },
      writable: true,
      configurable: true,
    });

    const mockConsoleError = mock.method(console, "error", () => {});

    watchLocation(() => {});

    errorCallback(new Error("Test error"));

    assert.strictEqual(mockConsoleError.mock.calls.length, 1);
    assert.strictEqual(
      mockConsoleError.mock.calls[0].arguments[0],
      "Location watch error:",
    );
  });
});

describe("stopWatchingLocation", () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    if (originalNavigator === undefined) {
      delete (globalThis as any).navigator;
    } else {
      globalThis.navigator = originalNavigator;
    }
  });

  it("does nothing if geolocation is not supported", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      writable: true,
      configurable: true,
    });
    // Should not throw
    stopWatchingLocation(123);
  });

  it("calls clearWatch if geolocation is supported", () => {
    const mockClearWatch = mock.fn();
    Object.defineProperty(globalThis, "navigator", {
      value: {
        geolocation: {
          clearWatch: mockClearWatch,
        },
      },
      writable: true,
      configurable: true,
    });

    stopWatchingLocation(123);
    assert.strictEqual(mockClearWatch.mock.calls.length, 1);
    assert.strictEqual(mockClearWatch.mock.calls[0].arguments[0], 123);
  });
});

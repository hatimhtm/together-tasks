import { test, describe, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

// Setup JSDOM environment globally before importing React
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost'
});

Object.defineProperty(global, 'window', { value: dom.window, writable: true });
Object.defineProperty(global, 'document', { value: dom.window.document, writable: true });
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, writable: true });

global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: mock.fn((key: string) => store[key] || null),
    setItem: mock.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: () => {
      store = {};
    }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

describe('useAiNudge', () => {
    let renderHook: any;
    let act: any;
    let waitFor: any;
    let useAiNudge: any;

    let mockCapacitor: any;
    let mockLocalNotifications: any;

    before(async () => {
        // Pre-mock using require.cache or global since mock.module is not available in this Node version
        mockCapacitor = {
            isNativePlatform: mock.fn(() => false)
        };
        mockLocalNotifications = {
            requestPermissions: mock.fn(() => Promise.resolve({ display: 'granted' })),
            schedule: mock.fn(() => Promise.resolve())
        };

        // Inject into require cache for tsx to pick it up when importing use-ai-nudge
        const Module = require('module');
        const originalRequire = Module.prototype.require;
        Module.prototype.require = function(path: string) {
            if (path === '@capacitor/core') {
                return { Capacitor: mockCapacitor };
            }
            if (path === '@capacitor/local-notifications') {
                return { LocalNotifications: mockLocalNotifications };
            }
            return originalRequire.apply(this, arguments);
        };

        // Import libraries after JSDOM setup
        const testingLibrary = await import('@testing-library/react');
        renderHook = testingLibrary.renderHook;
        act = testingLibrary.act;
        waitFor = testingLibrary.waitFor;

        const hookModule = await import('./use-ai-nudge.ts');
        useAiNudge = hookModule.useAiNudge;

        // Restore require just in case
        Module.prototype.require = originalRequire;
    });

    beforeEach(() => {
        localStorageMock.clear();
        localStorageMock.getItem.mock.resetCalls();
        localStorageMock.setItem.mock.resetCalls();

        // Mock Notification API
        (global.window as any).Notification = function Notification(title: string, options?: any) {
            // Mock constructor
        };
        (global.window as any).Notification.permission = 'default';
        (global.window as any).Notification.requestPermission = mock.fn(() => Promise.resolve('granted'));

        Object.defineProperty(global, 'Notification', {
            value: (global.window as any).Notification,
            writable: true
        });

        mockCapacitor.isNativePlatform.mock.mockImplementation(() => false);
        mockLocalNotifications.requestPermissions.mock.mockImplementation(() => Promise.resolve({ display: 'granted' }));
        mockLocalNotifications.schedule.mock.mockImplementation(() => Promise.resolve());
    });

    test('should initialize and set a random nudge on web without existing notification', async () => {
        const { result } = renderHook(() => useAiNudge());

        assert.strictEqual(result.current.loading, true);

        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        assert.ok(typeof result.current.nudge === 'string');
        assert.ok(result.current.nudge.length > 0);

        // LocalStorage should have been updated
        assert.strictEqual(localStorageMock.setItem.mock.calls.length, 1);
        assert.strictEqual(localStorageMock.setItem.mock.calls[0].arguments[0], 'last_ai_nudge_time');
    });

    test('should not trigger notification if within 4 hours', async () => {
        const now = new Date().getTime();
        localStorageMock.setItem('last_ai_nudge_time', now.toString());
        localStorageMock.setItem.mock.resetCalls();

        const { result } = renderHook(() => useAiNudge());

        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        // LocalStorage should NOT have been updated with a new time
        assert.strictEqual(localStorageMock.setItem.mock.calls.length, 0);
    });

    test('should trigger native notification on native platform', async () => {
        // Change to native platform
        mockCapacitor.isNativePlatform.mock.mockImplementation(() => true);

        const { result } = renderHook(() => useAiNudge());

        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        // Verify native schedule was called
        assert.strictEqual(mockLocalNotifications.schedule.mock.calls.length, 1);
    });

    test('should handle web notification permission denied', async () => {
        (global.window as any).Notification.permission = 'denied';
        (global.window as any).Notification.requestPermission = mock.fn(() => Promise.resolve('denied'));

        const { result } = renderHook(() => useAiNudge());

        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        assert.strictEqual(localStorageMock.setItem.mock.calls.length, 1);
        // It should still set nudge and localstorage, but simply won't show the notification
        assert.ok(typeof result.current.nudge === 'string');
    });
});

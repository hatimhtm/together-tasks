import { test, describe, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

// Setup JSDOM environment globally before importing React
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost'
});

Object.defineProperty(global, 'window', {
  value: dom.window,
  writable: true
});
Object.defineProperty(global, 'document', {
  value: dom.window.document,
  writable: true
});
Object.defineProperty(global, 'navigator', {
  value: dom.window.navigator,
  writable: true
});
Object.defineProperty(global, 'Event', {
  value: dom.window.Event,
  writable: true
});
Object.defineProperty(global, 'CustomEvent', {
  value: dom.window.CustomEvent,
  writable: true
});
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill minimal requestAnimationFrame for React
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

describe('useRealtimeProfile', () => {
    let renderHook: any;
    let act: any;
    let waitFor: any;
    let useRealtimeProfile: any;

    // Mocks
    let mockSupabase: any;
    let mockChannel: any;
    let mockSelect: any;
    let mockEq: any;
    let mockSingle: any;

    before(async () => {
        mockChannel = {
            on: mock.fn(() => mockChannel),
            subscribe: mock.fn(() => mockChannel),
            unsubscribe: mock.fn()
        };

        mockSingle = mock.fn();
        mockEq = mock.fn(() => ({
            single: mockSingle
        }));
        mockSelect = mock.fn(() => ({
            eq: mockEq
        }));

        mockSupabase = {
            from: mock.fn(() => ({
                select: mockSelect
            })),
            channel: mock.fn(() => mockChannel)
        };

        // Mock via global injection
        process.env.NODE_ENV = 'test';
        (global as any).__MOCK_SUPABASE__ = mockSupabase;

        // Import libraries after mocks and JSDOM setup
        const testingLibrary = await import('@testing-library/react');
        renderHook = testingLibrary.renderHook;
        act = testingLibrary.act;
        waitFor = testingLibrary.waitFor;

        // Import the hook
        const hookModule = await import('./use-realtime-profile.ts');
        useRealtimeProfile = hookModule.useRealtimeProfile;
    });

    beforeEach(() => {
        // Reset mocks
        mockSelect.mock.resetCalls();
        mockEq.mock.resetCalls();
        mockSingle.mock.resetCalls();
        mockChannel.on.mock.resetCalls();
        mockChannel.subscribe.mock.resetCalls();
        mockChannel.unsubscribe.mock.resetCalls();
        mockSupabase.from.mock.resetCalls();
        mockSupabase.channel.mock.resetCalls();

        mockSingle.mock.mockImplementation(() => Promise.resolve({ data: null, error: null }));
    });

    test('should fetch profile on mount', async () => {
        const initialProfile = { id: 'user1', username: 'TestUser', role: 'king' };
        mockSingle.mock.mockImplementation(() => Promise.resolve({ data: initialProfile, error: null }));

        const { result } = renderHook(() => useRealtimeProfile('user1'));

        // Initially loading
        assert.strictEqual(result.current.loading, true);

        // Wait for profile to load
        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        assert.deepStrictEqual(result.current.profile, initialProfile);

        // Verify Supabase calls
        assert.strictEqual(mockSupabase.from.mock.calls.length, 1);
        assert.strictEqual(mockSelect.mock.calls.length, 1);
        assert.strictEqual(mockEq.mock.calls.length, 1);
        assert.strictEqual(mockSingle.mock.calls.length, 1);

        assert.strictEqual(mockEq.mock.calls[0].arguments[0], 'id');
        assert.strictEqual(mockEq.mock.calls[0].arguments[1], 'user1');
    });

    test('should setup realtime subscription', async () => {
        const { result } = renderHook(() => useRealtimeProfile('user1'));

        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        assert.strictEqual(mockSupabase.channel.mock.calls.length, 1);
        assert.strictEqual(mockSupabase.channel.mock.calls[0].arguments[0], 'profile-user1');
        assert.strictEqual(mockChannel.on.mock.calls.length, 1);
        assert.strictEqual(mockChannel.subscribe.mock.calls.length, 1);

        const onArgs = mockChannel.on.mock.calls[0].arguments;
        assert.strictEqual(onArgs[0], 'postgres_changes');
        assert.strictEqual(onArgs[1].event, 'UPDATE');
        assert.strictEqual(onArgs[1].schema, 'public');
        assert.strictEqual(onArgs[1].table, 'profiles');
        assert.strictEqual(onArgs[1].filter, 'id=eq.user1');
    });

    test('should update profile via realtime event', async () => {
        const initialProfile = { id: 'user1', username: 'OldName', streak: 1 };
        mockSingle.mock.mockImplementation(() => Promise.resolve({ data: initialProfile, error: null }));

        const { result } = renderHook(() => useRealtimeProfile('user1'));

        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        assert.deepStrictEqual(result.current.profile, initialProfile);

        const onCall = mockChannel.on.mock.calls[0];
        const callback = onCall.arguments[2];

        const updatedProfile = { ...initialProfile, username: 'NewName', streak: 2 };

        // Simulate realtime event
        act(() => {
            callback({
                eventType: 'UPDATE',
                new: updatedProfile,
                old: initialProfile
            });
        });

        await waitFor(() => {
            assert.strictEqual(result.current.profile.username, 'NewName');
            assert.strictEqual(result.current.profile.streak, 2);
        });
    });

    test('should return empty/null profile if userId is not provided', async () => {
        const { result } = renderHook(() => useRealtimeProfile(undefined));

        // State remains initial loading since we skip fetch
        assert.strictEqual(result.current.profile, null);
        assert.strictEqual(result.current.loading, true); // Loading doesn't get set to false if returning early

        assert.strictEqual(mockSupabase.from.mock.calls.length, 0);
        assert.strictEqual(mockSupabase.channel.mock.calls.length, 0);
    });

    test('should handle fetch errors', async () => {
        const originalConsoleError = console.error;
        console.error = () => {}; // Suppress error logging

        try {
            const errorObj = new Error('Fetch failed');
            mockSingle.mock.mockImplementation(() => Promise.resolve({ data: null, error: errorObj }));

            const { result } = renderHook(() => useRealtimeProfile('user1'));

            await waitFor(() => {
                assert.strictEqual(result.current.loading, false);
            });

            assert.strictEqual(result.current.profile, null);
        } finally {
            console.error = originalConsoleError;
        }
    });

    test('should cleanup subscription on unmount', async () => {
        const { unmount } = renderHook(() => useRealtimeProfile('user1'));

        unmount();

        assert.strictEqual(mockChannel.unsubscribe.mock.calls.length, 1);
    });
});

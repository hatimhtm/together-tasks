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
    let mockFrom: any;
    let mockSelect: any;
    let mockEq: any;
    let mockSingle: any;

    before(async () => {
        // Mock Supabase client
        mockChannel = {
            on: mock.fn(() => mockChannel),
            subscribe: mock.fn(() => mockChannel),
            unsubscribe: mock.fn()
        };

        mockSingle = mock.fn(() => Promise.resolve({ data: null, error: null }));
        mockEq = mock.fn(() => ({ single: mockSingle }));
        mockSelect = mock.fn(() => ({ eq: mockEq }));
        mockFrom = mock.fn(() => ({ select: mockSelect }));

        mockSupabase = {
            from: mockFrom,
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
        mockFrom.mock.resetCalls();
        mockSelect.mock.resetCalls();
        mockEq.mock.resetCalls();
        mockSingle.mock.resetCalls();
        mockChannel.on.mock.resetCalls();
        mockChannel.subscribe.mock.resetCalls();
        mockChannel.unsubscribe.mock.resetCalls();
        mockSupabase.channel.mock.resetCalls();

        // Reset specific mock implementations if needed
        mockSingle.mock.mockImplementation(() => Promise.resolve({ data: null, error: null }));
    });

    test('should return loading and null profile when userId is undefined', async () => {
        const { result } = renderHook(() => useRealtimeProfile(undefined));

        assert.strictEqual(result.current.loading, true);
        assert.strictEqual(result.current.profile, null);

        assert.strictEqual(mockFrom.mock.calls.length, 0);
        assert.strictEqual(mockSupabase.channel.mock.calls.length, 0);
    });

    test('should fetch profile on mount and set loading to false', async () => {
        const mockProfile = {
            id: 'user1',
            username: 'TestUser',
            role: 'king',
            streak: 5
        };

        mockSingle.mock.mockImplementation(() => Promise.resolve({ data: mockProfile, error: null }));

        const { result } = renderHook(() => useRealtimeProfile('user1'));

        // Initially loading
        assert.strictEqual(result.current.loading, true);
        assert.strictEqual(result.current.profile, null);

        // Wait for profile to load
        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        assert.strictEqual(result.current.profile.username, 'TestUser');
        assert.strictEqual(result.current.profile.streak, 5);

        // Verify Supabase calls
        assert.strictEqual(mockFrom.mock.calls.length, 1);
        assert.strictEqual(mockFrom.mock.calls[0].arguments[0], 'profiles');

        assert.strictEqual(mockSelect.mock.calls.length, 1);
        assert.strictEqual(mockSelect.mock.calls[0].arguments[0], '*');

        assert.strictEqual(mockEq.mock.calls.length, 1);
        assert.deepStrictEqual(mockEq.mock.calls[0].arguments, ['id', 'user1']);

        assert.strictEqual(mockSingle.mock.calls.length, 1);
    });

    test('should setup realtime subscription for the user', async () => {
        mockSingle.mock.mockImplementation(() => Promise.resolve({ data: { id: 'user1' }, error: null }));

        const { result } = renderHook(() => useRealtimeProfile('user1'));

        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        assert.strictEqual(mockSupabase.channel.mock.calls.length, 1);
        assert.strictEqual(mockSupabase.channel.mock.calls[0].arguments[0], 'profile-user1');

        assert.strictEqual(mockChannel.on.mock.calls.length, 1);
        assert.strictEqual(mockChannel.on.mock.calls[0].arguments[0], 'postgres_changes');

        const filterArg = mockChannel.on.mock.calls[0].arguments[1];
        assert.strictEqual(filterArg.event, 'UPDATE');
        assert.strictEqual(filterArg.schema, 'public');
        assert.strictEqual(filterArg.table, 'profiles');
        assert.strictEqual(filterArg.filter, 'id=eq.user1');

        assert.strictEqual(mockChannel.subscribe.mock.calls.length, 1);
    });

    test('should update profile via realtime update', async () => {
        const initialProfile = { id: 'user1', username: 'User1', streak: 1 };
        mockSingle.mock.mockImplementation(() => Promise.resolve({ data: initialProfile, error: null }));

        const { result } = renderHook(() => useRealtimeProfile('user1'));

        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
            assert.strictEqual(result.current.profile.streak, 1);
        });

        const onCall = mockChannel.on.mock.calls[0];
        const callback = onCall.arguments[2];

        const updatedProfile = { ...initialProfile, streak: 2 };

        act(() => {
            callback({
                eventType: 'UPDATE',
                new: updatedProfile,
                old: { id: 'user1' }
            });
        });

        await waitFor(() => {
            assert.strictEqual(result.current.profile.streak, 2);
        });
    });

    test('should handle fetch errors gracefully', async () => {
        mockSingle.mock.mockImplementation(() => Promise.resolve({ data: null, error: new Error('Fetch failed') }));

        const originalConsoleError = console.error;
        console.error = mock.fn();

        const { result } = renderHook(() => useRealtimeProfile('user1'));

        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        assert.strictEqual(result.current.profile, null);
        assert.strictEqual((console.error as any).mock.calls.length, 1);

        console.error = originalConsoleError;
    });

    test('should unsubscribe from channel on unmount', async () => {
        mockSingle.mock.mockImplementation(() => Promise.resolve({ data: { id: 'user1' }, error: null }));

        const { result, unmount } = renderHook(() => useRealtimeProfile('user1'));

        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        unmount();

        assert.strictEqual(mockChannel.unsubscribe.mock.calls.length, 1);
    });
});
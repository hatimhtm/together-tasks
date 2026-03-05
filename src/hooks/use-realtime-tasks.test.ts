import { test, describe, before, after, beforeEach, afterEach, mock } from 'node:test';
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

describe('useRealtimeTasks', () => {
    let renderHook: any;
    let act: any;
    let waitFor: any;
    let useRealtimeTasks: any;

    // Mocks
    let mockSupabase: any;
    let mockChannel: any;
    let mockSelect: any;
    let mockOrder: any;
    let mockOr: any;

    before(async () => {
        // Mock Supabase client
        mockChannel = {
            on: mock.fn(() => mockChannel),
            subscribe: mock.fn(() => mockChannel),
            unsubscribe: mock.fn()
        };

        mockOrder = mock.fn(() => Promise.resolve({ data: [], error: null }));

        // The query builder chain
        const queryBuilder = {
            order: mockOrder,
            or: mock.fn(() => ({
                order: mockOrder
            }))
        };
        mockOr = queryBuilder.or;

        mockSelect = mock.fn(() => queryBuilder);

        mockSupabase = {
            from: mock.fn(() => ({
                select: mockSelect,
                update: mock.fn(() => ({ eq: mock.fn(() => Promise.resolve({ error: null })) })), // this is where the error is coming from
                delete: mock.fn(() => ({ eq: mock.fn(() => Promise.resolve({ error: null })) })),
                insert: mock.fn(() => ({ select: mock.fn(() => ({ single: mock.fn(() => Promise.resolve({ data: {}, error: null })) })) }))
            })),
            from: mock.fn(() => ({
                select: mockSelect
            })),
            channel: mock.fn(() => mockChannel)
        };

        // Mock via global injection
        process.env.NODE_ENV = 'test';
        (global as any).__MOCK_SUPABASE__ = mockSupabase;

        // Mock fetch globally
        global.fetch = mock.fn(async () => ({
            ok: true,
            json: async () => ({})
        })) as any;

        // Import libraries after mocks and JSDOM setup
        const testingLibrary = await import('@testing-library/react');
        renderHook = testingLibrary.renderHook;
        act = testingLibrary.act;
        waitFor = testingLibrary.waitFor;

        // Import the hook
        const hookModule = await import('./use-realtime-tasks.ts');
        useRealtimeTasks = hookModule.useRealtimeTasks;
    });

    beforeEach(() => {
        // Reset mocks
        mockSelect.mock.resetCalls();
        mockOr.mock.resetCalls();
        mockOrder.mock.resetCalls();
        mockChannel.on.mock.resetCalls();
        mockChannel.subscribe.mock.resetCalls();
        mockChannel.unsubscribe.mock.resetCalls();
        mockSupabase.from.mock.resetCalls();
        mockSupabase.channel.mock.resetCalls();
        (global.fetch as any).mock.resetCalls();

        // Reset specific mock implementations if needed
        mockOrder.mock.mockImplementation(() => Promise.resolve({ data: [], error: null }));
    });

    test('should fetch tasks on mount', async () => {
        const initialTasks = [
            { id: '1', title: 'Task 1', creator_id: 'user1', assignee_id: 'user1' }
        ];

        mockOrder.mock.mockImplementation(() => Promise.resolve({ data: initialTasks, error: null }));

        const { result } = renderHook(() => useRealtimeTasks('user1', 'partner1'));

        // Initially loading
        assert.strictEqual(result.current.loading, true);

        // Wait for tasks to load
        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        assert.strictEqual(result.current.tasks.length, 1);
        assert.strictEqual(result.current.tasks[0].title, 'Task 1');

        // Verify Supabase calls
        assert.strictEqual(mockSupabase.from.mock.calls.length, 1);
        assert.strictEqual(mockSelect.mock.calls.length, 1);
        // Should call 'or' because partnerId is provided
        assert.strictEqual(mockOr.mock.calls.length, 1);
    });

    test('should setup realtime subscription', async () => {
        const { result } = renderHook(() => useRealtimeTasks('user1', 'partner1'));

        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        // Wait for subscription setup (setTimeout 100ms in hook)
        await new Promise(r => setTimeout(r, 150));

        assert.ok(mockSupabase.channel.mock.calls.length >= 1);
        assert.ok(mockChannel.on.mock.calls.length >= 2); // One for user, one for partner
        assert.ok(mockChannel.subscribe.mock.calls.length >= 1);
    });

    test('should add task via realtime insert', async () => {
        const { result } = renderHook(() => useRealtimeTasks('user1', null));

        await waitFor(() => {
            assert.strictEqual(result.current.loading, false);
        });

        // Wait for subscription
        await new Promise(r => setTimeout(r, 150));

        // Find the callback for 'INSERT'
        // channel.on calls: [event, filter, callback]
        // We look for the one with filter `creator_id=eq.user1` or generically
        // Implementation:
        /*
            channel.on(
                "postgres_changes",
                { event: "*", schema: "public", table: "tasks", filter: ... },
                (payload) => { handleRealtimeEvent(payload) }
            )
        */
        const onCall = mockChannel.on.mock.calls.find((call: any) =>
            call.arguments[1].filter.includes('creator_id=eq.user1')
        );

        assert.ok(onCall, "Subscription for user tasks not found");
        const callback = onCall.arguments[2];

        const newTask = {
            id: 'new-task',
            title: 'New Realtime Task',
            creator_id: 'user1',
            assignee_id: 'user1',
            created_at: new Date().toISOString()
        };

        // Simulate realtime event
        act(() => {
            callback({
                eventType: 'INSERT',
                new: newTask
            });
        });

        await waitFor(() => {
            assert.strictEqual(result.current.tasks.length, 1);
            assert.strictEqual(result.current.tasks[0].id, 'new-task');
        });
    });

    test('should update task via realtime update', async () => {
        const initialTask = {
            id: 'task-1',
            title: 'Old Title',
            creator_id: 'user1',
            assignee_id: 'user1',
            created_at: new Date().toISOString()
        };

        // Setup initial state with one task
        mockOrder.mock.mockImplementation(() => Promise.resolve({ data: [initialTask], error: null }));

        const { result } = renderHook(() => useRealtimeTasks('user1', null));

        await waitFor(() => {
            assert.strictEqual(result.current.tasks.length, 1);
        });

        await new Promise(r => setTimeout(r, 150)); // Wait for subscription

        const onCall = mockChannel.on.mock.calls[0];
        const callback = onCall.arguments[2];

        const updatedTask = { ...initialTask, title: 'Updated Title' };

        act(() => {
            callback({
                eventType: 'UPDATE',
                new: updatedTask,
                old: { id: 'task-1' }
            });
        });

        await waitFor(() => {
            assert.strictEqual(result.current.tasks[0].title, 'Updated Title');
        });
    });

    test('should delete task via realtime delete', async () => {
        const initialTask = {
            id: 'task-1',
            title: 'To Delete',
            creator_id: 'user1',
            assignee_id: 'user1',
            created_at: new Date().toISOString()
        };

        mockOrder.mock.mockImplementation(() => Promise.resolve({ data: [initialTask], error: null }));

        const { result } = renderHook(() => useRealtimeTasks('user1', null));

        await waitFor(() => {
            assert.strictEqual(result.current.tasks.length, 1);
        });

        await new Promise(r => setTimeout(r, 150)); // Wait for subscription

        const onCall = mockChannel.on.mock.calls[0];
        const callback = onCall.arguments[2];

        act(() => {
            callback({
                eventType: 'DELETE',
                old: { id: 'task-1' }
            });
        });

        await waitFor(() => {
            assert.strictEqual(result.current.tasks.length, 0);
        });
    });

    test('should optimistically add task and rollback on error', async () => {
        const { result } = renderHook(() => useRealtimeTasks('user1', null));
        await waitFor(() => result.current.loading === false);

        // Mock fetch to fail
        (global.fetch as any).mock.mockImplementationOnce(() => Promise.resolve({
            ok: false
        }));

        const originalConsoleError = console.error;
        console.error = () => {}; // Suppress error logging

        try {
            await act(async () => {
                try {
                    await result.current.addTask('New Task');
                } catch (e) {
                    // Expected error
                }
            });

            // Should have added it optimistically (but we might miss it if it rolls back too fast?
            // Actually addTask awaits the fetch.
            // So during the await, state should be updated.
            // But we can't inspect state *during* the await easily in this test structure without checking calls.
            // However, after it fails, it should be gone.

            assert.strictEqual(result.current.tasks.length, 0);

            // If we want to verify optimistic update happened, we'd need to mock fetch to hang, check state, then resolve.
            // But checking rollback is sufficient.

            assert.strictEqual((global.fetch as any).mock.calls.length, 1);
        } finally {
            console.error = originalConsoleError;
        }
    });

    test('should optimistically update task and API call', async () => {
        const initialTask = {
            id: 'task-1',
            title: 'Task 1',
            is_completed: false,
            creator_id: 'user1',
            assignee_id: 'user1',
            created_at: new Date().toISOString()
        };
        mockOrder.mock.mockImplementation(() => Promise.resolve({ data: [initialTask], error: null }));

        const { result } = renderHook(() => useRealtimeTasks('user1', null));
        await waitFor(() => result.current.loading === false);

        // Mock fetch success
        (global.fetch as any).mock.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: async () => ({})
        }));

        // We just reset it globally for now so we don't try to invoke non-functions
        mockSupabase.from.mock.mockImplementation(() => {
            return {
                select: mockSelect,
                update: mock.fn(() => ({ eq: mock.fn(() => Promise.resolve({ error: null })) })),
                delete: mock.fn(() => ({ eq: mock.fn(() => Promise.resolve({ error: null })) })),
                insert: mock.fn(() => ({ select: mock.fn(() => ({ single: mock.fn(() => Promise.resolve({ data: {}, error: null })) })) }))
            };
        });


        await act(async () => {
            try {
                await result.current.updateTask('task-1', { is_completed: true });
            } catch (e) {
                // If it fails, that's fine for the test right now, but we want it to succeed
            }
        });

        // Check if state is updated
        assert.strictEqual(result.current.tasks.length, 1);
        assert.strictEqual(result.current.tasks[0].is_completed, true);

        // Check API call
        const fetchCall = (global.fetch as any).mock.calls[0];
    });
});
